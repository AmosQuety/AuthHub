# Troubleshooting — Common Errors

redirect_uri_mismatch

- Cause: The `redirect_uri` supplied during token exchange doesn't match the `redirectUris` registered for the client.
- Symptom: `invalid_grant` or `invalid_request` with `Redirect URI mismatch`.
- Fix: Ensure the exact redirect URI (including trailing slash and scheme) is registered for the OAuth client.
- Prevention: Use canonical URLs and register all expected variants.

invalid_client

- Cause: Client ID not found or client_secret invalid for confidential clients.
- Symptom: `invalid_client` error from `/oauth/token`.
- Fix: Verify `client_id` and (for confidential) `client_secret` are correct. For confidential clients the secret is required.

invalid_grant

- Causes:
  - Authorization code expired or already used.
  - PKCE verification failed (wrong `code_verifier`).
  - Refresh token invalid or session revoked.
- Fix:
  - Ensure code exchange happens within 10 minutes and code not reused.
  - Verify code_verifier to code_challenge generation (S256 base64url).
  - Check session existence in `sessions` table.

invalid_scope

- Cause: Client requested scopes not permitted.
- Fix: Request only scopes allowed for the client and registered scopes. Check `oauth_clients.scopes`.

expired_token / invalid_token

- Cause: Access token expired or invalid signature.
- Fix: Use a valid access token; refresh it using refresh token flow.

user_not_found

- Cause: Token references a user that was deleted or session belongs to an account not present.
- Fix: Ensure the user exists; check user deletion/tenant scoping.

session_expired

- Cause: Session `expiresAt` passed or session deleted during refresh.
- Fix: Reauthenticate the user to create a new session.

How to debug

- Use the `/health` endpoint to verify DB and Redis connectivity (`/health`).
- Check logs produced by `backend/src/core/logger.ts`.
- When debugging token verification issues, inspect JWKS and ensure `kid` matches keys used to sign tokens.

Source references

- Authorization controller: [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- Crypto & token helpers: [backend/src/core/crypto.ts](backend/src/core/crypto.ts)