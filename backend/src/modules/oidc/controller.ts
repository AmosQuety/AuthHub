import { Request, Response, NextFunction } from "express";
import { getPublicJwk } from "../../core/crypto.js";

export const getJwks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jwk = await getPublicJwk();
    // Wrap in "keys" array as per JWKS standard
    res.json({ keys: [{ ...jwk, use: "sig", alg: "RS256", kid: "authhub-key-1" }] });
  } catch (error) {
    next(error);
  }
};

export const getOpenIdConfiguration = (req: Request, res: Response): void => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000"; // Assuming BASE_URL is set or defaults to localhost

  // Minimal OIDC metadata
  const config = {
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/v1/auth/authorize`, // Placeholder for future
    token_endpoint: `${baseUrl}/api/v1/auth/token`, // Placeholder for future
    userinfo_endpoint: `${baseUrl}/api/v1/auth/me`,
    jwks_uri: `${baseUrl}/auth/.well-known/jwks.json`,
    response_types_supported: ["code", "token", "id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["client_secret_basic"],
    claims_supported: ["sub", "iss", "email", "email_verified"],
  };

  res.json(config);
};
