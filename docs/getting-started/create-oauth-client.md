# Create an OAuth Client

Use the Developer Portal or the API to register your application.

Create client example

```json
{
  "name": "My App",
  "redirectUris": ["https://app.example.com/callback"],
  "isConfidential": false
}
```

Rules

- Redirect URIs must match exactly at token exchange time.
- Public clients should use PKCE.
- Confidential clients receive a `clientSecret` shown only once.

Security implications

- Treat the client secret like a password.
- Rotate secrets periodically using `POST /api/v1/developer/clients/:id/rotate`.

Related pages

- [PKCE](pkce.md)
- [Login and Tokens](login-and-tokens.md)
- [Developer Portal API Reference](../api-reference/developer.md)
