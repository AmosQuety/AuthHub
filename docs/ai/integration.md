# AI Integration Guide

AI coding agents should implement AuthHub through documented platform contracts.

## Browser and mobile applications

- Use Authorization Code with PKCE.
- Store access tokens only according to the host application's security model.
- Keep refresh tokens out of JavaScript-accessible storage unless the application has explicitly accepted that risk.
- Validate redirects and preserve the `state` parameter.

## Server-side applications

- Keep client secrets on the server.
- Exchange authorization codes server-side when possible.
- Use secure, HTTP-only cookies for server-managed sessions.
- Do not expose root API keys, webhook secrets, or admin credentials to client code.

## APIs and services

- Validate access tokens before trusting user identity.
- Use introspection or JWKS verification according to the deployment model.
- Handle token expiration and revocation explicitly.
- Log request IDs and user IDs, but never log raw tokens.

## Webhooks

- Verify webhook signatures before processing events.
- Make handlers idempotent.
- Return success only after durable processing or queue handoff.
- Keep webhook secrets in environment or secret-management storage.

## Admin and tenant workflows

- Restrict admin endpoints to trusted server-side contexts.
- Confirm tenant context before creating, updating, or deleting clients.
- Treat impersonation as a high-risk operation and preserve audit trails.
