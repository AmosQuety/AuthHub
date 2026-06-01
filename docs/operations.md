# Operations Guide

This guide covers environment variables, deployment, monitoring, logging, scaling, backups, and production considerations.

Environment variables (key)

- `DATABASE_URL` — runtime database connection (transaction pooler). See Prisma datasource in `backend/prisma/schema.prisma`.
- `DIRECT_URL` — direct DB connection for migrations (Prisma migrate).
- `JWT_PRIVATE_KEY` — RS256 private key (PKCS#8 PEM). Required.
- `JWT_PUBLIC_KEY` — RS256 public key (SPKI PEM). Required.
- `ARGON2_PEPPER` — optional static pepper for Argon2 hashing.
- `BASE_URL` — canonical base URL for discovery and token `iss` claim.
- `CLIENT_URL` / `FRONTEND_URL` — frontend base URL for social login redirects.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth credentials (if using social logins).
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — GitHub OAuth credentials.
- `REDIS_URL` — Redis connection string.
- `NODE_ENV` — runtime environment (production/test/development).

Deployment

- Containerize the server (Dockerfile exists under `backend/Dockerfile`).
- Ensure secrets are provided via a secure secret store (Kubernetes Secrets, cloud provider secret manager).
- Use `BASE_URL` matching the externally accessible host (used in token `iss` and OIDC discovery).

Scaling

- Stateless portions (token verification, oauth flows) scale horizontally.
- Ensure Redis and Postgres scale appropriately for sessions and auth-code lookups.
- Use connection pooling for Postgres (Prisma recommendations) and a managed Redis for high availability.

Logging & Monitoring

- Server logs are emitted via `backend/src/core/logger.ts` (structured logs). Integrate with centralized logging (e.g., Datadog, ELK).
- Monitor key metrics: login rate, token exchange rate, refresh rate, failed login attempts, rate-limit triggers.

Backups & Recovery

- Regular backups of Postgres using provider snapshot tools.
- For accidental data loss, restore from point-in-time or the latest snapshot and re-run migrations.
- Redis stores ephemeral auth codes only; if lost, affected in-progress authorizations will fail but are safe to retry.

Maintenance & Key Rotation

- Rotate `JWT_PRIVATE_KEY` by publishing a new JWK in JWKS and supporting both keys during transition until old access tokens expire.
- Rotate database credentials and client secrets carefully; when rotating client secrets, use the developer `rotate` endpoint: `POST /api/v1/developer/clients/{clientId}/rotate`.

Health checks & Keep-alive

- `/health` endpoint performs DB and Redis checks. Use it for orchestration health checks.
- The server has a cron job to ping DB and Redis periodically (`runKeepAlive` in `backend/src/index.ts`).

Security Best Practices for Operations

- Use HTTPS everywhere and HSTS.
- Use secure cookie flags in production (HttpOnly, Secure, SameSite as appropriate).
- Protect admin and developer routes behind strong access controls.
- Limit origins via `ALLOWED_ORIGINS`.

See source code references:

- Entrypoint & health: [backend/src/index.ts](backend/src/index.ts)
- Logger: [backend/src/core/logger.ts](backend/src/core/logger.ts)
- Prisma schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)