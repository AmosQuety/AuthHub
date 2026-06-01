# Social Login Endpoints

AuthHub supports Google and GitHub social login integrations.

Endpoints

- `GET /api/v1/auth/google` — Redirects to Google OAuth consent screen.
- `GET /api/v1/auth/google/callback` — Google OAuth callback handler.
- `GET /api/v1/auth/github` — Redirects to GitHub OAuth consent screen.
- `GET /api/v1/auth/github/callback` — GitHub OAuth callback handler.

Behavior

- Social login redirects include a base64url-encoded `state` that can contain `client_id`, `mode`, and `user_id` to indicate intent (e.g., `link`, `login`).
- Callback handlers exchange the provider code for an access token, fetch the profile, and upsert the `User` and `AuthProvider` records. They create a `Session`, set `refreshToken` (HttpOnly) and `accessToken` (short-lived) cookies, and redirect to the frontend.

Request (example redirect)

`GET /api/v1/auth/google?client_id=CLIENT&mode=login`

Responses

- Redirect (302) to provider login page for initial redirect.
- On callback, the server redirects to FRONTEND URL with `access_token` in query for handover or to profile completion flows.

Implementation notes

- Google flow uses `GOOGLE_CLIENT_ID/SECRET` and callback URL configured via `GOOGLE_CALLBACK_URL`.
- GitHub flow uses `GITHUB_CLIENT_ID/SECRET` and callback URL configured via `GITHUB_CALLBACK_URL`.
- Auto-tenant behavior: when social login produces an email not previously known, the server may auto-provision a tenant and user when no `client_id` tenant scope is present.

Security

- Validate `state` and implement `mode` semantics carefully to avoid account hijacking.
- When linking providers (`mode=link`), ensure the linking user is authenticated and verify existing provider ownership to prevent accidental account overriding.

Source

- `backend/src/modules/auth/social.ts`