# GET /api/v1/oauth/authorize (and POST consent)

Purpose

Start the OAuth 2.0 authorization code flow (PKCE). AuthHub's backend redirects to the configured frontend authorization UI which collects consent. The frontend then posts consent back to the backend to generate the authorization code.

GET behavior (redirect to frontend)

- Method: GET
- URL: `/api/v1/oauth/authorize`
- Query parameters:
  - `client_id` (required)
  - `redirect_uri` (required)
  - `response_type`=code (required)
  - `code_challenge` (recommended for public clients)
  - `code_challenge_method`=S256
  - `scope` (optional)
  - `state` (optional)

The backend handler `authorizeRedirect()` constructs a frontend URL (based on `CLIENT_URL`/`FRONTEND_URL`) and forwards query parameters.

POST behavior (consent submission)

- Method: POST
- URL: `/api/v1/oauth/authorize`
- Authorization: User must be authenticated (session or access token)
- Body (example):

```json
{
  "client_id": "abc123",
  "response_type": "code",
  "redirect_uri": "https://app.example.com/callback",
  "scope": "openid email profile",
  "code_challenge": "...",
  "code_challenge_method": "S256",
  "nonce": "...",
  "state": "..."
}
```

On success:

- An authorization code is generated (random hex), stored in Redis under `hub:auth_code:<code>` with TTL (10 minutes), and a redirect URL is returned to the frontend which includes `code` and `state` as query params.

Errors

- 400 invalid_request — missing required fields or invalid `code_challenge_method`.
- 401 Unauthorized — user not authenticated.
- 400 invalid_client — unknown client
- 400 invalid_request — redirect_uri mismatch

Security notes

- Auth code contains bound metadata including `codeChallenge`, `nonce`, `clientId`, and `state`.
- Codes are single-use and removed from Redis after successful token exchange.

Implementation references

- `backend/src/modules/oauth/controller.ts`