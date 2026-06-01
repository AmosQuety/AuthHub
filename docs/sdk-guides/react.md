# SDK Guide — React (SPA)

This guide shows a complete pattern for integrating AuthHub with a React single-page app using PKCE and handling token handover.

1. Register a public OAuth client with redirect URI `https://app.example.com/callback`.

2. Generate PKCE values before redirecting:

```js
function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generatePkce() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(64));
  const codeVerifier = base64url(verifierBytes);
  const hash = await crypto.subtle.digest('SHA-256', verifierBytes);
  const codeChallenge = base64url(hash);
  return { codeVerifier, codeChallenge };
}
```

3. Redirect user to AuthHub authorize endpoint (browser):

```js
const { codeChallenge, codeVerifier } = await generatePkce();
localStorage.setItem('pkce_verifier', codeVerifier);
window.location.href = `https://auth.example.com/api/v1/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=openid%20email%20profile`;
```

4. Handle callback at `/callback` route in your React app:

- Read `code` and `state` from the URL.
- Exchange the code for tokens on your backend (recommended) or directly from the SPA if public client.

Server-side exchange example (recommended):

```js
// POST /exchange-code on your backend
const res = await fetch('https://auth.example.com/api/v1/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: localStorage.getItem('pkce_verifier'),
  })
});
const tokens = await res.json();
```

5. Store tokens

- Access token: keep in memory or secure storage; prefer in-memory to reduce XSS risk.
- Refresh token: if returned to SPA, prefer HttpOnly cookie set by AuthHub. For SPAs, the recommended pattern is server-side exchange and HttpOnly cookie.

6. Call protected APIs

```js
fetch('/api/protected', { headers: { Authorization: `Bearer ${accessToken}` } });
```

7. Refreshing

- Use a silent refresh endpoint or call your backend to call `POST /api/v1/oauth/token` with `grant_type=refresh_token` (server-side), or use `POST /api/v1/auth/refresh` for cookie-based refresh.

Security considerations

- Never embed `client_secret` in client-side code.
- Use short token lifetimes, and prefer storing refresh tokens as HttpOnly cookies.

Implementation references

- PKCE & token exchange: `backend/src/core/crypto.ts` and `backend/src/modules/oauth/controller.ts`