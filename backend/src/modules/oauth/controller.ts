import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import prisma from "../../db/client.js";
import redis from "../../db/redis.js";
import { verifyPkceChallenge, generateTokens, generateIdToken, verifyPassword, hashPassword, verifyToken } from "../../core/crypto.js";

// Helper to check if array current contains all elements of required
const hasAllScopes = (current: string[], required: string[]) => {
  return required.every(scope => current.includes(scope));
};

export const checkConsent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { client_id, scope } = req.query;

    if (!req.user || !req.user.sub) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!client_id) {
      res.status(400).json({ error: "invalid_request", error_description: "client_id is required" });
      return;
    }

    const requestedScopes = scope ? String(scope).split(" ") : [];

    // Look for previous consent
    const consent = await prisma.userConsent.findUnique({
      where: {
        userId_clientId: {
          userId: req.user.sub,
          clientId: String(client_id),
        }
      }
    });

    if (!consent) {
      // Never consented to this app before
      res.json({ consentRequired: true });
      return;
    }

    // Check if the previously granted scopes cover all the newly requested scopes
    if (hasAllScopes(consent.scopes, requestedScopes)) {
      res.json({ consentRequired: false, previouslyGrantedScopes: consent.scopes });
    } else {
      // User consented before, but this request asks for MORE scopes than before
      res.json({ consentRequired: true });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Standard OIDC landing point for the browser.
 * Redirects the user to the React Frontend's /authorize page.
 */
export const authorizeRedirect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    
    // Construct the frontend destination URL
    const target = new URL(`${frontendUrl}/authorize`);
    
    // Copy all query parameters from the backend request to the frontend redirect
    Object.keys(req.query).forEach(key => {
      target.searchParams.append(key, String(req.query[key]));
    });

    // Perform the redirect
    res.redirect(target.toString());
  } catch (error) {
    next(error);
  }
};

export const authorize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // We expect the frontend consent screen to POST these params
    const { client_id, response_type, redirect_uri, scope, code_challenge, code_challenge_method, nonce } = req.body;

    if (!req.user || !req.user.sub) {
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

    // IMPORTANT: Actually save the consent into the database if not already tracked
    const requestedScopes = scope ? String(scope).split(" ") : [];
    
    // We use upsert so if a consent record exists, we just update the scopes to include the new ones
    await prisma.userConsent.upsert({
      where: {
        userId_clientId: {
          userId: req.user.sub,
          clientId: client.clientId,
        }
      },
      create: {
        userId: req.user.sub,
        clientId: client.clientId,
        scopes: requestedScopes,
      },
      update: {
        scopes: {
          push: requestedScopes, // Prisma push into array (PostgreSQL specific, but fits here)
        }
      }
    });

    // Clean up duplicate scopes array if push creates duplicates
    const finalConsent = await prisma.userConsent.findUnique({
      where: { userId_clientId: { userId: req.user.sub, clientId: client.clientId } }
    });
    if (finalConsent) {
      const uniqueScopes = Array.from(new Set(finalConsent.scopes));
      if (uniqueScopes.length !== finalConsent.scopes.length) {
        await prisma.userConsent.update({
          where: { id: finalConsent.id },
          data: { scopes: uniqueScopes }
        });
      }
    }

    // Generate Authorization Code
    const code = randomBytes(32).toString("hex");

    // Store in Redis: code -> { userId, code_challenge, scope, clientId, state }
    // Expires in 10 minutes
    const stateParam = req.body.state ? String(req.body.state) : undefined;

    const data = JSON.stringify({
      userId: req.user.sub,
      codeChallenge: code_challenge,
      scope: scope,
      clientId: client.clientId,
      redirectUri: redirect_uri,
      nonce: nonce,
      // Store state for CSRF validation on token exchange
      state: stateParam,
    });

    await redis.setex(`hub:auth_code:${code}`, 60, data);

    // Instead of redirecting directly, we return the redirect URL to the React frontend.
    // The frontend will perform the actual window.location redirect.
    const redirectUrl = new URL(String(redirect_uri));
    redirectUrl.searchParams.append("code", code);
    if (stateParam) {
      redirectUrl.searchParams.append("state", stateParam);
    }

    res.json({ redirectUrl: redirectUrl.toString() });
  } catch (error) {
    next(error);
  }
};

