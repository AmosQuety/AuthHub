# Tutorial — Login with React (SPA)

This tutorial shows a simple SPA integration using PKCE for a public client.

1. Register a public client in the Developer Portal with `redirectUris` including `https://app.example.com/callback`.

2. Generate PKCE values in the browser before starting the flow:

```js
function base64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generatePkce() {
  const verifier = window.crypto.getRandomValues(new Uint8Array(64));
  const codeVerifier = base64url(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', verifier);
  const codeChallenge = base64url(digest);
  return { codeVerifier, codeChallenge };
}
```

3. Redirect user to AuthHub authorize endpoint:

```
GET /api/v1/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=https://app.example.com/callback&response_type=code&code_challenge=CODE_CHALLENGE&code_challenge_method=S256&scope=openid%20email%20profile
```

4. After login & consent, the frontend receives a code (via backend redirect flow). Exchange code on your server or by calling the token endpoint directly from your SPA (public client):

```
POST /api/v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=...&redirect_uri=...&client_id=...&code_verifier=...
```

5. Use `access_token` to call APIs and `refresh_token` to refresh when needed.

Security notes

- Do not store `client_secret` in client-side code.
- Use PKCE for SPA clients and prefer storing refresh tokens in HttpOnly cookies when possible.