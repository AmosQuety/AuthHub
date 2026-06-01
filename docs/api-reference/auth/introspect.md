# POST /api/v1/auth/introspect

Purpose

Check whether a token is active and return a small subset of claims.

Request schema

- Method: POST
- Content-Type: `application/json`
- Body:

```json
{
  "token": "<jwt>"
}
```

Response schema

- 200 OK

Active token:

```json
{
  "active": true,
  "sub": "user-id",
  "exp": 1234567890,
  "iat": 1234567000,
  "scopes": [],
  "client_id": "client-id",
  "roles": ["USER"]
}
```

Inactive token:

```json
{
  "active": false
}
```

Error examples

- 400 Bad Request

```json
{ "error": "token is required" }
```

Security notes

- The endpoint does not expose full token contents.
- Invalid, expired, or incorrectly signed tokens are reported as `active: false`.

Common mistakes

- Using this as a replacement for signature verification in a protected resource server. Local JWT verification via JWKS is still preferred for resource servers.
- Expecting full user profile data; this endpoint only exposes limited claims.

Related endpoints

- `POST /api/v1/auth/revoke`
- `GET /api/v1/oidc/.well-known/jwks.json`
- `GET /api/v1/oidc/userinfo`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)