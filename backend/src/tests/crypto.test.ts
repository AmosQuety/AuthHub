import "dotenv/config";
import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyToken,
  verifyPkceChallenge,
} from "../core/crypto.js";

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------
describe("hashPassword / verifyPassword", () => {
  it("hashes and verifies a correct password", async () => {
    const hash = await hashPassword("mySecret123!");
    expect(await verifyPassword(hash, "mySecret123!")).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct");
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("produces a different hash each call (random salt)", async () => {
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
  });
});

// ---------------------------------------------------------------------------
// JWT generation & verification
// ---------------------------------------------------------------------------
describe("generateTokens / verifyToken", () => {
  const userId = "00000000-0000-0000-0000-000000000000";
  const sessionId = "00000000-0000-0000-0000-000000000001";

  it("generates tokens that verify successfully", async () => {
    const { accessToken, refreshToken } = await generateTokens(userId, sessionId, ["openid"], ["USER"], null, undefined, ["plan:pro"]);
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    
    const payload = await verifyToken(accessToken) as any;
    expect(payload.sub).toBe(userId);
    expect(payload.scopes).toContain("plan:pro");
  });

  it("access token contains expected claims", async () => {
    const { accessToken } = await generateTokens(userId, sessionId, ["openid", "email"], ["ADMIN"], null, undefined, []);
    const payload = await verifyToken(accessToken) as any;
    expect(payload.sub).toBe(userId);
    expect(payload.scopes).toContain("openid");
    expect(payload.roles).toContain("ADMIN");
    expect(payload.iss).toBeTruthy();
    expect(payload.jti).toBeTruthy();
  });

  it("refresh token embeds sessionId", async () => {
    const { refreshToken } = await generateTokens(userId, sessionId, [], ["USER"], null, undefined, []);
    const payload = await verifyToken(refreshToken) as any;
    expect(payload.sid).toBe(sessionId);
    expect(payload.type).toBe("refresh");
  });

  it("rejects a tampered token", async () => {
    const { accessToken } = await generateTokens(userId, sessionId, [], ["USER"], null, undefined, []);
    const tampered = accessToken.slice(0, -10) + "TAMPERED!!";
    await expect(verifyToken(tampered)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// PKCE challenge verification
// ---------------------------------------------------------------------------
describe("verifyPkceChallenge", () => {
  it("accepts a correct S256 verifier/challenge pair", async () => {
    // Pre-computed: verifier "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    // Challenge: base64url(sha256(verifier))
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    // We'll just test the roundtrip by calculating ourselves
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const challenge = btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    expect(await verifyPkceChallenge(verifier, challenge)).toBe(true);
  });

  it("rejects a mismatched verifier", async () => {
    expect(await verifyPkceChallenge("wrong-verifier", "some-challenge")).toBe(false);
  });
});
