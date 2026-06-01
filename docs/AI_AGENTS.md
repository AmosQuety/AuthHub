# AI_AGENTS.md

Purpose

This file provides a concise, machine-friendly summary and cheat sheet so automated agents can integrate with AuthHub programmatically without reading source code.

Platform overview

- Base API prefix: `/api/v1`
- Important base URLs (resolve using `BASE_URL` env or default `http://localhost:3000`)
- Key resources: `/auth`, `/oauth`, `/oidc`, `/developer`
- Portal home: [docs/index.md](docs/index.md)
- Portal structure: [navigation.yaml](navigation.yaml), [sidebar.yaml](sidebar.yaml), [redocly.yaml](redocly.yaml)

Authentication flow summary

1. User authenticates via `/auth/login` (email/password) or a social callback (`/auth/google/callback`).
2. Server issues access token (`access_token`), refresh token (`refresh_token`), and optionally an `id_token` for OIDC.
3. Client uses `Authorization: Bearer <access_token>` to call protected endpoints.
4. To get a fresh access token, call `POST /api/v1/oauth/token` with `grant_type=refresh_token`.

OAuth flow summary (PKCE)

- Start: Redirect user to `/api/v1/oauth/authorize` (the backend will redirect to the frontend authorize page which collects consent).
- The frontend POSTs consent to `/api/v1/oauth/authorize` (authenticated user) — server stores authorization code in Redis.
- Exchange: `POST /api/v1/oauth/token` with `grant_type=authorization_code`, `code`, `code_verifier`, `client_id`, and `redirect_uri`.

OIDC flow summary

- Discovery: `GET /api/v1/oidc/.well-known/openid-configuration`.
- JWKS: `GET /api/v1/oidc/.well-known/jwks.json`.
- UserInfo: `GET /api/v1/oidc/userinfo` with `Authorization: Bearer <access_token>`.

Endpoint cheat sheet

- `POST /api/v1/auth/register` — register new user
- `POST /api/v1/auth/login` — login (email/password)
- `POST /api/v1/auth/refresh` — refresh using refresh cookie
- `POST /api/v1/auth/logout` — logout
- `GET /api/v1/oidc/.well-known/openid-configuration` — discovery
- `GET /api/v1/oidc/.well-known/jwks.json` — JWKS
- `GET /api/v1/oidc/userinfo` — OIDC UserInfo
- `GET /api/v1/oauth/authorize` — start authorize (frontend redirect)
- `POST /api/v1/oauth/authorize` — consent submission (authenticated)
- `POST /api/v1/oauth/token` — token exchange (authorization_code, refresh_token)
- `GET /api/v1/developer/clients` — list registered apps
- `POST /api/v1/developer/clients` — register application

Common integration patterns

- Single-page app (public client) → PKCE + refresh via HttpOnly cookie (AuthHub sets refresh cookie during social logins).
- Server-side app (confidential client) → client_secret used at `/oauth/token` for refresh grants.
- Machine-to-machine: use API keys (RootApiKey model) or client credentials if implemented (not present by default).

Copy-paste examples

Authorization code exchange (node fetch):

```js
const body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: '<code>',
  redirect_uri: 'https://app.example.com/callback',
  client_id: '<clientId>',
  code_verifier: '<verifier>'
});

const res = await fetch('https://authhub.example.com/api/v1/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: body.toString(),
});
const json = await res.json();
```

Error handling guide

- All OAuth errors follow RFC 6749 patterns with `error` and `error_description` fields. Key server-side errors include `invalid_grant`, `invalid_client`, `invalid_request`, `unsupported_grant_type`.

Token lifecycle guide

- Access tokens expire in 900 seconds (15 minutes).
- Refresh tokens expire in 7 days and are rotated on use.
- ID tokens expire in 1 hour (per `generateIdToken()` implementation).

Client registration guide

- Use `POST /api/v1/developer/clients` to register an application. Confidential clients will receive a `clientSecret` shown once.

Troubleshooting checklist

- `redirect_uri` mismatch: ensure exact match to registered redirect URIs.
- PKCE verification failed: verify `code_verifier` vs `code_challenge` (S256 encoding).
- Invalid refresh token: verify token hasn't expired and the session exists.

Best practices

- Use PKCE for public clients.
- Rotate keys and client secrets regularly.
- Use HttpOnly cookies for refresh tokens in browser-based flows.

Additional runtime features for AI agents

- MFA flows can return `status: "mfa_required"` during login.
- Risk-based authentication can block or step up logins based on score.
- Session management endpoints expose active sessions, session revocation, and logout-other-devices behavior.
- Token introspection is available at `/api/v1/auth/introspect`.
- Token revocation is available at `/api/v1/auth/revoke`.
- Webhook management is tenant-scoped and delivery logs are available.
- Billing is Stripe-backed and entitlement state is derived from the webhook processor.
- Admin APIs require the `ADMIN` role and include impersonation plus root API key lifecycle management.

Integration checklist (machine-readable)

- [ ] Resolve `BASE_URL` and `CLIENT_URL`.
- [ ] Register OAuth client with redirect URIs.
- [ ] Implement PKCE code_challenge generation.
- [ ] Implement token storage and refresh logic.

Sources

- `backend/src/modules/oauth/controller.ts`
- `backend/src/core/crypto.ts`
- `backend/prisma/schema.prisma`

This file is optimized for programmatic consumption. Use it as a quick reference for automated integrations.