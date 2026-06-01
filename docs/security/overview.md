# Security Documentation

This section explains security concepts and how they are implemented in AuthHub.

Password storage

- AuthHub uses Argon2 for password hashing, with an optional `ARGON2_PEPPER` prepended to plaintext before hashing (`backend/src/core/crypto.ts`).

JWT and JWKS

- JWTs are signed with RS256 using `JWT_PRIVATE_KEY` and verified with `JWT_PUBLIC_KEY`.
- Public keys are served via JWKS: `GET /api/v1/oidc/.well-known/jwks.json`.
- The `kid` is the JWK thumbprint ensuring deterministic key IDs.

PKCE enforcement

- Authorization Code flow requires `code_challenge` and uses S256 verification implemented in `core/crypto.ts`.

Refresh token rotation

- Refresh tokens are RS256 JWTs containing `sid` and `sub` and `type: 'refresh'`.
- Tokens are hashed and stored in `sessions`. On refresh, the server validates the presented refresh token against the stored hash and rotates by creating a new `Session` and deleting the old one.

CSRF protection for auth code exchange

- `state` provided by clients is stored with the auth code and validated on token exchange to mitigate CSRF.

Cookie security

- Social login flows set:
  - `refreshToken` cookie: `HttpOnly`, `Secure` in production, `SameSite=Strict` or `Lax` depending on flow.
  - `accessToken` cookie: short-lived, non-HttpOnly for handover (note security tradeoff).

Key rotation guidance

- Publish new public keys in JWKS and keep previous keys available until previous tokens expire.
- Update `JWT_PRIVATE_KEY` on the server and ensure `JWT_PUBLIC_KEY` is included in JWKS before JWTs signed with the new key are accepted.

Threat model & mitigations

- Theft of access tokens: access tokens are short-lived (15m) to limit exposure.
- Theft of refresh tokens: refresh tokens are bound to server-side sessions and are rotated and stored hashed.
- Authorization code interception: PKCE + short TTL + single-use codes stored in Redis.
- Brute-force attacks: rate limiting applied to sensitive endpoints such as `/auth/login` and `/auth/register`.

Implementation references

- JWT generation/verification: [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
- Authorization code lifecycle: [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- Social login cookie behavior: [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts)