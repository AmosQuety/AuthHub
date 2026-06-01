# DELETE /api/v1/auth/sessions/others

Purpose

Revoke every other session for the authenticated user except the current one.

Request schema

- Method: DELETE
- Authorization: `Bearer <access_token>`

Response schema

- 200 OK

```json
{ "message": "Successfully revoked 3 other sessions." }
```

Error examples

- 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

- 400 Bad Request when the current token does not carry a session id (legacy session format)

```json
{
  "error": "legacy_session",
  "message": "Your current session is using an older security format. Please log out and back in once to enable this feature."
}
```

Security notes

- This endpoint is ideal for “log out other devices” UX.
- It requires `sid` in the current access token.

Common mistakes

- Invoking it from older tokens that lack `sid`.

Related endpoints

- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:id`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)