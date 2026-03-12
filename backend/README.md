# AuthHub Backend

AuthHub is an enterprise-grade authentication and authorization service designed to be self-hosted or deployed as a central identity provider. It is built with **Node.js, Express, TypeScript, Prisma (PostgreSQL), and Redis**, adhering to modern security standards including OAuth 2.0 / OIDC and WebAuthn (Passkeys).

This repository contains the backend service, which has been fully implemented across 11 architectural phases.

---

## 🚀 Features Completed (Phases 1–11)

### Core Authentication & Security (Phases 1 & 2)
- **Email/Password Login**: Secure password hashing using Argon2id with a system-wide pepper.
- **JWT & Sessions**: RS256 asymmetrically signed Access Tokens tightly bound to stateful Redis-backed refresh tokens (revocable).
- **Brute-Force Protection**: Progressive lockout mechanisms backed by Redis to defend against credential stuffing.
- **CSRF & CORS**: Environment-based explicit origin whitelists, HTTP-only strict cookies, and `state` payload validation.
- **OAuth 2.0 Provider**: Authorization Code Flow with PKCE support for public clients. Includes custom scopes and token introspection (`RFC 7662`).

### OpenID Connect & Social Logins (Phases 3 & 4)
- **OIDC Core**: Serves standard `.well-known/openid-configuration` and JWKS endpoints. Standard OIDC claims mapping (`sub`, `iss`, `aud`, `exp`, `iat`).
- **Social SSO**: Google and GitHub OAuth integrations mapping external identities to local AuthHub accounts.

### Advanced Authentication Options (Phases 5 & 6)
- **Passkeys (WebAuthn)**: Passwordless biometric authentication strictly adhering to WebAuthn relying party specifications.
- **Multi-Factor Authentication (MFA)**: TOTP implementation (Google Authenticator, Authy). Issues recovery codes and enforces an `mfaToken` intermediate step during login for enrolled users.

### User Roles, Permissions & Tenants (Phases 7, 8, & 9)
- **RBAC**: Role-Based Access Control mapping `roles` to `permissions` inside the JWT payload.
- **Admin Dashboard APIs**: Full CRUD operations for managing users, forcing specific MFA policies, and analyzing session logs.
- **Multi-Tenancy Architecture**: Strict logical separation via `tenantId` schema design enabling SaaS scenarios.
- **Audit Logging**: Comprehensive structured logging of security events (logins, MFA enrollment, permission escalation) synced to PostgreSQL.

### Account Recovery & Communications (Phase 10)
- **Email Verification**: Single-use hex tokens stored in Redis for confirming account ownership.
- **Password Reset**: Secure forgot-password flows using opaque tokens. Strictly implements anti-enumeration (always returning 200 regardless of email existence) and automatically revokes all active sessions upon successful reset.
- **Mailer Configuration**: Modular Nodemailer wrapper configured via environment variables.

### DevOps & Production Infrastructure (Phase 11)
- **Scalability**: Redis handles all rate limiting, sessions, and state. PostgreSQL (Supabase) serves as the persistent system of record.
- **Dockerized Environment**: Multi-stage `Dockerfile` creating a lean Alpine production image without development dependencies. `docker-compose.yml` for orchestrating the Node app alongside Redis.
- **Nginx Reverse Proxy**: Terminating SSL, enforcing HSTS/NOSNIFF headers, and providing network-layer rate limiting zones to shield the application.
- **Automated CI/CD**: GitHub Actions pipeline that performs strict TypeScript type checking, executes Vitest integration testing against a live Redis container, builds the source, and securely pushes tagged container images to the GitHub Container Registry (GHCR).

---

## 🛠️ Tech Stack & Requirements
- Node.js (v20+)
- PostgreSQL (or Supabase Connection Pooler URL)
- Redis

### Key Dependencies
- `express` — Core HTTP routing
- `prisma` — PostgreSQL ORM
- `ioredis` — High-performance Redis client
- `argon2` — State-of-the-art password hashing
- `jsonwebtoken` & `jose` — Standardized RS256 JWTs
- `@simplewebauthn/server` — FIDO2 / Passkeys
- `otplib` & `qrcode` — TOTP MFA
- `nodemailer` — Transactional emails

---

## 📦 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Setup Environment**
   Copy `.env.development` to `.env` and configure your database strings. Ensure your local Redis server is running, or map `REDIS_URL` correctly.
3. **Generate JWT RSA Keys**
   The application requires asymmetric keys to sign tokens. Generate them using the provided script and place them in your `.env`:
   ```bash
   node scripts/generate-keys.mjs
   ```
4. **Database Migration**
   ```bash
   npx prisma migrate dev
   ```
5. **Start Dev Server**
   ```bash
   npm run dev
   ```
6. **Testing**
   The backend includes a `vitest` unit and integration suite. No external databases are hit (Redis container recommended via compose, Mailer mocked).
   ```bash
   npm run test
   ```

---

*This marks the completion of the backend architecture. The implementation focus now shifts to the client-side frontend UI (Phase 12).*
