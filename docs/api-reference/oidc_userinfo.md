# GET /api/v1/oidc/userinfo

Purpose

Return identity claims for the authenticated user (OIDC UserInfo endpoint).

Request

- Method: GET
- URL: `/api/v1/oidc/userinfo`
- Authorization: `Authorization: Bearer <access_token>`

Response example

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "email_verified": true
}
```

Errors

- 401 Unauthorized — missing or invalid token
- 404 Not Found — user not found (rare if token references deleted user)

Implementation notes

- The endpoint obtains `userId` via `req.user.sub` after `authenticate` middleware (which verifies the access token via `core.verifyToken`).
- It returns minimal claims: `sub`, `email`, and `email_verified`.

Security

- Access tokens must be validated (signature, expiry) prior to returning userinfo.

Source

- `backend/src/modules/oidc/controller.ts`