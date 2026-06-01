# Frequently Asked Questions (FAQ)

This FAQ contains answers to common questions about AuthHub, OAuth, OIDC, and integration patterns. It contains 50+ questions and concise answers.

1. What is AuthHub?
- AuthHub is an Auth-as-a-Service platform providing OAuth 2.0, OpenID Connect, user management, social login, and session/token handling.

2. Where is the API hosted?
- The API base path is `/api/v1`. The canonical `BASE_URL` is configured via `BASE_URL` env var.

3. How do I register an OAuth application?
- Use `POST /api/v1/developer/clients` with `name` and `redirectUris`.

4. What OAuth grant types does AuthHub support?
- Authorization Code (PKCE) and Refresh Token grants.

5. Does AuthHub support PKCE?
- Yes. Only `S256` is supported and enforced for authorization code flow.

6. How long are access tokens valid?
- Access tokens are valid for 15 minutes (900 seconds) by default.

7. How long are refresh tokens valid?
- Refresh tokens are valid for 7 days and are rotated on use.

8. How are refresh tokens stored?
- Refresh tokens are RS256 JWTs stored hashed (Argon2) in the `sessions` table.

9. Is refresh token rotation implemented?
- Yes. On successful refresh, a new session is created and the old session deleted.

10. What signing algorithm is used for JWTs?
- RS256 (RSA with SHA-256).

11. Where are the public keys published?
- JWKS is available at `/api/v1/oidc/.well-known/jwks.json`.

12. How do I verify tokens?
- Fetch JWKS and verify signature, `kid`, and token claims (iss, aud, exp). You can use libraries like `jose`.

13. What claims are included in access tokens?
- `sub` (user id), `sid` (session id), `roles`, optional `scopes`, and `act` for impersonation.

14. Are ID Tokens supported?
- Yes. ID Tokens are issued when `openid` scope is requested.

15. How do I get the UserInfo claims?
- Call `GET /api/v1/oidc/userinfo` with a valid access token.

16. How are authorization codes stored?
- Authorization codes are randomly generated and stored in Redis under `hub:auth_code:<code>` with a short TTL (~10 minutes).

17. Can I use AuthHub for multi-tenant apps?
- Yes. AuthHub includes a `Tenant` model and supports tenant-scoped clients.

18. How do social logins work?
- AuthHub integrates with Google and GitHub. Call `GET /api/v1/auth/google` or `/github` to start.

19. Will social login create a new tenant automatically?
- If no tenant context is present and auto-tenant behavior is enabled, the server may create a tenant and user during social onboarding.

20. How do I revoke a session?
- `POST /api/v1/auth/logout` revokes the current session. Admin APIs allow deleting sessions by id.

21. How do I rotate client secrets?
- Use `POST /api/v1/developer/clients/{clientId}/rotate` to rotate and return a new secret shown once.

22. What is the `kid` and how is it computed?
- `kid` is the JWK thumbprint per RFC 7638 computed from the public key ensuring deterministic `kid` values.

23. How should I store refresh tokens in a browser?
- Prefer HttpOnly secure cookies set by the server to avoid XSS-based theft.

24. How do I implement PKCE client-side?
- Generate a high-entropy `code_verifier`, compute `code_challenge = base64url(SHA-256(code_verifier))`, and keep `code_verifier` to exchange the code.

25. Can AuthHub handle machine-to-machine auth?
- Root API keys exist in the schema; AuthHub is primarily designed for user-centric OAuth flows. For M2M consider client credentials or API keys.

26. How can I rotate signing keys?
- Publish the new public key in JWKS, update `JWT_PRIVATE_KEY` on servers, and keep old key available until existing tokens expire.

27. What logging and monitoring should I configure?
- Collect structured logs, monitor login rates, failed logins, token exchange failures, and rate limiter metrics. Use the `/health` endpoint.

28. What rate limiting protections exist?
- Rate limiting middleware applies to endpoints like login, register, refresh, introspect, and revoke.

