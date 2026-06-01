# POST /api/v1/auth/verify-email/send

Purpose

Send a verification email to the authenticated user.

Request schema

- Method: POST
- Authorization: `Bearer <access_token>`
- No body required

Response schema

- 200 OK

```json
{ "message": "Verification email sent. Please check your inbox." }
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

- 400 Bad Request

```json
{ "error": "Email is already verified" }
```

Security notes

- The endpoint generates a one-time token stored in Redis for 24 hours.
- The verification URL is built from `FRONTEND_URL` and sent through the configured mailer.
- The route is rate-limited.

Common mistakes

- Calling it for an already-verified account.
- Not configuring mail delivery or frontend verification route.

Related endpoints

- `GET /api/v1/auth/verify-email/:token`
- `GET /api/v1/auth/me`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)