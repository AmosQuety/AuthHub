# SDK Guide — React Native

This guide outlines patterns for integrating AuthHub in React Native apps.

Options

- Use `react-native-app-auth` (recommended) for mobile-friendly OAuth flows with PKCE.
- Use system browser for authorization and custom URI scheme or universal links for redirect.

Example using `react-native-app-auth`

```js
import {authorize, refresh} from 'react-native-app-auth';

const config = {
  issuer: 'https://auth.example.com',
  clientId: 'YOUR_CLIENT_ID',
  redirectUrl: 'com.myapp://oauthredirect',
  scopes: ['openid', 'profile', 'email'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://auth.example.com/api/v1/oauth/authorize',
    tokenEndpoint: 'https://auth.example.com/api/v1/oauth/token'
  }
};

async function signIn() {
  const result = await authorize(config);
  // result contains accessToken, accessTokenExpirationDate, refreshToken
}
```

Security

- Use system browser for auth to leverage SSO and shared cookies.
- Keep `client_secret` off mobile clients (use public clients with PKCE).

Notes

- Ensure your redirect URI is registered with the OAuth client and configured for mobile (custom scheme or universal link).