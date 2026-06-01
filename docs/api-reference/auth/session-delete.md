# DELETE /api/v1/auth/sessions/:id

Purpose

Revoke a specific session belonging to the authenticated user.

Request schema

- Method: DELETE
- Authorization: `Bearer <access_token>`
- Path parameter: `id` = session id

Response schema

- 204 No Content when a non-current session is deleted.
- 205 Reset Content when the current session is deleted and the client should re-authenticate.

Error examples

- 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

- 403 Forbidden

```json
{ "error": "Forbidden" }
```

- 404 Not Found

```json
{ "error": "Session not found" }
```

Success examples

- 204 with empty body
- 205 with body:

```json
{ "message": "Current session revoked. Please re-authenticate." }
```

Security notes

- Only sessions owned by the current user can be revoked.
- Deleting the current session invalidates the current login immediately.

Related endpoints

- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/others`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)