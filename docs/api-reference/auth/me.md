# GET /api/v1/auth/me

Purpose

Return the authenticated user's profile, derived flags, provider list, and current session id.

Request schema

- Method: GET
- Authorization: `Bearer <access_token>`

Response schema

- 200 OK

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "emailVerified": true,
    "roles": ["USER"],
    "createdAt": "2026-06-01T00:00:00.000Z",
    "hasPassword": true,
    "mfaEnabled": false,
    "clientCount": 2,
    "providers": [
      { "id": "provider-link-id", "name": "google" }
    ],
    "sid": "session-id"
  }
}
```

Error examples

- 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

- 404 Not Found

```json
{ "error": "User not found" }
```

Security notes

- This endpoint is protected by the access-token verification middleware.
- Cached profile data is read from Redis when available; the cache is invalidated on profile/email verification changes.

Common mistakes

- Forgetting to include the `Authorization` header.
- Assuming the response is the raw Prisma `User` object; it is a computed API view.

Related endpoints

- `PATCH /api/v1/auth/profile`
- `POST /api/v1/auth/complete-profile`
- `GET /api/v1/auth/sessions`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)