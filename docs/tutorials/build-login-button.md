# Tutorial — Build Your Own Login Button

This short tutorial shows how to create a reusable login button component that kicks off the PKCE flow.

React component example

```jsx
import React from 'react';

export function LoginButton({ clientId, redirectUri }) {
  const handleLogin = async () => {
    const { codeVerifier, codeChallenge } = await generatePkce();
    localStorage.setItem('pkce_verifier', codeVerifier);
    const url = `https://auth.example.com/api/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&scope=openid%20email%20profile`;
    window.location.href = url;
  };

  return <button onClick={handleLogin}>Log in</button>;
}
```

Notes

- `generatePkce()` generates the verifier and challenge (see earlier guides).
- Store `code_verifier` securely (in memory or sessionStorage) until exchange.