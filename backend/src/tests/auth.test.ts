import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../index.js";
import prisma from "../db/client.js";
import redis from "../db/redis.js";

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

async function loginUser(email: string, password = "TestPass123!") {
  return request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });
}

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
  });

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
