# Risk-Based Authentication

AuthHub uses a risk engine to score login attempts.

Runtime behavior

- Low-risk logins proceed normally.
- Moderate-risk logins can trigger MFA.
- High-risk logins can be blocked entirely.

Signals used by the runtime

- User id
- IP address
- User agent
- Historical login patterns and audit signals through the risk engine

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)
- [backend/src/core/riskEngine.ts](backend/src/core/riskEngine.ts)
