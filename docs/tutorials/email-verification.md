# Tutorial — Email Verification

This tutorial shows how to verify a user email after registration.

Flow

1. The user registers or logs in.
2. Trigger `POST /api/v1/auth/verify-email/send` from an authenticated session.
3. The user receives an email with a verification link.
4. The user clicks the link, which hits `GET /api/v1/auth/verify-email/:token`.
5. Refresh the profile from `GET /api/v1/auth/me`.

Send verification request

```js
await fetch('/api/v1/auth/verify-email/send', {
  method: 'POST',
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

Why this matters

- Email verification changes the `emailVerified` flag used by OIDC and profile checks.
- The verification token is single-use.
