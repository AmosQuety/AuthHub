# AI Quick Reference

## Core docs

- Home: [Developer Portal](../index.md)
- Quick start: [Quick Start](../quickstart.md)
- OAuth: [OAuth](../oauth/index.md)
- OIDC: [OIDC](../oidc/index.md)
- API reference: [API Reference](../api-reference/index.md)
- Troubleshooting: [Common errors](../troubleshooting/common-errors.md)

## Common endpoints

- Register: [Auth register](../api-reference/auth_register.md)
- Login: [Auth login](../api-reference/auth_login.md)
- Refresh: [Auth refresh](../api-reference/auth_refresh.md)
- Logout: [Auth logout](../api-reference/auth_logout.md)
- Current user: [Me](../api-reference/auth/me.md)
- Revoke token: [Revoke](../api-reference/auth/revoke.md)
- Introspect token: [Introspect](../api-reference/auth/introspect.md)
- Sessions: [Sessions](../api-reference/auth/sessions.md)
- OAuth authorize: [Authorize](../api-reference/oauth_authorize.md)
- OAuth token: [Token](../api-reference/oauth_token.md)
- OIDC discovery: [Discovery](../api-reference/oidc_discovery.md)
- JWKS: [JWKS](../api-reference/oidc_jwks.md)
- UserInfo: [UserInfo](../api-reference/oidc_userinfo.md)

## Security reminders

- Use PKCE for public clients.
- Keep secrets server-side.
- Never log tokens.
- Verify webhook signatures.
- Treat admin impersonation and root API keys as privileged operations.
