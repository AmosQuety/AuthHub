# Tutorial — Token Introspection

This tutorial shows how to ask AuthHub whether a token is active.

Example

```js
const res = await fetch('/api/v1/auth/introspect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: accessToken }),
});
const data = await res.json();
```

When to use it

- Debugging authentication issues.
- Building admin tools.
- Checking a token before calling a downstream API.

Prefer local JWT verification for high-throughput resource servers.
