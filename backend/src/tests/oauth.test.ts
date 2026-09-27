import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import crypto from "crypto";
import app from "../index.js";
import prisma from "../db/client.js";
import { hashPassword } from "../core/crypto.js";

// ---------------------------------------------------------------------------
// Fixtures: one confidential client, one public client, sharing a scope set.
// ---------------------------------------------------------------------------
const CLIENT_SCOPES = ["read:reports", "write:reports"];
const CONFIDENTIAL_SECRET = "test-secret-" + crypto.randomUUID();

let confidentialClientId: string;
let publicClientId: string;

beforeAll(async () => {
  const confidential = await prisma.oAuthClient.create({
    data: {
      clientId: `test-confidential-${crypto.randomUUID()}`,
      clientSecretHash: await hashPassword(CONFIDENTIAL_SECRET),
      isPublic: false,
      redirectUris: [],
      scopes: CLIENT_SCOPES,
      name: "Test Confidential Client",
    },
  });
  confidentialClientId = confidential.clientId;

  const publicClient = await prisma.oAuthClient.create({
    data: {
      clientId: `test-public-${crypto.randomUUID()}`,
      clientSecretHash: "none",
      isPublic: true,
      redirectUris: ["http://localhost/callback"],
      scopes: CLIENT_SCOPES,
      name: "Test Public Client",
    },
  });
  publicClientId = publicClient.clientId;
});

afterAll(async () => {
  await prisma.oAuthClient.deleteMany({
    where: { clientId: { in: [confidentialClientId, publicClientId] } },
  });
});

describe("POST /api/v1/oauth/token — client_credentials grant", () => {
  it("issues an access token for a valid confidential client, with no refresh_token", async () => {
    const res = await request(app)
      .post("/api/v1/oauth/token")
      .type("form")
      .send({
        grant_type: "client_credentials",
        client_id: confidentialClientId,
        client_secret: CONFIDENTIAL_SECRET,
      });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeTruthy();
    expect(res.body.token_type).toBe("Bearer");
    expect(res.body.refresh_token).toBeUndefined();
    expect(res.body.id_token).toBeUndefined();
  });

  it("scopes the token to the client's registered scopes when none are requested", async () => {
    const res = await request(app)
      .post("/api/v1/oauth/token")
      .type("form")
      .send({
        grant_type: "client_credentials",
        client_id: confidentialClientId,
        client_secret: CONFIDENTIAL_SECRET,
      });

    expect(res.status).toBe(200);
    expect(res.body.scope.split(" ").sort()).toEqual([...CLIENT_SCOPES].sort());
  });

  it("filters requested scopes down to the client's registered scopes", async () => {
    const res = await request(app)
      .post("/api/v1/oauth/token")
      .type("form")
      .send({
        grant_type: "client_credentials",
        client_id: confidentialClientId,
        client_secret: CONFIDENTIAL_SECRET,
        scope: "read:reports admin:everything",
      });

    expect(res.status).toBe(200);
    expect(res.body.scope).toBe("read:reports");
  });

  it("rejects a public client with unauthorized_client", async () => {
    const res = await request(app)
      .post("/api/v1/oauth/token")
      .type("form")
      .send({
        grant_type: "client_credentials",
        client_id: publicClientId,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("unauthorized_client");
  });

  it("rejects a confidential client with a missing client_secret", async () => {
    const res = await request(app)
      .post("/api/v1/oauth/token")
      .type("form")
      .send({
        grant_type: "client_credentials",
        client_id: confidentialClientId,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_client");
  });

  it("rejects a confidential client with a wrong client_secret", async () => {
    const res = await request(app)
      .post("/api/v1/oauth/token")
      .type("form")
      .send({
        grant_type: "client_credentials",
        client_id: confidentialClientId,
        client_secret: "definitely-wrong",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_client");
  });

  it("rejects an unknown client_id", async () => {
    const res = await request(app)
      .post("/api/v1/oauth/token")
      .type("form")
      .send({
        grant_type: "client_credentials",
        client_id: "does-not-exist",
        client_secret: "irrelevant",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("invalid_client");
  });
});
