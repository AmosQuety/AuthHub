# Tutorial — MFA Challenge Flow

AuthHub can require MFA when the user has enabled MFA or when the risk engine decides a step-up is needed.

Flow

1. The user submits credentials to `POST /api/v1/auth/login`.
2. If the response contains `status: "mfa_required"`, present a challenge screen.
3. Collect the second-factor code and verify it with your MFA endpoint or flow.
4. After success, continue with the authenticated session.

Important

- The login response may not immediately include an access token when MFA is required.
- Treat MFA as a hard gate before issuing session tokens to the client.

Related docs

- [Security Overview](../security/overview.md)
- [Auth API Reference](../api-reference/auth/index.md)
