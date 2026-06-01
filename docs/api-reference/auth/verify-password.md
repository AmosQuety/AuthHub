# POST /api/v1/auth/verify-password

Purpose

Verify the authenticated user's password for step-up or sensitive-action confirmation.

Request schema

- Method: POST
- Authorization: `Bearer <access_token>`
- Content-Type: `application/json`
- Body:

```json
{
  "password": "CurrentPassword123"
}
```

Response schema

- 200 OK

```json
{ "success": true }
```

Error examples

- 400 Bad Request

```json
{ "error": "Password is required" }
```

- 400 Bad Request

```json
{ "error": "No password set for this account." }
```

- 401 Unauthorized

```json
{ "error": "Incorrect password." }
```

Security notes

- Use this endpoint for step-up flows before changing sensitive settings.
- It does not create a new session or issue a new token.

Common mistakes

- Using it as a login endpoint; it only verifies the current account's password.
- Calling it on a provider-only account with no local password set.

Related endpoints

- `PUT /api/v1/auth/update-password`
- `POST /api/v1/auth/complete-profile`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)