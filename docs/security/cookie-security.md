# Cookie Security

AuthHub uses cookies in browser-oriented flows.

Important runtime details

- Refresh tokens are set as `HttpOnly` cookies.
- Production cookies are marked `Secure`.
- Social login flows set a short-lived `accessToken` cookie for frontend handoff.
- `SameSite` varies by flow and should be documented precisely in each integration.

Best practices

- Never store refresh tokens in localStorage.
- Clear cookies on logout.
- Use HTTPS in production.

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)
- [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts)
