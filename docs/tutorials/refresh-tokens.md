# Tutorial — Refresh Tokens

This tutorial describes how to implement refresh token rotation and safe handling.

Client-side (browser using cookies)

- AuthHub sets a secure HttpOnly `refreshToken` cookie after login.
- When the SPA needs a fresh access token, call your backend endpoint that invokes `POST /api/v1/auth/refresh` or `POST /api/v1/oauth/token` with `grant_type=refresh_token`.

Server-side flow (confidential client)

1. Receive refresh token from client cookie or storage.
2. Call `POST /api/v1/oauth/token` with `grant_type=refresh_token`, including `client_id` and `client_secret` for confidential clients.
3. On success, replace the stored refresh token (rotate), update session data, and return new access token to client.

Security notes

- Rotate refresh tokens on every use to limit replay.
- Delete old session records to prevent reuse.
- Use short access token lifetimes and validate session existence on refresh.