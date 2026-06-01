# POST /api/v1/auth/forgot-password

Purpose

Start a password reset flow by sending a reset link to the user's email.

Request schema

- Method: POST
- Content-Type: `application/json`
- Body:

```json
{
  "email": "user@example.com",
  "client_id": "optional-client-id"
}
```

Response schema

- 200 OK

```json
{ "message": "If that email exists, a reset link has been sent." }
```

Error examples

- 400 Bad Request

```json
{ "error": "email is required" }
```

Security notes

- The endpoint intentionally avoids user enumeration by always returning the same message for unknown emails.
- When `client_id` is provided, tenant scoping is applied.
- Reset tokens are stored in Redis with a 1 hour TTL.

Common mistakes

- Expecting an error when the email does not exist.
- Forgetting to configure the frontend password-reset route.

Related endpoints

- `POST /api/v1/auth/reset-password`
- `PUT /api/v1/auth/update-password`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)