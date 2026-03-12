# AuthHub Backend — Codebase Analysis & Full Task List

## Current Codebase Snapshot

### Tech Stack (in use)
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript (strict ESM) |
| Framework | Express 5 |
| ORM | **Prisma** (active) + **Drizzle** (unused, just [schema.ts](file:///c:/new%20code/AuthHub/backend/src/db/schema.ts) + [connection.ts](file:///c:/new%20code/AuthHub/backend/src/db/connection.ts)) |
| Database | PostgreSQL via Supabase |
| Cache | Redis via `ioredis` |
| Hashing | `argon2` |
| JWT | `jose` (RS256 asymmetric) |
| Infra | Docker Compose (stub only) |

> [!WARNING]
> **Two ORM systems coexist** — Prisma ([src/db/client.ts](file:///c:/new%20code/AuthHub/backend/src/db/client.ts)) is the one actually used everywhere. Drizzle ([src/db/connection.ts](file:///c:/new%20code/AuthHub/backend/src/db/connection.ts) + [src/db/schema.ts](file:///c:/new%20code/AuthHub/backend/src/db/schema.ts)) is dead code. This should be resolved early.

---

### What Is Already Built

#### [prisma/schema.prisma](file:///c:/new%20code/AuthHub/backend/prisma/schema.prisma)
- ✅ `User` — id, email, password_hash, email_verified, timestamps, relation to Session
- ✅ `Session` — id, user_id, refresh_token_hash, device_info, expires_at
- ✅ `OAuthClient` — client_id, client_secret_hash, redirect_uris, name
- ❌ Missing: `auth_providers`, `mfa_methods`, `tenants` tables (all in the spec)

#### [src/core/crypto.ts](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts)
- ✅ [hashPassword](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#6-9) / [verifyPassword](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#10-17) (argon2)
- ✅ [generateTokens](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#47-64) — RS256 access token (15 m) + refresh token (7 d) as JWTs
- ✅ [verifyToken](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#65-70) (RS256 public key)
- ✅ [getPublicJwk](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#42-46) — exports public key as JWK
- ✅ [verifyPkceChallenge](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#73-87) — S256
- ✅ [generateIdToken](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#88-103) — RS256 ID token with `sub`, `aud`, `iss`, `nonce`
- ❌ No `iss`/`jti` claim on access tokens (needed for OIDC)
- ❌ `ARGON2_PEPPER` env var is defined but **not used** in [hashPassword](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#6-9)
- ❌ Refresh token is itself a signed JWT — but [logout](file:///c:/new%20code/AuthHub/backend/src/modules/auth/controller.ts#145-200) uses `jose.decodeJwt` (no verification), which is insecure

#### `src/modules/auth` — `/api/v1/auth`
- ✅ `POST /register` — creates user, hashes password
- ✅ `POST /login` — verifies credentials, creates session, sets HttpOnly refresh-token cookie, returns access token
- ✅ `POST /logout` — decodes refresh JWT, deletes all user sessions, clears cookie
- ✅ `GET /me` — auth-gated, returns profile from Redis cache or DB
- ❌ `POST /refresh` — **missing**, no way to rotate refresh tokens
- ❌ No input validation library (Zod / Joi)
- ❌ No rate limiting on `/login` or `/register`
- ❌ Logout deletes **all** sessions rather than the targeted one (architecture note in the code itself flagged this)
- ❌ No `ip` stored in sessions (spec requires it for risk engine)

#### `src/modules/oauth` — `/api/v1/oauth`
- ✅ `GET /authorize` — validates client, enforces PKCE (S256), issues auth code to Redis (10 min TTL), redirects
- ✅ `POST /token` — validates client secret, redeems auth code, verifies PKCE, issues access + refresh + ID tokens, creates session
- ❌ `state` param passed through but not validated (CSRF protection incomplete)
- ❌ `scopes` stored in Redis on `/authorize` but never applied to token claims
- ❌ No `refresh_token` grant type in `/token`
- ❌ Client secret always required — no support for public (PKCE-only) clients

#### `src/modules/oidc` — `/auth`
- ✅ `GET /.well-known/jwks.json` — returns RS256 public JWK
- ✅ `GET /.well-known/openid-configuration` — minimal discovery doc
- ❌ `GET /userinfo` endpoint is listed in discovery doc but points to `/api/v1/auth/me` — not a standards-compliant userinfo endpoint
- ❌ `authorization_endpoint` and `token_endpoint` in discovery doc point to wrong paths

#### `src/middlewares/`
- ✅ [authenticate.ts](file:///c:/new%20code/AuthHub/backend/src/middlewares/authenticate.ts) — Bearer token extraction, RS256 verification, attaches `req.user`
- ✅ [errorHandler.ts](file:///c:/new%20code/AuthHub/backend/src/middlewares/errorHandler.ts) — global error handler
- ❌ No rate-limit middleware
- ❌ No request-validation middleware
- ❌ [express.d.ts](file:///c:/new%20code/AuthHub/backend/src/types/express.d.ts) imports `jsonwebtoken` (not installed!) — minor type-only import but should be cleaned up

#### `src/db/`
- ✅ [client.ts](file:///c:/new%20code/AuthHub/backend/src/db/client.ts) — Prisma singleton (dev hot-reload safe)
- ✅ [redis.ts](file:///c:/new%20code/AuthHub/backend/src/db/redis.ts) — ioredis singleton with error handling
- ✅ [seed-client.ts](file:///c:/new%20code/AuthHub/backend/src/db/seed-client.ts) — seeds one OAuth client for dev
- ❌ [schema.ts](file:///c:/new%20code/AuthHub/backend/src/db/schema.ts) + [connection.ts](file:///c:/new%20code/AuthHub/backend/src/db/connection.ts) (Drizzle) — unused dead code
- ❌ No DB migration files tracked (Prisma migrations folder empty)

#### [docker-compose.yml](file:///c:/new%20code/AuthHub/backend/docker-compose.yml) (stub)
- Minimal file, likely just postgres/redis services — not fully configured

#### [.env](file:///c:/new%20code/AuthHub/backend/.env)
- JWT keys are **placeholder strings** — real keys not generated yet
- `DATABASE_URL` has `[PASSWORD]` and `[HOST]` placeholders — not connected
- `ARGON2_PEPPER` defined but unused in code

---

## Full Task List (Ordered by Priority)

### 🔴 Phase 0 — Foundation Fixes (Do First)

- [ ] **Remove dead Drizzle code** — delete [src/db/schema.ts](file:///c:/new%20code/AuthHub/backend/src/db/schema.ts) and [src/db/connection.ts](file:///c:/new%20code/AuthHub/backend/src/db/connection.ts); remove `drizzle-orm` and `postgres` from [package.json](file:///c:/new%20code/AuthHub/backend/package.json)
- [ ] **Generate real RS256 keys** and populate [.env](file:///c:/new%20code/AuthHub/backend/.env) (`JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`)
- [ ] **Connect the database** — fill in real `DATABASE_URL` for Supabase, run `npx prisma db push` or `migrate deploy`
- [ ] **Connect Redis** — confirm local or cloud Redis is running and `REDIS_URL` is correct
- [ ] **Fix the [express.d.ts](file:///c:/new%20code/AuthHub/backend/src/types/express.d.ts) import** — remove the unused `jsonwebtoken` import (package not installed)
- [ ] **Wire `ARGON2_PEPPER`** into [hashPassword](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#6-9) / [verifyPassword](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#10-17) in [crypto.ts](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts)
- [ ] **Add missing Prisma migration** — create initial migration for current schema (`npx prisma migrate dev --name init`)
- [ ] **Verify Docker Compose** — ensure [docker-compose.yml](file:///c:/new%20code/AuthHub/backend/docker-compose.yml) spins up Postgres + Redis correctly for local dev

---

### 🟠 Phase 1 — Complete Core Auth (`/api/v1/auth`)

- [ ] **Add `POST /api/v1/auth/refresh`** — accept refresh token from cookie, verify it (RS256), find session in DB, rotate token (delete old session, create new one), return new access + refresh tokens
- [ ] **Fix `POST /logout`** — instead of decoding without verification, verify the refresh JWT and delete only the specific session (add `sessionId` claim to refresh token in [generateTokens](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#47-64))
- [ ] **Add `ip` field to `Session` model** in Prisma schema and store `req.ip` on login and token exchange
- [ ] **Add input validation** — install `zod`, create validation schemas for [register](file:///c:/new%20code/AuthHub/backend/src/modules/auth/controller.ts#7-42) and [login](file:///c:/new%20code/AuthHub/backend/src/modules/auth/controller.ts#43-104) request bodies, add a `validate` middleware
- [ ] **Add rate limiting** — install `express-rate-limit` with a Redis store (`rate-limit-redis`); apply to `/login`, `/register`, `/token`
- [ ] **Add brute-force protection** — track failed login attempts in Redis per IP per email; implement progressive backoff (lock out after N failures)
- [ ] **Fix CORS configuration** — replace `cors()` with explicit `origin` whitelist from env vars

---

### 🟠 Phase 2 — Complete OAuth 2.0 + OIDC

- [ ] **Add `refresh_token` grant type to `POST /token`** — accept refresh token, verify, rotate, return new tokens
- [ ] **Apply scopes to token claims** — parse the `scope` from auth code data and include approved claims in access token and ID token
- [ ] **Support public (PKCE-only) clients** — allow `client_secret` to be optional if the client was registered as public
- [ ] **Validate `state` parameter** — store `state` in the auth code Redis entry and validate on redirect (CSRF protection)
- [ ] **Fix OIDC discovery document** — correct `authorization_endpoint` and `token_endpoint` URLs to match actual routes
- [ ] **Add proper `GET /userinfo` endpoint** — move it to `/auth/userinfo`, require Bearer access token, return OIDC-compliant claims (`sub`, `email`, `email_verified`, `name` etc.)
- [ ] **Add `iss` and `jti` claims to access tokens** in [generateTokens](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts#47-64)
- [ ] **Add `kid` to JWT headers** so verifiers can look up the correct JWK

---

### 🟡 Phase 3 — Database Schema Extensions

- [ ] **Add `auth_providers` table** to Prisma schema (`user_id`, `provider` [Google/GitHub/Apple], `provider_id`, `provider_email`)
- [ ] **Add `mfa_methods` table** (`user_id`, `type` [TOTP/WebAuthn], `secret`, `enabled`, `created_at`)
- [ ] **Add `tenants` table** (`id`, `name`, `logo_url`, `primary_color`, `auth_policy_id`)
- [ ] **Extend `OAuthClient`** — add `scopes[]`, `grant_types[]`, `is_public` (boolean), `tenant_id` (FK)
- [ ] **Extend `Session`** — add `ip_address`, `family_id` (for refresh token family revocation)
- [ ] **Run migrations** for all schema changes

---

### 🟡 Phase 4 — Social OAuth Login (Google/GitHub)

- [ ] **Install `passport` + `passport-google-oauth20` + `passport-github2`** (or use raw PKCE flows)
- [ ] **Add `GET /api/v1/auth/google`** — redirect to Google OAuth
- [ ] **Add `GET /api/v1/auth/google/callback`** — handle callback, upsert user + auth_provider record, issue session
- [ ] **Add `GET /api/v1/auth/github`** — same pattern for GitHub
- [ ] **Add `GET /api/v1/auth/github/callback`**
- [ ] **Store `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`** in [.env](file:///c:/new%20code/AuthHub/backend/.env)

---

### 🟡 Phase 5 — MFA (TOTP)

- [ ] **Install `speakeasy` or `otplib`** for TOTP generation/verification
- [ ] **Add `POST /api/v1/auth/mfa/totp/enroll`** — generate TOTP secret, return QR code URI
- [ ] **Add `POST /api/v1/auth/mfa/totp/verify`** — validate TOTP code, mark method as `enabled` in DB
- [ ] **Add `POST /api/v1/auth/mfa/totp/challenge`** — validate TOTP during login flow
- [ ] **Integrate MFA check into login flow** — after password verify, if user has enabled TOTP, return a `mfa_required` intermediate state instead of tokens; issue tokens only after TOTP challenge

---

### 🟡 Phase 6 — Passkeys / WebAuthn

- [ ] **Install `@simplewebauthn/server`**
- [ ] **Add `POST /api/v1/auth/passkey/register/options`** — generate and cache registration options in Redis
- [ ] **Add `POST /api/v1/auth/passkey/register/verify`** — verify registration, store `credential_id` + `public_key` in `mfa_methods`
- [ ] **Add `POST /api/v1/auth/passkey/auth/options`** — generate authentication options
- [ ] **Add `POST /api/v1/auth/passkey/auth/verify`** — verify assertion, issue session

---

### 🟡 Phase 7 — Risk Engine & Adaptive MFA

- [ ] **Install a GeoIP library** (e.g. `geoip-lite`) for IP-to-location resolution
- [ ] **Build `RiskEngine` class/service** in `src/core/riskEngine.ts` — calculates score from: IP change, new device fingerprint, login frequency
- [ ] **Instrument `/login`** — run risk engine, store score in session, decide: low → issue tokens, medium → require TOTP, high → require passkey re-auth or block
- [ ] **Store device fingerprint** (hash of User-Agent + screen/platform hints) in session

---

### 🟡 Phase 8 — Multi-Tenant & Client Registry

- [ ] **Add `GET /api/v1/clients/:tenant_id/config`** — return branding and auth policy for a tenant (logo, primary_color, require_mfa, allow_passkeys)
- [ ] **Add admin endpoints for client management** (`POST /admin/clients`, `PUT /admin/clients/:id`, `DELETE /admin/clients/:id`) — protected by an admin role
- [ ] **Add RBAC** — extend `User` model with `roles[]`, inject roles into JWT claims

---

### 🟢 Phase 9 — Security Hardening

- [ ] **Security headers** — audit Helmet config, add `Content-Security-Policy`, `Strict-Transport-Security`
- [ ] **Refresh token family revocation** — if a used refresh token is replayed, revoke the entire session family in DB and Redis
- [ ] **Audit logging** — create an `audit_logs` table and middleware to record every login, logout, MFA event, password change with IP + User-Agent
- [ ] **Token introspection endpoint** (`POST /auth/introspect`) — for resource servers to validate access tokens
- [ ] **Token revocation endpoint** (`POST /auth/revoke`) — RFC 7009

---

### 🟢 Phase 10 — Email Verification & Password Reset

- [ ] **Install nodemailer or integrate Resend/SendGrid**
- [ ] **Add `POST /api/v1/auth/verify-email/send`** — generate short-lived token, store in Redis, send email
- [ ] **Add `GET /api/v1/auth/verify-email/:token`** — verify token, set `email_verified = true`
- [ ] **Add `POST /api/v1/auth/forgot-password`** — generate reset token stored in Redis
- [ ] **Add `POST /api/v1/auth/reset-password`** — verify token, rehash new password, invalidate all sessions

---

### 🟢 Phase 11 — DevOps & Production

- [ ] **Complete [docker-compose.yml](file:///c:/new%20code/AuthHub/backend/docker-compose.yml)** — Postgres 16 + Redis 7 + the Node app service with health checks
- [ ] **Add Nginx reverse proxy config** with SSL termination and rate limiting at the network layer
- [ ] **Set up environment-based `.env.*` files** (`.env.development`, `.env.production`, `.env.test`)
- [ ] **Add [tsconfig.json](file:///c:/new%20code/AuthHub/backend/tsconfig.json) path aliases** to simplify imports (e.g. `@/core/*`, `@/db/*`)
- [ ] **Set up CI/CD** — GitHub Actions pipeline: lint → type-check → test → build → Docker push
- [ ] **Add Jest / Vitest** — unit tests for [crypto.ts](file:///c:/new%20code/AuthHub/backend/src/core/crypto.ts), integration tests for auth and oauth flows
- [ ] **Remove `ts-node-dev` from production build path** — use compiled `dist/` only in prod

---

### 🔵 Phase 12 — Hosted UI (Frontend)

- [ ] **Scaffold React app** at `auth.yourdomain.com` (Vite or Next.js)
- [ ] **Build Login page** — email/password, social buttons, "Forgot password" link
- [ ] **Build Register page** — email/password form with validation feedback
- [ ] **Build MFA Challenge page** — TOTP input + passkey prompt
- [ ] **Build Passkey Setup page**
- [ ] **Build Password Reset flow pages**
- [ ] **Build Session Manager page** — list active sessions, "Revoke" button per session
- [ ] **Implement theming engine** — fetch branding config on load from `GET /api/v1/clients/:tenant_id/config` and apply CSS variables

---

## Summary: What Works Right Now

| Feature | Status |
|---|---|
| User registration | ✅ Works |
| User login (email/password) | ✅ Works (pending real DB/keys) |
| Logout (cookie clear) | ⚠️ Works but has architecture flaw (all sessions deleted) |
| `/me` profile (cached) | ✅ Works |
| JWKS endpoint | ✅ Works |
| OIDC discovery doc | ⚠️ Works but URLs are wrong |
| OAuth Auth Code + PKCE | ✅ Works (pending real DB/keys) |
| OAuth Token exchange | ✅ Works |
| Refresh token rotation | ❌ Missing |
| MFA (TOTP) | ❌ Not started |
| Passkeys/WebAuthn | ❌ Not started |
| Social login | ❌ Not started |
| Rate limiting | ❌ Not started |
| Email verification | ❌ Not started |
| Admin / multi-tenant | ❌ Not started |
| Frontend (Hosted UI) | ❌ Not started |
