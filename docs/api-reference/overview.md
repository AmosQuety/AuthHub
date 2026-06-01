# API Reference — Overview

AuthHub exposes a REST API under `/api/v1`.

Primary areas:

- Authentication: `/api/v1/auth/*` — register, login, refresh, logout, social callbacks.
- OAuth: `/api/v1/oauth/*` — authorize, token, consent-check.
- OIDC: `/api/v1/oidc/*` — discovery, JWKS, userinfo.
- Developer: `/api/v1/developer/*` — manage OAuth clients and stats.

The in-repo OpenAPI specification is available at [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts) and served at `/api/v1/docs/openapi.json`.