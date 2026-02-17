import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import prisma from "../../db/client.js";
import redis from "../../db/redis.js";
import { verifyPkceChallenge, generateTokens, generateIdToken, verifyPassword, hashPassword } from "../../core/crypto.js";

export const authorize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { client_id, response_type, redirect_uri, scope, code_challenge, code_challenge_method } = req.query;

    if (!req.user || !req.user.sub) {
      // Should be handled by middleware, but double check
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (response_type !== "code") {
      res.status(400).json({ error: "unsupported_response_type" });
      return;
    }

    if (code_challenge_method !== "S256") {
      res.status(400).json({ error: "invalid_request", error_description: "Only S256 code_challenge_method is supported" });
      return;
    }

    if (!code_challenge) {
      res.status(400).json({ error: "invalid_request", error_description: "code_challenge is required" });
      return;
    }

    const client = await prisma.oAuthClient.findUnique({
      where: { clientId: String(client_id) },
    });

    if (!client) {
      res.status(400).json({ error: "invalid_client" });
      return;
    }

    if (!client.redirectUris.includes(String(redirect_uri))) {
      res.status(400).json({ error: "invalid_request", error_description: "Invalid redirect_uri" });
      return;
    }

    // Generate Authorization Code
    const code = randomBytes(32).toString("hex");

    // Store in Redis: code -> { userId, code_challenge, scope, clientId }
    // Expires in 10 minutes
    const data = JSON.stringify({
      userId: req.user.sub,
      codeChallenge: code_challenge,
      scope: scope,
      clientId: client.clientId,
      redirectUri: redirect_uri,
    });

    await redis.setex(`auth_code:${code}`, 600, data);

    // Redirect
    const redirectUrl = new URL(String(redirect_uri));
    redirectUrl.searchParams.append("code", code);
    // If state was provided, pass it back (omitted for brevity in requirements, but good practice)
    if (req.query.state) {
      redirectUrl.searchParams.append("state", String(req.query.state));
    }

    res.redirect(redirectUrl.toString());
  } catch (error) {
    next(error);
  }
};

export const token = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { grant_type, code, client_id, client_secret, code_verifier, redirect_uri } = req.body;

    if (grant_type !== "authorization_code") {
      res.status(400).json({ error: "unsupported_grant_type" });
      return;
    }

    if (!code || !client_id || !code_verifier) {
      res.status(400).json({ error: "invalid_request" });
      return;
    }

    // Validate Client
    const client = await prisma.oAuthClient.findUnique({
      where: { clientId: client_id },
    });

    if (!client) {
      res.status(400).json({ error: "invalid_client" });
      return;
    }

    // If client is confidential (has secret), validate it.
    // The requirement implies client_secret is sent.
    if (client_secret) {
        const isValidSecret = await verifyPassword(client.clientSecretHash, client_secret);
        if (!isValidSecret) {
            res.status(400).json({ error: "invalid_client" });
            return;
        }
    } else {
        // Public clients might not have secrets, but requirement says "client_id, client_secret" in Accept list.
        // We'll enforce it if it's there, or assume public if not?
        // Let's assume confidential for now as per "seed-client.ts" having a secret.
         res.status(400).json({ error: "invalid_client", error_description: "Client secret required" });
         return;
    }

    // Retrieve Code from Redis
    const codeDataStr = await redis.get(`auth_code:${code}`);
    if (!codeDataStr) {
      res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired authorization code" });
      return;
    }

    const codeData = JSON.parse(codeDataStr);

    // Validate binding (Client ID and Redirect URI)
    if (codeData.clientId !== client_id) {
        res.status(400).json({ error: "invalid_grant" });
        return;
    }
    
    // Optional: Validate redirect_uri matches if provided in token request
    if (redirect_uri && codeData.redirectUri !== redirect_uri) {
         res.status(400).json({ error: "invalid_grant", error_description: "Redirect URI mismatch" });
         return;
    }

    // Validate PKCE
    const isPkceValid = await verifyPkceChallenge(code_verifier, codeData.codeChallenge);
    if (!isPkceValid) {
      res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
      return;
    }

    // Delete Code (Replay Protection)
    await redis.del(`auth_code:${code}`);

    // Generate Tokens
    const { accessToken, refreshToken } = await generateTokens(codeData.userId);
    const idToken = await generateIdToken(codeData.userId, client_id, undefined); // nonce not stored in this simple flow

    // Create session (optional if `generateTokens` doesn't do it, but our `login` controller did manually.
    // Here `generateTokens` just creates JWTs. We should ideally create a session record if we want refresh tokens to be trackable/revocable.
    // Reusing the logic from `login` or refactoring `generateTokens` to also persist session?
    // For now, let's persist the session manually here to ensure `logout` works.
    
    // Hash refresh token for storage
    const refreshTokenHash = await hashPassword(refreshToken);
    
    await prisma.session.create({
      data: {
        userId: codeData.userId,
        refreshTokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        deviceInfo: req.headers["user-agent"] || "unknown",
      },
    });

    res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 900, // 15 min
      refresh_token: refreshToken,
      id_token: idToken,
    });

  } catch (error) {
    next(error);
  }
};
