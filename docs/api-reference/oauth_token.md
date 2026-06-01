# POST /api/v1/oauth/token

Purpose

Token endpoint for exchanging authorization codes and for refresh token grants.

Supported grants

- `authorization_code` — exchange auth code for tokens (requires `code_verifier` for PKCE)
- `refresh_token` — rotate refresh tokens to obtain a new access token

Request (authorization_code)

- Method: POST
- URL: `/api/v1/oauth/token`
- Content-Type: `application/x-www-form-urlencoded`
- Required fields:
  - `grant_type=authorization_code`
  - `code`
  - `code_verifier`
  - `client_id`
  - `redirect_uri` (if provided during authorize)
  - `client_secret` (for confidential clients)

Example body:

```
grant_type=authorization_code&code=...&code_verifier=...&client_id=...&redirect_uri=https://app.example.com/callback
```

Success response (200):

```json
{
  "access_token": "<RS256 JWT>",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "<RS256 JWT>",
  "id_token": "<ID token if openid scope requested>"
}
```

Request (refresh_token)

- Required fields:
  - `grant_type=refresh_token`
  - `refresh_token`
  - `client_id`
  - `client_secret` (for confidential clients)

Success response (refresh):

```json
{
  "access_token": "<new RS256 JWT>",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "<rotated_refresh_token>"
}
```

Errors

- `invalid_grant` — expired/invalid auth code or refresh token, PKCE failure, redirect_uri mismatch, state mismatch.
- `invalid_client` — client authentication failed.
- `unsupported_grant_type` — grant not supported.
- `invalid_request` — missing parameters.

Security notes

- The endpoint validates client confidentiality: confidential clients must present `client_secret` which is verified via Argon2 hashing comparison to stored `clientSecretHash`.
- PKCE verification uses `verifyPkceChallenge()` implemented in `backend/src/core/crypto.ts`.
- Authorization codes are single-use and removed from Redis after successful exchange.

Implementation reference

- `backend/src/modules/oauth/controller.ts`