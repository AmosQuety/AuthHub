# POST /api/v1/auth/refresh

Purpose

Rotate the access token using the refresh token stored in the HttpOnly cookie (browser-oriented flow).

Description

This endpoint reads the `refreshToken` cookie (set by AuthHub during social login or previous interactions), validates it, performs refresh-token rotation by creating a new `Session` and deleting the old one, and returns a new short-lived access token (and sometimes a new refresh cookie depending on flow).

Request

- Method: POST
- URL: `/api/v1/auth/refresh`
- Authorization: Cookie-based (HttpOnly `refreshToken` cookie)
- No body required

Responses

- 200 OK
  - Body example:

```json
{
  "access_token": "<RS256 JWT>",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "<new_refresh_token>" // sometimes returned for programmatic clients
}
```

- 401 Unauthorized
  - Cause: Missing or invalid refresh token cookie, session revoked, or token expired.

Implementation notes

- For server-side token-refresh (`/oauth/token` with `grant_type=refresh_token`), the logic is implemented in `backend/src/modules/oauth/controller.ts`.
- `auth/refresh` is optimized for browser cookie flows — it may not require client credentials.
- The refresh lifecycle verifies the refresh token signature, confirms `sid` matches a session, compares the hashed refresh token in DB (Argon2 verify), then creates a new session and deletes the old one.

Security

- Ensure cookies are `HttpOnly` and `Secure` in production.
- Refresh tokens are single-use and rotated on every refresh to prevent replay attacks.

Related endpoints

- `POST /api/v1/oauth/token` (grant_type=refresh_token) — programmatic refresh for confidential clients.