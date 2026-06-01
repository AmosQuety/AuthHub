# POST /api/v1/auth/reset-password

Purpose

Complete a password reset using the one-time reset token sent by email.

Request schema

- Method: POST
- Content-Type: `application/json`
- Body:

```json
{
  "token": "<reset-token>",
  "password": "NewS3cureP@ssw0rd"
}
```

Response schema

- 200 OK

```json
{ "message": "Password reset successfully. Please log in with your new password." }
```

Error examples

- 400 Bad Request

```json
{ "error": "token and password are required" }
```

- 400 Bad Request

```json
{ "error": "Password must be at least 8 characters" }
```

- 400 Bad Request

```json
{ "error": "Invalid or expired reset token" }
```

Security notes

- The reset token is single-use and cleared from Redis after successful password reset.
- All sessions for the user are deleted after a successful reset.
- Audit logs record the password reset event.

Common mistakes

- Reusing the same reset token twice.
- Using a password shorter than the minimum length.

Related endpoints

- `POST /api/v1/auth/forgot-password`
- `PUT /api/v1/auth/update-password`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)