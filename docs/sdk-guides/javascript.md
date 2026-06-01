# SDK Guide — JavaScript (Node.js)

This section provides a minimal Node.js example for performing the OAuth PKCE flow and calling UserInfo.

Install dependencies

```bash
npm install node-fetch
```

Generate PKCE verifier & challenge (example)

```js
import crypto from 'crypto';
import base64url from 'base64url';

function generateVerifier() {
  return base64url(crypto.randomBytes(64));
}

function challengeFromVerifier(verifier) {
  return base64url(crypto.createHash('sha256').update(verifier).digest());
}
```

Exchange authorization code for tokens

```js
import fetch from 'node-fetch';

async function exchangeCode({ tokenUrl, code, codeVerifier, redirectUri, clientId }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    client_id: clientId,
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    body: body.toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return res.json();
}
```

Call UserInfo

```js
async function userinfo(baseUrl, accessToken) {
  const res = await fetch(`${baseUrl}/api/v1/oidc/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}
```

Notes

- Use secure storage for `refresh_token` on server-side.
- For public SPA clients, prefer storing refresh tokens in HttpOnly secure cookies set by AuthHub during social flows.