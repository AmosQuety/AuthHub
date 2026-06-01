# POST /api/v1/auth/revoke

Purpose

Revoke a refresh token by deleting the associated session when the token is valid.

Request schema

- Method: POST
- Content-Type: `application/json`
- Body:

```json
{
  "token": "<refresh_token>"
}
```

Response schema

- 200 OK

```json
{}
```

Success example

Request:

```json
{ "token": "eyJhbGciOi..." }
```

Response:

```json
{}
```

Error examples

- 400 Bad Request

```json
{ "error": "token is required" }
```

- 401 is not returned directly by this endpoint for invalid tokens; invalid tokens are silently ignored and the endpoint still returns 200.

Security notes

- The endpoint verifies the JWT and only deletes sessions for tokens whose payload includes `sid` and `type: "refresh"`.
- Invalid tokens are intentionally treated as no-op to avoid leaking token validity.
- Audit logs are written for successful revocations.

Common mistakes

- Sending an access token instead of a refresh token.
- Expecting a 4xx for malformed tokens; runtime returns 200 for invalid/unknown tokens after validation failure handling.

Related endpoints

- `POST /api/v1/auth/introspect`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)