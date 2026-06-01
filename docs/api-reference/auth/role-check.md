# GET /api/v1/auth/role-check

Purpose

Compare the roles in the current access token with the roles stored in the database and report whether they drift.

Request schema

- Method: GET
- Authorization: `Bearer <access_token>`

Response schema

- 200 OK

```json
{
  "userId": "user-id",
  "roles": ["ADMIN"],
  "roleDrift": false,
  "checkedAt": "2026-06-01T00:00:00.000Z",
  "userUpdatedAt": "2026-06-01T00:00:00.000Z"
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

- Useful for detecting stale or out-of-sync token role claims.
- It does not mutate roles or refresh the token.

Common mistakes

- Treating this as a role-elevation endpoint. It is read-only diagnostics.

Related endpoints

- `GET /api/v1/auth/me`
- `POST /api/v1/auth/introspect`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)