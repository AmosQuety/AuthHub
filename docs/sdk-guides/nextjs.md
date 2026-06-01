# SDK Guide — Next.js

This guide provides a server-side Next.js integration pattern for AuthHub using PKCE and server-side token exchange.

Recommended pattern

- Use Next.js API routes to perform token exchange and to refresh tokens server-side.
- Store refresh token in a secure, `HttpOnly` cookie set by the server.

Example: `/pages/api/auth/callback.js`

```js
import fetch from 'node-fetch';
export default async function handler(req, res) {
  const { code } = req.query;
  const codeVerifier = req.cookies.pkce_verifier; // set earlier when starting flow

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
    client_id: process.env.NEXT_PUBLIC_CLIENT_ID,
    code_verifier: codeVerifier,
  });

  const tokenRes = await fetch(`${process.env.AUTH_BASE_URL}/api/v1/oauth/token`, {
    method: 'POST',
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const tokens = await tokenRes.json();

  // Set refresh token as HttpOnly cookie
  res.setHeader('Set-Cookie', `refreshToken=${tokens.refresh_token}; HttpOnly; Path=/; Secure; Max-Age=${7*24*60*60}`);

  res.redirect('/');
}
```

Silent refresh

- Use server-side API route to call `/oauth/token` with `refresh_token` and return fresh access token to client.

Security notes

- Avoid exposing sensitive tokens to client JavaScript; keep refresh tokens on the server.
- For server-rendered pages, use server-side calls with stored tokens to fetch protected resources.

Implementation references

- OAuth endpoints: `backend/src/modules/oauth/controller.ts`