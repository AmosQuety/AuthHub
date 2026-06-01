# API Reference — OIDC

GET /api/v1/oidc/.well-known/openid-configuration

- Purpose: OIDC Discovery document. Returns `issuer`, `authorization_endpoint`, `token_endpoint`, `userinfo_endpoint`, `jwks_uri`, supported scopes/claims.
- Implementation: `backend/src/modules/oidc/controller.ts`.

GET /api/v1/oidc/.well-known/jwks.json

- Purpose: Return the JWKS containing the public keys for verifying RS256 JWTs.
- Response: `{ keys: [ { kty, n, e, alg: 'RS256', use: 'sig', kid } ] }`.
- Note: `kid` is derived from the JWK thumbprint (RFC 7638) in `core/crypto.ts`.

GET /api/v1/oidc/userinfo

- Purpose: Return identity claims for the authenticated user.
- Authorization: `Authorization: Bearer <access_token>`
- Response: `{ sub, email, email_verified }`.

Security considerations

- Ensure `BASE_URL` is set correctly so the `issuer` in discovery matches token `iss` claims.

Related endpoints

- `/api/v1/oauth/token` — issues `id_token` as part of the token response when `openid` scope is requested.