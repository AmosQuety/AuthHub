import argon2 from "argon2";
import * as jose from "jose";

// --- Password Hashing ---

export const hashPassword = async (password: string): Promise<string> => {
  return await argon2.hash(password);
};

export const verifyPassword = async (hash: string, plain: string): Promise<boolean> => {
  try {
    return await argon2.verify(hash, plain);
  } catch (err) {
    return false;
  }
};

// --- JWT (RS256) ---

// Ensure keys are present in environment
const privateKeyPem = process.env.JWT_PRIVATE_KEY;
const publicKeyPem = process.env.JWT_PUBLIC_KEY;

let privateKey: jose.KeyLike | null = null;
let publicKey: jose.KeyLike | null = null;

const getPrivateKey = async () => {
  if (privateKey) return privateKey;
  if (!privateKeyPem) throw new Error("JWT_PRIVATE_KEY is not defined");
  privateKey = await jose.importPKCS8(privateKeyPem, "RS256");
  return privateKey;
};

// Exported for verify if needed elsewhere, though usually verify uses public key
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

export const generateTokens = async (userId: string) => {
  const key = await getPrivateKey();

  const accessToken = await new jose.SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(key);

  const refreshToken = await new jose.SignJWT({ sub: userId, type: "refresh" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);

  return { accessToken, refreshToken };
};

export const verifyToken = async (token: string) => {
    const key = await getPublicKey();
    const { payload } = await jose.jwtVerify(token, key);
    return payload;
}

// --- PKCE & ID Token ---

export const verifyPkceChallenge = async (verifier: string, challenge: string): Promise<boolean> => {
  // S256: SHA-256 hash of the code verifier, then Base64URL encoded
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Base64URL encode
  const base64Url = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  return base64Url === challenge;
};

export const generateIdToken = async (userId: string, clientId: string, nonce?: string) => {
  const key = await getPrivateKey();
  
  const jwt = new jose.SignJWT({
    sub: userId,
    aud: clientId,
    iss: process.env.BASE_URL || "http://localhost:3000",
    nonce: nonce,
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime("1h");

  return await jwt.sign(key);
};
