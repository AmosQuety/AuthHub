# Tutorial — Password Reset

This tutorial uses the runtime password reset endpoints.

Flow

1. Ask the user for their email address.
2. Call `POST /api/v1/auth/forgot-password`.
3. The user receives a reset link containing a token.
4. Present a reset form and send the token plus a new password to `POST /api/v1/auth/reset-password`.
5. Tell the user to sign in again.

Server example

```js
await fetch('/api/v1/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
});
```

Reset submit example

```js
await fetch('/api/v1/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, password: newPassword }),
});
```

Security notes

- Reset tokens are single-use and expire quickly.
- Password reset revokes existing sessions.

Related API reference

- [Forgot Password](../api-reference/auth/forgot-password.md)
- [Reset Password](../api-reference/auth/reset-password.md)
