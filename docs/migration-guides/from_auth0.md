# Migration Guide — From Auth0 to AuthHub

This guide maps common features from Auth0 to AuthHub and provides a migration checklist.

Feature mapping

- Tenants / Organizations
  - Auth0: Tenant
  - AuthHub: `Tenant` model with `clientId`, `customDomain`, `ownerId`.

- Clients / Applications
  - Auth0: Applications
  - AuthHub: `OAuthClient` (register via `/api/v1/developer/clients`).

- Rules / Hooks
  - Auth0: Rules
  - AuthHub: Webhook endpoints and middleware — implement custom logic in webhooks or extend server.

- Social Connections
  - Auth0: Connection settings
  - AuthHub: Social login implemented for Google/GitHub in `backend/src/modules/auth/social.ts`.

Migration checklist

1. Export users from Auth0 (CSV or API) and write a migration script to import into AuthHub `users` table.
2. Migrate OAuth client registrations to `oauth_clients` table via `POST /api/v1/developer/clients` API.
3. Reconfigure social provider credentials in AuthHub environment variables (`GOOGLE_CLIENT_ID`, etc.).
4. Update application code to call AuthHub endpoints (`/api/v1/oauth/authorize`, `/api/v1/oauth/token`, OIDC discovery).
5. Rotate keys and test JWKS-based verification.

Security notes

- Passwords: If you have hashed passwords from Auth0 in a non-Argon2 format, consider forcing a password reset on first login or implement an import path that supports the legacy hash and then re-hash with Argon2 on successful login.

Source references

- Social login implementation: [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts)
- OAuth flows: [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)