import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import app from "../index.js";
import prisma from "../db/client.js";
import redis from "../db/redis.js";
import { hashPassword } from "../core/crypto.js";

// Mock nodemailer so no real emails fire during tests
vi.mock("../../core/mailer.js", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
  buildVerificationEmail: vi.fn().mockReturnValue("<html>verify</html>"),
  buildPasswordResetEmail: vi.fn().mockReturnValue("<html>reset</html>"),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const testEmail = () => `test_${Date.now()}@authhub.test`;

async function registerUser(email: string, password = "TestPass123!") {
  return request(app)
    .post("/api/v1/auth/register")
    .send({ email, password });
}

async function loginUser(email: string, password = "TestPass123!", clientId?: string) {
  const payload: Record<string, string> = { email, password };
  if (clientId) payload.client_id = clientId;

  return request(app)
    .post("/api/v1/auth/login")
    .send(payload);
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------
describe("POST /api/v1/auth/register", () => {
  it("creates a new user and returns 201", async () => {
    const email = testEmail();
    const res = await registerUser(email);
    expect(res.status).toBe(201);
    expect(res.body.userId).toBeTruthy();
  });

  it("returns 409 when email already exists", async () => {
    const email = testEmail();
    await registerUser(email);
    const res = await registerUser(email);
    expect(res.status).toBe(409);
  });

  it("returns 409 when the same email is reused under another tenant", async () => {
    const email = testEmail();
    const tenant = await prisma.tenant.create({
      data: {
        name: `Tenant ${Date.now()}`,
        clientId: `tenant-${Date.now()}`,
      },
    });

    const first = await registerUser(email);
    expect(first.status).toBe(201);

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password: "TestPass123!", client_id: tenant.clientId });

    expect(res.status).toBe(409);
  });

  it("returns 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "only@email.com" });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
describe("POST /api/v1/auth/login", () => {
  it("returns 200 with accessToken on valid credentials", async () => {
    const email = testEmail();
    await registerUser(email);
    const res = await loginUser(email);
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it("returns 401 on wrong password", async () => {
    const email = testEmail();
    await registerUser(email);
    const res = await loginUser(email, "WrongPassword!");
    expect(res.status).toBe(401);
  });

  it("returns 401 for unknown email", async () => {
    const res = await loginUser("nobody@nowhere.com");
    expect(res.status).toBe(401);
  });

  it("still logs in when client_id is supplied", async () => {
    const email = testEmail();
    const tenant = await prisma.tenant.create({
      data: {
        name: `Tenant ${Date.now()}`,
        clientId: `tenant-${Date.now()}`,
      },
    });

    await registerUser(email);

    const okRes = await loginUser(email, "TestPass123!", tenant.clientId ?? undefined);
    expect(okRes.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------
describe("GET /api/v1/auth/google/callback", () => {
  it("logs in an existing account by email and links the Google provider", async () => {
    const email = testEmail();
    const googleId = `google-${Date.now()}`;

    const user = await prisma.user.create({
      data: {
        email,
        name: "Google User",
        tosAcceptedAt: new Date(),
        emailVerified: true,
      },
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input: any) => {
      const url = String(input);

      if (url.includes("oauth2.googleapis.com/token")) {
        return new Response(JSON.stringify({ access_token: "token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("www.googleapis.com/oauth2/v2/userinfo")) {
        return new Response(JSON.stringify({
          id: googleId,
          email,
          verified_email: true,
          name: "Google User",
          picture: "https://example.com/avatar.png",
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    }) as unknown as ReturnType<typeof vi.spyOn>;

    const state = Buffer.from(JSON.stringify({ mode: "login" })).toString("base64url");

    const res = await request(app)
      .get("/api/v1/auth/google/callback")
      .query({ code: "test-code", state })
      .redirects(0);

    expect(res.status).toBe(302);
    expect(String(res.headers.location)).toContain("/login/success");

    const linked = await prisma.authProvider.findUnique({
      where: { provider_providerId: { provider: "google", providerId: googleId } },
    });

    expect(linked?.userId).toBe(user.id);
    expect(fetchMock).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------
describe("POST /api/v1/auth/refresh", () => {
  it("rotates the refresh token and returns a new access token", async () => {
    const email = testEmail();
    await registerUser(email);
    const loginRes = await loginUser(email);

    // Extract refreshToken cookie set by login
    const cookies = loginRes.headers["set-cookie"] as unknown as string[] | undefined;
    expect(cookies).toBeTruthy();

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", cookies!);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  }, 30000);

  it("returns 401 with no refresh token cookie", async () => {
    const res = await request(app).post("/api/v1/auth/refresh");
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// /me
// ---------------------------------------------------------------------------
describe("GET /api/v1/auth/me", () => {
  it("returns user profile with valid access token", async () => {
    const email = testEmail();
    await registerUser(email);
    const loginRes = await loginUser(email);
    const token = loginRes.body.accessToken;

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------
describe("POST /api/v1/auth/forgot-password", () => {
  it("returns 200 regardless of whether the email exists (anti-enumeration)", async () => {
    const res1 = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nobody@nowhere.com" });
    expect(res1.status).toBe(200);

    const email = testEmail();
    await registerUser(email);
    const res2 = await request(app)
      .post("/api/v1/auth/forgot-password")
      .send({ email });
    expect(res2.status).toBe(200);
  });
});
