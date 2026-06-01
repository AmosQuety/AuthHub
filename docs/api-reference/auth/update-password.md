# PUT /api/v1/auth/update-password

Purpose

Update the authenticated user's password.

Request schema

- Method: PUT
- Authorization: `Bearer <access_token>`
- Content-Type: `application/json`
- Body:

```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewS3cureP@ssw0rd"
}
```

Response schema

- 200 OK

```json
{ "message": "Password updated successfully." }
```

Error examples

- 400 Bad Request

```json
{ "error": "New password must be at least 8 characters" }
```

- 400 Bad Request

```json
{ "error": "Current password is required to set a new one." }
```

- 401 Unauthorized

```json
{ "error": "Current password is incorrect." }
```

Security notes

- If the user already has a password, the current password is required.
- Updating the password revokes all other sessions except the current one.
- The new password is hashed with Argon2.

Common mistakes

- Omitting `currentPassword` when changing an existing password.
- Expecting other sessions to remain active after the change.

Related endpoints

- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-password`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)