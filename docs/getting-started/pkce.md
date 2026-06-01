# PKCE

AuthHub requires PKCE for the authorization code flow.

The runtime only supports:

- `code_challenge_method=S256`

You generate two values:

- `code_verifier` — random high-entropy string
- `code_challenge` — base64url(SHA-256(code_verifier))

Browser example

```js
async function makePkce() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(64));
  const verifier = btoa(String.fromCharCode(...verifierBytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const digest = await crypto.subtle.digest('SHA-256', verifierBytes);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return { verifier, challenge };
}
```

Where PKCE is used

- `GET /api/v1/oauth/authorize`
- `POST /api/v1/oauth/token`

Related pages

- [Login and Tokens](login-and-tokens.md)
- [OAuth 2.0 Guide](../oauth/index.md)
