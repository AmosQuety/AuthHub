/**
 * AuthHub OpenAPI 3.0 Specification
 * Describes all publicly-available developer-facing endpoints.
 */
export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "AuthHub API",
    version: "1.0.0",
    description:
      "AuthHub is a production-grade Auth-as-a-Service platform. Use these endpoints to integrate OAuth 2.0 / OIDC into your application.",
    contact: { name: "AuthHub Support", email: "support@authhub.dev" },
  },
  servers: [{ url: "/api/v1", description: "Production API" }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "RS256-signed Access Token issued by /auth/login",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      OAuthClient: {
        type: "object",
        properties: {
          clientId: { type: "string", example: "my-app_aB3kP9mNqR" },
          name: { type: "string", example: "My Production App" },
          isPublic: { type: "boolean" },
          redirectUris: { type: "array", items: { type: "string" }, example: ["https://myapp.com/callback"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string", description: "Short-lived RS256 JWT (15 min)" },
          refreshToken: { type: "string", description: "Long-lived refresh token (7 days, stored in HttpOnly cookie)" },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    // ─── Auth ──────────────────────────────────────────────────────────────────
    "/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created. Verification email sent." },
          "409": { description: "Email already registered on this tenant." },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login with email & password",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
            content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } },
          },
          "401": { description: "Invalid credentials" },
          "429": { description: "Rate limited" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Rotate access token using the refresh cookie",
        security: [],
        responses: {
          "200": { description: "New access token issued", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
          "401": { description: "Refresh token invalid or expired" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Revoke the current session & clear cookies",
        responses: {
          "200": { description: "Logged out successfully" },
        },
      },
    },

    // ─── OIDC ──────────────────────────────────────────────────────────────────
    "/oidc/.well-known/openid-configuration": {
      get: {
        tags: ["OIDC"],
        summary: "OIDC Discovery Document",
        security: [],
        responses: { "200": { description: "Standard OpenID Connect discovery document" } },
      },
    },
    "/oidc/jwks": {
      get: {
        tags: ["OIDC"],
        summary: "JSON Web Key Set (public signing keys)",
        security: [],
        responses: { "200": { description: "JWKS payload for verifying RS256 JWTs" } },
      },
    },
    "/oidc/userinfo": {
      get: {
        tags: ["OIDC"],
        summary: "OIDC UserInfo endpoint",
        responses: {
          "200": { description: "Current user's profile claims" },
          "401": { description: "Token missing or expired" },
        },
      },
    },

    // ─── OAuth 2.0 ─────────────────────────────────────────────────────────────
    "/oauth/authorize": {
      get: {
        tags: ["OAuth 2.0"],
        summary: "Authorization endpoint (PKCE flow)",
        security: [],
        parameters: [
          { name: "client_id", in: "query", required: true, schema: { type: "string" } },
          { name: "redirect_uri", in: "query", required: true, schema: { type: "string" } },
          { name: "response_type", in: "query", required: true, schema: { type: "string", enum: ["code"] } },
          { name: "code_challenge", in: "query", required: true, schema: { type: "string" } },
          { name: "code_challenge_method", in: "query", required: true, schema: { type: "string", enum: ["S256"] } },
          { name: "scope", in: "query", schema: { type: "string", example: "openid email profile" } },
          { name: "state", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "302": { description: "Redirect to consent page or directly to redirect_uri" },
        },
      },
    },
    "/oauth/token": {
      post: {
        tags: ["OAuth 2.0"],
        summary: "Token endpoint — exchange code or refresh token",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  grant_type: { type: "string", enum: ["authorization_code", "refresh_token"] },
                  code: { type: "string" },
                  redirect_uri: { type: "string" },
                  code_verifier: { type: "string" },
                  client_id: { type: "string" },
                  client_secret: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Tokens issued", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
          "400": { description: "Invalid grant" },
        },
      },
    },

    // ─── Developer Portal ──────────────────────────────────────────────────────
    "/developer/clients": {
      get: {
        tags: ["Developer Portal"],
        summary: "List your registered applications",
        responses: {
          "200": {
            description: "Array of OAuth clients owned by the current user",
            content: { "application/json": { schema: { type: "object", properties: { clients: { type: "array", items: { $ref: "#/components/schemas/OAuthClient" } } } } } },
          },
        },
      },
      post: {
        tags: ["Developer Portal"],
        summary: "Register a new OAuth application",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "redirectUris"],
                properties: {
                  name: { type: "string" },
                  redirectUris: { type: "array", items: { type: "string" } },
                  isConfidential: { type: "boolean", default: true },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Client created. clientSecret shown ONCE." },
        },
      },
    },
    "/developer/clients/{clientId}": {
      patch: {
        tags: ["Developer Portal"],
        summary: "Update an application's name or redirect URIs",
        parameters: [{ name: "clientId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  redirectUris: { type: "array", items: { type: "string" } },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Client updated" },
          "403": { description: "You do not own this client" },
        },
      },
      delete: {
        tags: ["Developer Portal"],
        summary: "Delete an application",
        parameters: [{ name: "clientId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Deleted successfully" },
          "403": { description: "You do not own this client" },
        },
      },
    },
    "/developer/clients/{clientId}/rotate": {
      post: {
        tags: ["Developer Portal"],
        summary: "Rotate the client secret — old secret immediately invalidated",
        parameters: [{ name: "clientId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "New clientSecret returned (shown ONCE)" },
          "400": { description: "Not applicable for public clients" },
        },
      },
    },
    "/developer/stats": {
      get: {
        tags: ["Developer Portal"],
        summary: "Usage analytics for your applications (7-day login trend)",
        responses: {
          "200": {
            description: "Stats data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    totalLogins: { type: "integer" },
                    chartData: { type: "array", items: { type: "object", properties: { date: { type: "string" }, logins: { type: "integer" } } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
