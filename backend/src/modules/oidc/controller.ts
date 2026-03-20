import { Request, Response, NextFunction } from "express";
import prisma from "../../db/client.js";
import { getPublicJwk } from "../../core/crypto.js";

export const getJwks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jwk = await getPublicJwk(); // Already includes kid (RFC 7638 thumbprint)
    // Wrap in "keys" array as per JWKS standard (RFC 7517)
    res.json({ keys: [{ ...jwk, use: "sig", alg: "RS256" }] });
  } catch (error) {
    next(error);
  }
};

export const getOpenIdConfiguration = (req: Request, res: Response): void => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000"; // Assuming BASE_URL is set or defaults to localhost

  // Minimal OIDC metadata
  const config = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/v1/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/v1/oauth/token`,
    userinfo_endpoint: `${baseUrl}/api/v1/oidc/userinfo`,
    jwks_uri: `${baseUrl}/api/v1/oidc/.well-known/jwks.json`,
    response_types_supported: ["code", "token", "id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["client_secret_basic"],
    claims_supported: ["sub", "iss", "email", "email_verified"],
  };

  res.json(config);
};

export const userinfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      sub: user.id,
      email: user.email,
      email_verified: user.emailVerified,
    });
  } catch (error) {
    next(error);
  }
};
