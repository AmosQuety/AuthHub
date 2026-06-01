# OAuth 2.0 Guide

AuthHub supports the OAuth 2.0 Authorization Code flow with PKCE and the refresh token grant. This guide explains the components and provides examples specific to AuthHub's implementation.

Core concepts

- Authorization Endpoint: `GET /api/v1/oauth/authorize` (redirects to frontend authorize UI) and `POST /api/v1/oauth/authorize` (consent submission).
- Token Endpoint: `POST /api/v1/oauth/token` — supports `authorization_code` and `refresh_token` grants.
- Authorization Codes: stored in Redis under `hub:auth_code:<code>` and expire quickly (10 minutes).
- PKCE: only `S256` method supported; verification implemented in `backend/src/core/crypto.ts`.
- Consent: user consents are stored in `user_consents` table (Prisma model `UserConsent`).

Authorize flow (AuthHub specifics)

1. Client initiates browser-based flow using PKCE and `response_type=code`.
2. The backend redirects browsers to the frontend authorize page (see `authorizeRedirect()` in `backend/src/modules/oauth/controller.ts`).
3. The frontend collects user consent and POSTs to `/api/v1/oauth/authorize` while the user is authenticated.
4. Server stores an authorization code in Redis with `codeChallenge`, `state`, `nonce`, and other metadata.
5. Client exchanges the code for tokens at `/api/v1/oauth/token` providing `code_verifier`.

Token exchange specifics

- The token endpoint validates:
  - The client exists (from `oauth_clients` table).
  - Confidential clients must provide `client_secret` that matches the stored hash.
  - The authorization code exists in Redis and matches `client_id` and `redirect_uri`.
  - The `code_verifier` matches the stored `code_challenge`.
  - If a `state` was bound to the code, the same `state` must be provided on exchange (to mitigate CSRF).
- On success, the server issues:
  - `access_token` (RS256, 15m)
  - `refresh_token` (RS256, 7d) — hashed in DB and session record created
  - `id_token` (OIDC) when appropriate

Common mistakes

- Mismatched `redirect_uri`.
- Missing `code_verifier` for PKCE (required).
- Using an expired authorization code (10 min TTL).

Security notes

- Authorization codes are single-use: the server deletes the Redis key after successful exchange.
- PKCE with `S256` is mandatory for public clients.

Source references

- Controller: [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- PKCE helper: [backend/src/core/crypto.ts](backend/src/core/crypto.ts)