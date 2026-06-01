# DELETE /api/v1/auth/providers/:id

Purpose

Unlink a social authentication provider from the authenticated user's account.

Request schema

- Method: DELETE
- Authorization: `Bearer <access_token>`
- Path parameter: `id` = provider link id

Response schema

- 200 OK

```json
{ "message": "Provider unlinked successfully." }
```

Error examples

- 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

- 404 Not Found

```json
{ "error": "Provider link not found" }
```

- 400 Bad Request safety valve

```json
{
  "error": "safety_valve_triggered",
  "message": "You cannot unlink your last authentication method. Please set a password or link another account first."
}
```

Security notes

- The runtime prevents users from removing their last authentication method.
- The profile cache is cleared after unlinking.
- Audit logs record the provider unlink event.

Common mistakes

- Attempting to unlink a provider that is not attached to the current user.
- Removing the last remaining auth method without first setting another login path.

Related endpoints

- `POST /api/v1/auth/update-password`
- `POST /api/v1/auth/verify-password`
- Social login callback routes

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)