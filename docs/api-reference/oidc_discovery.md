# GET /api/v1/oidc/.well-known/openid-configuration

Purpose

Return the OpenID Connect Discovery Document describing AuthHub's OIDC endpoints and capabilities.

Response example

```json
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/api/v1/oauth/authorize",
  "token_endpoint": "https://auth.example.com/api/v1/oauth/token",
  "userinfo_endpoint": "https://auth.example.com/api/v1/oidc/userinfo",
  "jwks_uri": "https://auth.example.com/api/v1/oidc/.well-known/jwks.json",
  "response_types_supported": ["code", "token", "id_token"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256"],
  "scopes_supported": ["openid", "profile", "email"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic"],
  "claims_supported": ["sub", "iss", "email", "email_verified"]
}
```

Notes

- Ensure `BASE_URL` is configured so `issuer` matches token `iss` claim.
- Implementation: `backend/src/modules/oidc/controller.ts`.

Cache headers

- The endpoint sets cache headers (`Cache-Control`) to allow caching by proxies for performance.

Security

- Clients should validate `issuer` and `jwks_uri` when verifying tokens.