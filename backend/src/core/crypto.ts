import argon2 from "argon2";
import * as jose from "jose";

// --- Password Hashing ---

// Optional pepper adds a server-side secret on top of argon2's own salt.
// Prepended to the plain text so the DB hash is worthless without the secret.
const PEPPER = process.env.ARGON2_PEPPER ?? "";

export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(PEPPER + password);
};

export const verifyPassword = async (hash: string, plain: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, PEPPER + plain);
  } catch (err) {
    return false;
  }
};

// --- JWT (RS256) ---

const privateKeyPem = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, "\n");
const publicKeyPem = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");

let privateKey: jose.KeyLike | null = null;
let publicKey: jose.KeyLike | null = null;

const getPrivateKey = async () => {
  if (privateKey) return privateKey;
  if (!privateKeyPem) throw new Error("JWT_PRIVATE_KEY is not defined");
  privateKey = await jose.importPKCS8(privateKeyPem, "RS256");
  return privateKey;
};

export const getPublicKey = async () => {
  if (publicKey) return publicKey;
  if (!publicKeyPem) throw new Error("JWT_PUBLIC_KEY is not defined");
  publicKey = await jose.importSPKI(publicKeyPem, "RS256");
  return publicKey;
};

export const getPublicJwk = async () => {
  const key = await getPublicKey();
  return await jose.exportJWK(key);
};

// Generates a short-lived access token and a rotating refresh token.
// The refresh token embeds the sessionId so logout can target a single session.
export const generateTokens = async (userId: string, sessionId: string, scopes: string[] = [], roles: string[] = ["USER"]) => {
  const key = await getPrivateKey();
  const issuer = process.env.BASE_URL || "http://localhost:3000";

  const accessPayload: any = { sub: userId, roles };
  if (scopes.length > 0) {
    accessPayload.scopes = scopes;
  }

  const accessToken = await new jose.SignJWT(accessPayload)
    .setProtectedHeader({ alg: "RS256", kid: "authhub-key-1" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime("15m")
    .sign(key);

  const refreshToken = await new jose.SignJWT({ sub: userId, sid: sessionId, type: "refresh" })
    .setProtectedHeader({ alg: "RS256", kid: "authhub-key-1" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);

  return { accessToken, refreshToken };
};

export const verifyToken = async (token: string) => {
  const key = await getPublicKey();
  const { payload } = await jose.jwtVerify(token, key);
  return payload;
};

// --- PKCE ---

export const verifyPkceChallenge = async (verifier: string, challenge: string): Promise<boolean> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const base64Url = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return base64Url === challenge;
};

// --- ID Token (OIDC) ---

export const generateIdToken = async (
  userId: string,
  clientId: string,
  nonce?: string,
  userProfile?: { email?: string; emailVerified?: boolean;[key: string]: any },
  scopes: string[] = []
) => {
  const key = await getPrivateKey();
  const issuer = process.env.BASE_URL || "http://localhost:3000";

  const payload: any = {
    sub: userId,
    aud: clientId,
    iss: issuer,
    ...(nonce ? { nonce } : {}),
  };

  if (scopes.includes("email") && userProfile) {
    payload.email = userProfile.email;
    payload.email_verified = userProfile.emailVerified;
  }

  const jwt = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: "authhub-key-1" })
    .setIssuedAt()
    .setExpirationTime("1h");

  return await jwt.sign(key);
};

// --- MFA Tokens ---

export const generateMfaToken = async (userId: string) => {
  const key = await getPrivateKey();
  const issuer = process.env.BASE_URL || "http://localhost:3000";

  return await new jose.SignJWT({ sub: userId, type: "mfa_pending" })
    .setProtectedHeader({ alg: "RS256", kid: "authhub-key-1" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime("5m") // Very short-lived
    .sign(key);
};

export const verifyMfaToken = async (token: string) => {
  const payload = await verifyToken(token);
  if (payload.type !== "mfa_pending") {
    throw new Error("Invalid token type");
  }
  return payload;
};
