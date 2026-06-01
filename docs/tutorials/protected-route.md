# Tutorial — Build a Protected Route

This tutorial shows how to protect an API route using AuthHub access tokens.

Express middleware example

```js
import express from 'express';
import fetch from 'node-fetch';

const app = express();

app.get('/api/protected', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send({ error: 'Missing token' });

  const token = auth.split(' ')[1];
  // Verify token locally by fetching JWKS and using jose, or call an introspect endpoint if present.
  try {
    // Use your verification logic here (jose jwtVerify)
    res.json({ data: 'protected data' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

Notes

- Prefer local verification using JWKS for performance instead of remote introspection.
- Cache JWKS and refresh periodically or on `kid` mismatch.