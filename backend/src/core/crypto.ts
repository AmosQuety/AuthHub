import argon2 from "argon2";
import * as jose from "jose";
import crypto from "crypto";
import prisma from "../db/client.js";

// --- Password Hashing ---

// Optional pepper adds a server-side secret on top of argon2's own salt.
// Prepended to the plain text so the DB hash is worthless without the secret.
const PEPPER = process.env.ARGON2_PEPPER ?? "";

const ARGON2_OPTIONS =
  process.env.NODE_ENV === "test"
    ? {
        timeCost: 2,
        memoryCost: 1024,
        parallelism: 1,
      }
    : undefined;

export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(PEPPER + password, ARGON2_OPTIONS);
};

export const verifyPassword = async (hash: string, plain: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, PEPPER + plain);
  } catch (err) {
    return false;
  }
};

// --- Symmetric Encryption (AES-256-GCM) ---
// For storing reversible secrets like SMTP passwords.
const SYMMETRIC_KEY = process.env.ENCRYPTION_KEY || crypto.randomUUID().replace(/-/g, "").padEnd(32, "0").slice(0, 32);

export const encryptSymmetric = (text: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(SYMMETRIC_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

export const decryptSymmetric = (encryptedData: string): string => {
  const [ivHex, authTagHex, encryptedHex] = encryptedData.split(":");
  if (!ivHex || !authTagHex || !encryptedHex) throw new Error("Invalid encrypted format");
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(SYMMETRIC_KEY), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
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

// Computes a stable, deterministic kid from the public key's JWK thumbprint (RFC 7638).
// This ensures the kid in the JWKS response always matches the kid embedded in issued JWTs.
let _kidCache: string | null = null;
export const getKeyId = async (): Promise<string> => {
  if (_kidCache) return _kidCache;
  const key = await getPublicKey();
  const thumbprint = await jose.calculateJwkThumbprint(await jose.exportJWK(key), "sha256");
  _kidCache = thumbprint;
  return thumbprint;
};

export const getPublicJwk = async () => {
  const key = await getPublicKey();
  const jwk = await jose.exportJWK(key);
  const kid = await getKeyId();
  return { ...jwk, kid };
};

// Generates a short-lived access token and a rotating refresh token.
// The refresh token embeds the sessionId so logout can target a single session.
export const generateTokens = async (
  userId: string, 
  sessionId: string, 
  scopes: string[] = [], 
  roles: string[] = ["USER"], 
  name?: string | null, 
  impersonatorId?: string,
  entitlementScopes: string[] = []
) => {
  const key = await getPrivateKey();
  const kid = await getKeyId();
  const issuer = process.env.BASE_URL || "http://localhost:3000";

  const finalScopes = Array.from(new Set([...scopes, ...entitlementScopes]));

  const accessPayload: any = { sub: userId, roles };
  if (name) {
    accessPayload.name = name;
  }
  if (finalScopes.length > 0) {
    accessPayload.scopes = finalScopes;
  }
  
  if (impersonatorId) {
    // RFC 8693 standard 'act' (Actor) claim
    accessPayload.act = { sub: impersonatorId };
  }

  const accessToken = await new jose.SignJWT(accessPayload)
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(issuer)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(impersonatorId ? "15m" : "15m") // 15m absolute max for impersonation
    .sign(key);

  if (impersonatorId) {
    // Impersonation sessions explicitly do NOT get a refresh token!
    return { accessToken, refreshToken: "" };
  }

  const refreshToken = await new jose.SignJWT({ sub: userId, sid: sessionId, type: "refresh" })
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuer(issuer)
    .setIssuedAt()
    .setJti(crypto.randomUUID())
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
  userProfile?: { email?: string; emailVerified?: boolean; name?: string | null; [key: string]: any },
  scopes: string[] = []
) => {
  const key = await getPrivateKey();
  const kid = await getKeyId();
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

  if (userProfile?.name) {
    payload.name = userProfile.name;
  }

  const jwt = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid })
    .setIssuedAt()
    .setExpirationTime("1h");

  return await jwt.sign(key);
};

// --- MFA Tokens ---

export const generateMfaToken = async (userId: string) => {
  const key = await getPrivateKey();
  const kid = await getKeyId();
  const issuer = process.env.BASE_URL || "http://localhost:3000";

  return await new jose.SignJWT({ sub: userId, type: "mfa_pending" })
    .setProtectedHeader({ alg: "RS256", kid })
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