export const token = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { grant_type, code, client_id, client_secret, code_verifier, redirect_uri, refresh_token } = req.body;

    if (grant_type !== "authorization_code" && grant_type !== "refresh_token") {
      res.status(400).json({ error: "unsupported_grant_type" });
      return;
    }

    if (!client_id) {
      res.status(400).json({ error: "invalid_request", error_description: "client_id is required" });
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

    // Validate client secret unless it's a public client
    if (!client.isPublic) {
      if (!client_secret) {
        res.status(400).json({ error: "invalid_client", error_description: "Client secret required" });
        return;
      }
      const isValidSecret = await verifyPassword(client.clientSecretHash, client_secret);
      if (!isValidSecret) {
        res.status(400).json({ error: "invalid_client" });
        return;
      }
    }

    if (grant_type === "authorization_code") {
      if (!code || !code_verifier) {
        res.status(400).json({ error: "invalid_request", error_description: "code and code_verifier required" });
        return;
      }

      // Retrieve Code from Redis
      const codeDataStr = await redis.get(`hub:auth_code:${code}`);
      if (!codeDataStr) {
        res.status(400).json({ error: "invalid_grant", error_description: "Invalid or expired authorization code" });
        return;
      }

      const codeData = JSON.parse(codeDataStr);

      if (codeData.clientId !== client_id) {
        res.status(400).json({ error: "invalid_grant" });
        return;
      }

      if (redirect_uri && codeData.redirectUri !== redirect_uri) {
        res.status(400).json({ error: "invalid_grant", error_description: "Redirect URI mismatch" });
        return;
      }

      // --- CSRF: Validate state ---
      // If state was bound to this auth code, the client must echo it back.
      if (codeData.state) {
        const { state } = req.body;
        if (state !== codeData.state) {
          res.status(400).json({ error: "invalid_grant", error_description: "State mismatch — possible CSRF attack" });
          return;
        }
      }

      const isPkceValid = await verifyPkceChallenge(code_verifier, codeData.codeChallenge);
      if (!isPkceValid) {
        res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
        return;
      }

      await redis.del(`hub:auth_code:${code}`);

      // Create session, attach client scope if present
      const requestedScopes = codeData.scope ? String(codeData.scope).split(" ") : [];
      // Intersect requested scopes with permitted scopes on client
      const grantedScopes = requestedScopes.filter((s) => client.scopes.includes(s));

      const sessionId = crypto.randomUUID();

      // Generate tokens with scopes
      const entitlements = await prisma.entitlement.findMany({
        where: { userId: codeData.userId, status: "active" },
        select: { planId: true },
      });
      const entitlementScopes = entitlements.map(e => `plan:${e.planId}`);

      const { accessToken, refreshToken: newRefreshToken } = await generateTokens(codeData.userId, sessionId, grantedScopes, undefined, undefined, undefined, entitlementScopes);
      const refreshTokenHash = await hashPassword(newRefreshToken);

      await prisma.$transaction(async (tx) => {
        await tx.session.create({
          data: {
            id: sessionId,
            userId: codeData.userId,
            refreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            deviceInfo: req.headers["user-agent"] || "unknown",
            ipAddress: req.ip || "unknown",
          },
        });
      });

      let userProfile = undefined;
      if (grantedScopes.includes("email")) {
        const user = await prisma.user.findUnique({ where: { id: codeData.userId } });
        userProfile = user ? { email: user.email, emailVerified: user.emailVerified } : undefined;
      }

      const idToken = await generateIdToken(codeData.userId, client_id, codeData.nonce, userProfile, grantedScopes);

      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 900, // 15 min
        refresh_token: newRefreshToken,
        id_token: idToken,
      });

    } else if (grant_type === "refresh_token") {
      if (!refresh_token) {
        res.status(400).json({ error: "invalid_request", error_description: "refresh_token required" });
        return;
      }

      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      let payload;
      try {
        payload = await verifyToken(refresh_token);
      } catch {
        res.status(401).json({ error: "invalid_grant", error_description: "Invalid refresh token" });
        return;
      }

      const userId = payload.sub;
      const sessionId = payload.sid as string | undefined;

      if (!userId || !sessionId) {
        res.status(401).json({ error: "invalid_grant" });
        return;
      }

      const oldSession = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!oldSession || oldSession.userId !== userId || oldSession.expiresAt < new Date()) {
        res.status(401).json({ error: "invalid_grant", error_description: "Session revoked or expired" });
        return;
      }

      const isValidHash = await verifyPassword(oldSession.refreshTokenHash, refresh_token);
      if (!isValidHash) {
        await prisma.session.delete({ where: { id: sessionId } });
        res.status(401).json({ error: "invalid_grant" });
        return;
      }

      const newSessionId = crypto.randomUUID();

      const entitlements = await prisma.entitlement.findMany({
        where: { userId: userId, status: "active" },
        select: { planId: true },
      });
      const entitlementScopes = entitlements.map(e => `plan:${e.planId}`);

      // Default to empty scopes on refresh unless we persist scopes to the session DB.
      // For now, assume [] or we'd need to add `scopes` to the Session model to fully persist them.
      // Passing [] since we don't have session scopes tracked in the DB yet in this phase.
      const { accessToken, refreshToken: newRefreshToken } = await generateTokens(userId, newSessionId, [], undefined, undefined, undefined, entitlementScopes);
      const newRefreshTokenHash = await hashPassword(newRefreshToken);

      await prisma.$transaction(async (tx) => {
        await tx.session.create({
          data: {
            id: newSessionId,
            userId,
            refreshTokenHash: newRefreshTokenHash,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Extended 7 days
            deviceInfo: oldSession.deviceInfo,
            ipAddress: req.ip || "unknown",
          },
        });

        await tx.session.delete({ where: { id: sessionId } });
      });

      res.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 900,
        refresh_token: newRefreshToken,
      });
    }
  } catch (error) {
    next(error);
  }
};
