# API Reference — Authentication

This document describes the Authentication endpoints used by applications and users.

POST /api/v1/auth/register

- Purpose: Register a new user (email + password).
- Request JSON: { email, password }
- Responses:
  - 201: User created; verification email sent (if configured).
  - 409: Email already registered.
- Implementation: `backend/src/docs/openapi.ts` and controller in `backend/src/modules/auth/controller.ts`.

POST /api/v1/auth/login

- Purpose: Authenticate user with email/password and issue tokens.
- Request JSON: { email, password }
- Responses:
  - 200: { access_token, refresh_token, expires_in, id_token }
  - 401: Invalid credentials
- Notes: Access token is RS256-signed JWT (15m). Refresh token is RS256 JWT (7d) and stored hashed in `sessions`.

POST /api/v1/auth/refresh

- Purpose: Rotate access token using refresh cookie (browser flows).
- Behavior: Reads refresh cookie, validates, rotates session, responds with new tokens.
- Responses: 200 or 401 for invalid/expired refresh.

POST /api/v1/auth/logout

- Purpose: Revoke the current session and clear cookies.
- Behavior: Deletes session and returns 200 on success.

Social login callbacks

- `GET /api/v1/auth/google` and `/api/v1/auth/github` redirect to provider authorization.
- `GET /api/v1/auth/google/callback` and `/api/v1/auth/github/callback` are provider callbacks that upsert users, create sessions, set cookies, and redirect to the frontend. See `backend/src/modules/auth/social.ts` for full flow and cookie details.

Security considerations

- Rate limiting applies to login and register endpoints (see `backend/src/middlewares/rateLimiter.ts`).
- Passwords are hashed using Argon2 (`backend/src/core/crypto.ts`).

Related endpoints

- `/api/v1/oauth/authorize` — starts OAuth authorization (frontend redirect behavior).
- `/api/v1/developer/clients` — register developer applications.