29. Can I run AuthHub locally?
- Yes. Configure `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, and run with Node. See `backend/Dockerfile` for containerized deployment.

30. How are account linking and provider linking handled?
- Social callbacks support `mode=link` to link provider accounts to existing users; the server checks for conflicts before linking.

31. Does AuthHub support passkeys/webauthn?
- There is a `passkey` module and `mfa` module in the repo indicating support for passkeys and TOTP flows.

32. How do I troubleshoot `invalid_grant`?
- Ensure the auth code is not expired/used, `code_verifier` matches the `code_challenge`, and `redirect_uri` matches registered values.

33. Why am I seeing `invalid_client`?
- The provided `client_id` doesn't exist or the `client_secret` for confidential clients is invalid.

34. Where are user consents stored?
- In the `user_consents` table (Prisma model `UserConsent`).

35. What scopes are supported?
- `openid`, `profile`, `email` plus custom entitlement scopes like `plan:pro_plan` created from entitlement records.

36. How do entitlement scopes get into tokens?
- Entitlements are read from the `entitlements` table and added as `plan:<planId>` scopes when issuing tokens.

37. Are tokens revocable?
- Refresh tokens are bound to sessions and deleting the session revokes the ability to refresh. Access tokens are short-lived and not centrally revocable in current design.

38. How do I debug JWKS issues?
- Confirm `kid` in token header matches the JWKS `kid`. Re-fetch JWKS on mismatch.

39. Does AuthHub support logout from all devices?
- The server provides endpoints to delete other sessions (e.g., `DELETE /api/v1/auth/sessions/others`).

40. How is MFA enforced?
- MFA methods are stored in `mfa_methods`; flows issue `mfa_pending` tokens and require additional verification.

41. What data is included in audit logs?
- Events like `LOGIN_SUCCESS`, `LOGIN_FAILED`, `MFA_ENABLED`, stored in `audit_logs` with `details` JSON, IP, device info.

42. Can I customize email sending per tenant?
- Tenants have smtp configuration fields in `Tenant` model for white-label transactional email.

43. Is there RLS (Row Level Security) integration?
- AuthHub supports tenant scoping; RLS is not enforced automatically but can be implemented when integrating with Postgres policies.

44. How are sessions indexed for performance?
- `sessions` table has indexes on `userId`, `expiresAt` and `createdAt` for efficient lookup and cleanup.

45. What happens when Redis is unavailable during authorization?
- Authorization code issuance depends on Redis. If Redis is down, authorization code flow cannot succeed and will return an error.

46. How to migrate from Auth0?
- Export users and re-import, re-register applications, rotate keys, and adjust client code to call AuthHub endpoints. See `docs/migration-guides/from_auth0.md`.

47. How can I add custom claims to tokens?
- Modify token generation logic (`backend/src/core/crypto.ts`) to include additional claims (with careful security review).

48. Does AuthHub provide analytics?
- Developer stats endpoint returns simple usage analytics; for full analytics integrate with external monitoring.

49. Are refresh tokens scoped by client?
- Refresh tokens are tied to a session which was created during an authorization for a specific client; the `sid` binds refresh to that session.

50. How do I revoke a client's access programmatically?
- Delete or rotate client secrets and/or delete user consents and sessions linked to that client.

51. How to prevent CSRF in OAuth flows?
- Use `state` parameter; AuthHub stores `state` with the auth code and validates it on token exchange.

52. What are the default security cookie attributes?
- `refreshToken` cookie is `HttpOnly`, `Secure` in production, and `SameSite` set to `lax` or `strict` depending on the flow; `accessToken` cookie is short-lived and not HttpOnly for handover across domains in social flows.

53. How do I test locally with social providers?
- Configure provider OAuth app redirect URIs to your public tunneling URL (e.g., ngrok) and set callback env vars.

54. How can I disable auto-tenant creation?
- Adjust the social login logic to avoid creating tenants automatically or implement a tenant provisioning policy.

55. What should I monitor in production?
- Token error rates, failed login attempts, rate limiter events, DB/Redis latency, and audit log anomalies.

If you need deeper answers or step-by-step migration scripts, ask and I will generate runnable examples and migration scripts tailored to your data.