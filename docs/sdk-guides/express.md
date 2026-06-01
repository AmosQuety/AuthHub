# SDK Guide — Node.js Express (Server)

This guide demonstrates how a Node.js Express server can integrate with AuthHub to handle the OAuth PKCE flow and token management.

1. Start PKCE flow by redirecting to AuthHub authorize endpoint from the server or client.

2. Exchange the authorization code server-side:

```js
// express route
app.post('/auth/exchange', async (req, res) => {
  const { code, codeVerifier } = req.body;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET, // if confidential
    code_verifier: codeVerifier,
  });

  const tokenRes = await fetch(`${process.env.AUTH_BASE}/api/v1/oauth/token`, {
    method: 'POST',
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const tokens = await tokenRes.json();
  // Set HttpOnly refresh cookie
  res.cookie('refreshToken', tokens.refresh_token, { httpOnly: true, secure: true, maxAge: 7*24*60*60*1000 });
  res.json({ access_token: tokens.access_token, expires_in: tokens.expires_in });
});
```

3. Use middleware to forward the access token when calling upstream APIs or for session handling.

Refresh flow

- Call server endpoint which calls `/oauth/token` with `grant_type=refresh_token` using the server's stored refresh token or cookie.

Security

- Store client secret securely in environment variables.
- Use secure cookies for refresh tokens.

References

- Token endpoint: `POST /api/v1/oauth/token`