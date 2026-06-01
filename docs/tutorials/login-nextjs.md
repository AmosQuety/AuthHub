# Tutorial — Login with Next.js

This tutorial demonstrates a Next.js app that performs server-side code exchange with AuthHub.

1. Start PKCE flow on client: generate `code_verifier` and `code_challenge` and set `code_verifier` to a secure cookie.
2. Redirect to AuthHub authorize endpoint.
3. AuthHub redirects back to your Next.js callback route which exchanges code server-side using `POST /api/v1/oauth/token`.
4. Set `refreshToken` as HttpOnly cookie and store `access_token` in session or memory.

See `docs/sdk-guides/nextjs.md` for sample code.