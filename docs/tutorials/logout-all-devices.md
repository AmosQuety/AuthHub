# Tutorial — Logout All Devices

This tutorial shows how to revoke all other sessions from a user account.

Flow

1. Show the list of active sessions with `GET /api/v1/auth/sessions`.
2. Add a "Log out other devices" button.
3. Call `DELETE /api/v1/auth/sessions/others`.
4. Refresh the session list.

Example

```js
await fetch('/api/v1/auth/sessions/others', {
  method: 'DELETE',
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

Related docs

- [Session Management](session-management.md)
- [Auth API Reference](../api-reference/auth/index.md)
