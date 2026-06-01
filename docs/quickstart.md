# Quick Start

This quick start shows how to register an application, perform the OAuth PKCE authorization code flow, retrieve user profile (OIDC UserInfo), refresh tokens, and logout.

Prerequisites

- AuthHub server reachable at `BASE_URL` (set in env `BASE_URL`).
- A registered OAuth application (client) in the Developer Portal.

Create an OAuth application

1. Sign in to AuthHub Developer Portal (or use API):

   - `GET /api/v1/developer/clients` — list clients
   - `POST /api/v1/developer/clients` — create client. Required fields: `name`, `redirectUris`.

Example: register a public client (single-page app)

POST /api/v1/developer/clients

Request JSON:

{
  "name": "My SPA",
  "redirectUris": ["https://app.example.com/callback"],
  "isConfidential": false
}

Response: 201 with `clientId` (and `clientSecret` shown once for confidential clients).

Configure redirect URIs

- Ensure the exact `redirect_uri` you will use is registered in the client record. Mismatched `redirect_uri` causes `invalid_grant` or `invalid_request`.

PKCE (recommended for public clients)

1. Generate a `code_verifier` (random string, 43–128 chars) and compute `code_challenge` as base64url(SHA256(code_verifier)). AuthHub requires `S256` only.

Authorization request (browser)

Navigate to the frontend authorize flow (AuthHub redirects to frontend by default):

GET /api/v1/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://app.example.com/callback&response_type=code&code_challenge=CODE_CHALLENGE&code_challenge_method=S256&scope=openid%20email%20profile

The user will authenticate and consent. The frontend will POST consent to `/api/v1/oauth/authorize` (authenticated) which generates an authorization code and returns a redirect URL containing `code`.

Token exchange (server-side)

POST /api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=https://app.example.com/callback
&client_id=YOUR_CLIENT_ID
&code_verifier=CODE_VERIFIER

Response (200):

{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "...",
  "id_token": "..."
}

Call UserInfo (OIDC)

GET /api/v1/oidc/userinfo
Authorization: Bearer ACCESS_TOKEN

Response:
{
  "sub": "user-id",
  "email": "user@example.com",
  "email_verified": true
}

Refresh Token (rotate)

POST /api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=REFRESH_TOKEN
&client_id=YOUR_CLIENT_ID
&client_secret=YOUR_CLIENT_SECRET (if confidential)

Response returns new `access_token` and new `refresh_token` (rotation).

Logout

POST /api/v1/auth/logout (authenticated)

This revokes the session and clears cookies (if used).

First API Call

Use the `access_token` in `Authorization: Bearer <token>` to call protected APIs.

Notes and Implementation Links

- PKCE verification: [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
- Authorization/Token flows: [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- JWKS & Discovery: [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)

If you want a step-by-step sample in JavaScript/Node.js or React, see the SDK Guides in `docs/sdk-guides/`.