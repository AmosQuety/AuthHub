# POST /api/v1/auth/login

Purpose

Authenticate a user using email and password and issue tokens (access + refresh). Intended for first-party clients and server-side callers.

Description

Validates credentials and, on success, issues an access token (RS256 JWT, 15 minutes) and a refresh token (RS256 JWT, 7 days). The refresh token is persisted as a hash in the `sessions` table.

Request

- Method: POST
- URL: `/api/v1/auth/login`
- Content-Type: `application/json`
- Body:

```json
{
  "email": "user@example.com",
  "password": "S3cureP@ssw0rd"
}
```

Responses

- 200 OK
  - Body example (JSON):

```json
{
  "access_token": "<RS256 JWT>",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "<RS256 JWT>",
  "id_token": "<ID Token>"
}
```

- 401 Unauthorized
  - Cause: Invalid credentials
  - Example: `{ "error": "Invalid credentials" }`

- 429 Too Many Requests
  - Cause: Rate limiting triggered for login attempts

Implementation notes

- Password verification uses Argon2 via `backend/src/core/crypto.ts`.
- On success: create a `Session` record with hashed refresh token, device info, IP address, and `expiresAt` for session expiration.
- Refresh token rotation occurs via the refresh flow; tokens are single-use for session rotation.

Security considerations

- Clients should store `refresh_token` in secure storage (server side or HttpOnly cookie for browser flows).
- Use multi-factor authentication (MFA) if tenant policy demands (MFA hooks invoked during social login and local login flows).

Related endpoints

- `POST /api/v1/auth/refresh` — rotate using refresh cookie (browser flows).
- `POST /api/v1/oauth/token` with `grant_type=refresh_token` — machine/token-based refresh.
- `POST /api/v1/auth/logout` — revoke session and clear cookies.