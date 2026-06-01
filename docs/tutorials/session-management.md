# Tutorial — Session Management

This tutorial shows how to present active sessions and revoke them.

Flow

1. Call `GET /api/v1/auth/sessions` to list current devices.
2. Render browser, OS, IP address, and expiry.
3. Let the user revoke a session with `DELETE /api/v1/auth/sessions/:id`.
4. Refresh the session list after each action.

Example

```js
const res = await fetch('/api/v1/auth/sessions', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const data = await res.json();
```

Related docs

- [Logout All Devices](logout-all-devices.md)
- [Auth API Reference](../api-reference/auth/index.md)
