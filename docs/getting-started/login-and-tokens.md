# Login and Tokens

After your user authenticates, AuthHub returns tokens that are used across browser apps, servers, and mobile apps.

Typical flow

1. Redirect to the authorization endpoint.
2. The user authenticates and consents.
3. Exchange the code at `/api/v1/oauth/token`.
4. Use the access token to call protected APIs.
5. Refresh the session when needed.

Token types

- Access token: short-lived JWT used by APIs.
- Refresh token: long-lived JWT used to rotate the session.
- ID token: OIDC identity token returned when `openid` is requested.

Example token exchange

```bash
curl -X POST https://authhub.example.com/api/v1/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'grant_type=authorization_code&code=CODE&client_id=CLIENT_ID&code_verifier=VERIFIER&redirect_uri=https://app.example.com/callback'
```

Next steps

- Call `GET /api/v1/oidc/userinfo` with the access token.
- Refresh with `grant_type=refresh_token`.
- Revoke sessions with `POST /api/v1/auth/logout` or session endpoints.

Related pages

- [PKCE](pkce.md)
- [Tutorials](../tutorials/index.md)
- [API Reference](../api-reference/index.md)
