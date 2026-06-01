# AI Agent Documentation

This section is for AI coding agents and the developers who supervise them.

Start here when an agent needs to integrate AuthHub without reading the source code.

## Agent path

1. Read [AI_AGENTS](../AI_AGENTS.md) for repository-specific instructions.
2. Follow [AI onboarding](onboarding.md) to understand the integration sequence.
3. Use [AI integration](integration.md) for implementation guidance.
4. Keep [AI quick reference](quick-reference.md) open for endpoint and concept lookup.
5. Cross-check endpoint behavior in the [API Reference](../api-reference/index.md).

## Rules for agents

- Prefer documented APIs over source-code inference.
- Preserve OAuth 2.0 and OIDC security requirements.
- Use PKCE for browser and mobile integrations.
- Treat tokens, client secrets, webhook secrets, and root API keys as sensitive.
- Verify redirects, scopes, token storage, refresh behavior, and logout behavior before declaring an integration complete.
