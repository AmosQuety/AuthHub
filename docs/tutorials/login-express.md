# Tutorial — Login with Express

This tutorial demonstrates an Express server that exchanges authorization codes and manages refresh tokens.

1. Initiate PKCE and redirect the user to AuthHub's `/oauth/authorize`.
2. Implement a callback route that receives `code` and exchanges it server-side at `POST /api/v1/oauth/token`.
3. Store `refresh_token` as an HttpOnly secure cookie and use it for subsequent refreshes via server-side calls.

See `docs/sdk-guides/express.md` for full code samples.