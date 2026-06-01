# POST /api/v1/auth/register

Purpose

Register a new user (email + password) for a tenant or the global system.

Description

Creates a new `User` record and (optionally) triggers email verification. Passwords are hashed using Argon2 with an optional server-side pepper. The endpoint is rate-limited to mitigate account-creation abuse.

Request

- Method: POST
- URL: `/api/v1/auth/register`
- Content-Type: `application/json`
- Body schema:

```json
{
  "email": "user@example.com",
  "password": "S3cureP@ssw0rd",
  "name": "Optional Full Name"
}
```

Responses

- 201 Created
  - Description: User created. If email verification is configured, a verification email is sent.
  - Body: `{ "message": "User created" }` (implementation may vary)

- 400 Bad Request
  - Cause: Missing required fields or validation error.
  - Example: `{ "error": "password must be at least 8 characters" }`

- 409 Conflict
  - Cause: Email already registered for the tenant or globally.
  - Example: `{ "error": "Email already registered" }`

Implementation notes

- Source: [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts) and registration logic in `backend/src/modules/auth/controller.ts`.
- Password hashing: `backend/src/core/crypto.ts` using Argon2 and `ARGON2_PEPPER`.
- Post-create actions: send verification email (if tenant smtp configured), create initial audit log, optional tenant auto-provisioning in social flows.

Common mistakes

- Using a weak password shorter than configured minimum (8 characters by default).
- Attempting to register an email that already exists in the tenant scope.

Security

- Enforce rate limiting on this endpoint (server includes `registerLimiter`).
- Validate email format and restrict disposable domains if needed at the application layer.

Related endpoints

- `POST /api/v1/auth/login` — authenticate existing users.
- `GET /api/v1/auth/verify-email/:token` — consume verification link (if used).