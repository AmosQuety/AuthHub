# API Reference — OAuth

GET /api/v1/oauth/authorize

- Purpose: Start the OAuth 2.0 authorization flow (PKCE).
- Parameters (query): `client_id` (required), `redirect_uri` (required), `response_type=code` (required), `code_challenge`, `code_challenge_method=S256`, `scope`, `state`.
- Behavior: Redirects to the frontend authorize UI or returns a redirect URL depending on usage. The backend `authorizeRedirect()` will forward query params to the configured frontend authorize page.
- Implementation: `backend/src/modules/oauth/controller.ts`

POST /api/v1/oauth/authorize

- Purpose: Consent submission (authenticated user). Server validates client, redirect_uri, PKCE parameters and stores authorization code in Redis.
- Request body: `client_id`, `response_type`, `redirect_uri`, `scope`, `code_challenge`, `code_challenge_method`, `nonce`, `state`.
- Response: JSON containing `redirectUrl` where the frontend should redirect the browser. The authorization code is returned as query param on the `redirect_uri`.

POST /api/v1/oauth/token

- Purpose: Exchange authorization code for tokens, or refresh tokens.
- Content-Type: `application/x-www-form-urlencoded`
- Grant types supported: `authorization_code`, `refresh_token`.

Authorization Code exchange required fields:
- `grant_type=authorization_code`
- `code` (from authorization)
- `code_verifier` (PKCE verifier)
- `client_id` (and `client_secret` for confidential clients)
- `redirect_uri` (must match stored value)

On success (authorization_code):
- `access_token` (RS256 JWT)
- `token_type: Bearer`
- `expires_in: 900`
- `refresh_token` (RS256 JWT)
- `id_token` (if OIDC scopes requested)

On success (refresh_token):
- `access_token`
- `refresh_token` (rotated)

Errors:
- `invalid_grant` — expired/invalid code or refresh token
- `invalid_client` — client authentication failed
- `invalid_request` — missing or invalid parameters

Security notes

- PKCE verification occurs server-side using `verifyPkceChallenge`.
- Authorization codes are stored in Redis for 10 minutes and are single-use.

Related endpoints

- `/api/v1/oauth/consent-check` — check if user previously granted scopes to a client.