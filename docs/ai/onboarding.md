# AI Onboarding

Use this sequence when assigning an AI coding agent to integrate AuthHub.

## Context to provide

- Application framework and runtime
- AuthHub base URL
- OAuth client ID
- Redirect URI
- Required scopes
- Token storage rules
- Whether the integration needs billing, webhooks, MFA, or admin behavior

## Integration sequence

1. Read [Introduction](../introduction.md) and [Quick Start](../quickstart.md).
2. Create or identify the OAuth client with [Create OAuth client](../getting-started/create-oauth-client.md).
3. Implement Authorization Code with PKCE using [PKCE](../getting-started/pkce.md).
4. Add login, callback, refresh, and logout behavior.
5. Fetch the current user with [Me](../api-reference/auth/me.md).
6. Add session management and token revocation if the application stores refresh tokens.
7. Add MFA, email verification, billing, or webhooks only when required by the product.

## Completion criteria

- Login succeeds from a clean browser session.
- Invalid redirect URIs are rejected.
- Tokens are not logged.
- Refresh behavior is tested.
- Logout clears local session state and calls the appropriate AuthHub endpoint.
- Protected routes reject expired, revoked, or missing tokens.
