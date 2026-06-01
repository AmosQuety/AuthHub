# Tutorial — Token Revocation

This tutorial shows how to revoke a refresh token or invalidate the current session.

Use cases

- Revoke a suspicious session.
- Log a user out from a device.
- Invalidate a stolen refresh token.

Examples

```js
await fetch('/api/v1/auth/revoke', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: refreshToken }),
});
```

Or log out the current session:

```js
await fetch('/api/v1/auth/logout', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

Related docs

- [Token Introspection](token-introspection.md)
- [Auth API Reference](../api-reference/auth/index.md)
