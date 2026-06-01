# GET /api/v1/auth/verify-email/:token

Purpose

Consume an email verification token and mark the user's email as verified.

Request schema

- Method: GET
- Path parameter: `token`
- No authorization header required

Response schema

- 200 OK

```json
{ "message": "Email verified successfully." }
```

Error examples

- 400 Bad Request

```json
{ "error": "Invalid or expired verification token" }
```

- 400 Bad Request

```json
{ "error": "Token is required" }
```

Security notes

- The token is single-use and removed from Redis after successful verification.
- The profile cache is invalidated after verification.
- Audit logs record the email verification event.

Common mistakes

- Reusing the verification link after the first successful click.
- Confusing this endpoint with the send endpoint.

Related endpoints

- `POST /api/v1/auth/verify-email/send`
- `GET /api/v1/auth/me`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)