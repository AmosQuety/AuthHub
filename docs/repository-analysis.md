# AuthHub Repository Analysis Report

Generated: 2026-06-01

---

## System Overview

AuthHub is a production-grade Auth-as-a-Service platform implemented in Node.js + Express with a PostgreSQL datastore (accessed via Prisma) and Redis for short-lived artifacts (authorization codes). It exposes REST endpoints for classic Authentication, OAuth 2.0 authorization code (PKCE) flows, and OpenID Connect (OIDC) discovery/JWKS/UserInfo.

Primary runtime components:
- HTTP API server (Express) — [backend/src/index.ts](backend/src/index.ts)
- Persistence: PostgreSQL (Prisma client) — [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- Short-lived artifacts: Redis (auth codes) — [backend/src/db/redis.ts](backend/src/db/redis.ts)
- Crypto & JWT signing (RS256) — [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
- OAuth controllers & token handling — [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- OIDC endpoints — [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)
- Auth routes (register/login/refresh/logout/social) — [backend/src/modules/auth/router.ts](backend/src/modules/auth/router.ts)

## Main Modules

- `src/modules/auth` — local auth, registration, login, session management, social providers (Google/GitHub). See [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts).
- `src/modules/oauth` — OAuth 2.0 endpoints (`/authorize`, `/token`, consent). See [backend/src/modules/oauth/router.ts](backend/src/modules/oauth/router.ts) and [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts).
- `src/modules/oidc` — OIDC discovery, JWKS, and userinfo. See [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts).
- `src/core` — crypto primitives, JWT generation/verification, PKCE verification, password hashing. See [backend/src/core/crypto.ts](backend/src/core/crypto.ts).
- `prisma` — schema and migrations. See [backend/prisma/schema.prisma](backend/prisma/schema.prisma) and migrations in `backend/prisma/migrations/`.
- `src/middlewares` — authentication middleware, rate limiting, validation and error handling. Example: [backend/src/middlewares/authenticate.ts](backend/src/middlewares/authenticate.ts).
- `src/docs/openapi.ts` — in-repo OpenAPI 3 spec that powers the Swagger endpoint. See [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts).

## Folder Structure Summary

Key folders (relative to `backend/`):
- `src/` — application source (controllers, modules, middlewares, core, db)
- `prisma/` — schema & migrations
- `scripts/` — operational scripts (backfills, maintenance scripts)
- `nginx/` — example ingress config

Top-level entry: [backend/src/index.ts](backend/src/index.ts)

## Authentication Architecture

- Local accounts: email + password with Argon2 hashing (`core/crypto.ts`). User model: `User` in Prisma schema ([backend/prisma/schema.prisma](backend/prisma/schema.prisma)).
- Session model: `Session` table stores refreshTokenHash, deviceInfo, ipAddress, familyId for revocation, expiresAt. Refresh tokens are RS256 signed JWTs that embed `sid` (session id) and `sub` (user id).
- Login flow: `/api/v1/auth/login` issues short-lived access token (RS256 JWT, 15 minutes) and a refresh token (7 days) and stores hashed refresh token in `sessions` table.
- Refresh: `/api/v1/auth/refresh` implements refresh-token rotation — verifies refresh JWT, compares hashed value with DB, creates new session, deletes old session. (See [backend/src/modules/oauth/controller.ts] and auth controllers.)

Files:
- [backend/src/modules/auth/router.ts](backend/src/modules/auth/router.ts)
- [backend/src/modules/auth/controller.ts] (multiple login helpers — not all scanned yet)
- [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)

## OAuth 2.0 Architecture

- Authorization endpoint: `/api/v1/oauth/authorize` (GET redirects to frontend, POST issues authorization code after consent). Implemented in [backend/src/modules/oauth/controller.ts].
- Authorization codes: securely generated random value stored in Redis under `hub:auth_code:<code>` with a TTL (10 minutes). Stored content includes `userId`, `codeChallenge`, `scope`, `clientId`, `redirectUri`, `nonce`, and `state`.
- Token endpoint: `/api/v1/oauth/token` supports `authorization_code` (PKCE) and `refresh_token` grants. Implements PKCE verification via `core.verifyPkceChallenge` and CSRF state checks. Issues `access_token`, `refresh_token`, and `id_token` (for OIDC) as appropriate.
- Client credentials: OAuth clients persisted in `oauth_clients` table (Prisma model `OAuthClient`). Confidential clients contain a hashed secret; public clients are marked with `isPublic`. The token endpoint validates client secrets for confidential clients.

Files:
- [backend/src/modules/oauth/router.ts](backend/src/modules/oauth/router.ts)
- [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) (table `oauth_clients`)

## OpenID Connect (OIDC) Architecture

- Discovery: `/.well-known/openid-configuration` served by [backend/src/modules/oidc/controller.ts] at `/api/v1/oidc/.well-known/openid-configuration`.
- JWKS: `/.well-known/jwks.json` served by `getJwks()` using the public key exported from `core/crypto.ts`. Kid is a deterministic JWK thumbprint (RFC 7638) to keep `kid` stable.
- UserInfo: `/api/v1/oidc/userinfo` returns `sub`, `email`, and `email_verified` when called with a valid access token (middleware `authenticate`).

Files:
- [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)
- [backend/src/core/crypto.ts](backend/src/core/crypto.ts)

## Database Architecture

- PostgreSQL managed by Prisma. Main models relevant to auth: `User`, `Session`, `OAuthClient`, `AuthProvider`, `UserConsent`, `Tenant`, `Entitlement`, `MfaMethod`, `AuditLog`.
- Migrations present under `backend/prisma/migrations/`.

Files:
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- [backend/prisma/migrations/](backend/prisma/migrations/)

## Security Architecture

- Password hashing: Argon2 with optional server-side PEPPER (`ARGON2_PEPPER`) — [backend/src/core/crypto.ts].
- JWT signing: RS256 using `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY` env vars. JWKS served from public key. Kid derived from JWK thumbprint.
- PKCE: Enforced for authorization code flow; only `S256` supported. PKCE verification implemented in `core.verifyPkceChallenge`.
- Refresh rotation & session binding: refresh tokens include `sid` and are validated by comparing hashed token in DB. Old session is deleted on rotation.
- CSRF protection for code exchange: `state` stored with auth code and validated on token exchange.
- Cookies: refresh tokens set as `HttpOnly` secure cookie; access token optionally set as non-HttpOnly short-lived cookie for cross-domain handoff in social flows.

Files:
- [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
- [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts)

## Session Architecture

- Sessions stored in `sessions` table with fields `refreshTokenHash`, `familyId` (for family/rolling revocation), `expiresAt`, `deviceInfo`, and `ipAddress`.
- On refresh, a new session entry is created and the old one deleted — this is refresh token rotation with single active session per refresh token.

Files:
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)

## Token Architecture

- Access Token: RS256 JWT, 15-minute expiry, contains `sub`, `sid`, `roles`, optional `scopes` array, and `act` (impersonation) claim if applicable.
- Refresh Token: RS256 JWT, 7-day expiry, contains `sub`, `sid`, and `type: 'refresh'`. Stored hashed in DB.
- ID Token: Generated in `generateIdToken()` with claims like `sub`, `aud`, `iss`, optionally `email`, `email_verified`, `name` when `email` scope is present.

Files:
- [backend/src/core/crypto.ts](backend/src/core/crypto.ts)

## Key Workflows

1. User Registration & Login (local): `POST /api/v1/auth/register`, `POST /api/v1/auth/login` → issues access + refresh tokens and creates `Session`.
2. Social Login (Google/GitHub): `GET /api/v1/auth/google` or `/github` → provider flow → callback `/api/v1/auth/google/callback` → upsert user/provider, create session, set cookies, redirect to frontend. See [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts).
3. OAuth Authorization Code (PKCE): `GET /api/v1/oauth/authorize` redirects to frontend; frontend shows consent, then `POST /api/v1/oauth/authorize` (authenticated) generates code stored in Redis. Client exchanges code at `POST /api/v1/oauth/token` with `code_verifier`.
4. Token Refresh: `POST /api/v1/auth/refresh` or `POST /api/v1/oauth/token` with `grant_type=refresh_token` — validate refresh token, rotate session.

## Potential Documentation Gaps & Flags

- OpenAPI vs runtime path mismatch:
  - `openapi.ts` exposes `/oidc/jwks` in paths, but runtime router serves JWKS at `/.well-known/jwks.json` under `/api/v1/oidc/.well-known/jwks.json`. (Files: [backend/src/docs/openapi.ts] vs [backend/src/modules/oidc/router.ts] & [backend/src/modules/oidc/controller.ts]). This is a Swagger mismatch that must be reconciled.
- JWKS file name and discovery URL formatting differences between OpenAPI and controllers.
- Some controllers reference endpoints and behaviors not fully enumerated in `openapi.ts` (e.g., cookie behavior, specific response shape for `/oauth/token` includes `id_token` in practice).
- Not all module controllers were exhaustively scanned (e.g., full `auth/controller.ts` implementations, admin/developer modules). Further pass needed to ensure complete coverage of every public endpoint.
- Audit logging, rate-limiter configuration, and observability integrations require further inspection for thresholds and backends (e.g., Sentry, Prometheus) — not yet fully documented.

## Security Concerns / Notes

- `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` are required; ensure secure rotation procedures. Key ID (kid) is deterministic via JWK thumbprint; rotating keys requires process to publish new JWKS and maintain old keys until tokens expire.
- Access token lifetime is short (15m) and refresh tokens are rotated and stored hashed — good practice.
- Cookie settings vary between routes (some use `sameSite: 'lax'` vs `'strict'`) — document exact behaviors and recommended security posture for cross-site flows.

## Files Reviewed in This Pass

- [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- [backend/src/index.ts](backend/src/index.ts)
- [backend/src/modules/oauth/router.ts](backend/src/modules/oauth/router.ts)
- [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- [backend/src/modules/oidc/router.ts](backend/src/modules/oidc/router.ts)
- [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)
- [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
- [backend/src/modules/auth/router.ts](backend/src/modules/auth/router.ts)
- [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts)
- [backend/src/middlewares/authenticate.ts](backend/src/middlewares/authenticate.ts)

---

## Next Steps (recommended)

1. Continue a full repository scan covering all controllers, middlewares, and modules to ensure APi Reference parity.
2. Reconcile OpenAPI mismatches and update `openapi.ts` to match runtime behavior or vice versa.
3. Produce the Repository Analysis Report as a living document (this file) and then generate the full `docs/` Markdown site based on the analysis.

---

_End of analysis (partial scan). Continue with a comprehensive pass to complete every required doc section._
