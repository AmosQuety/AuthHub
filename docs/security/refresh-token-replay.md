# Refresh Token Replay Detection

AuthHub detects refresh token replay by comparing the presented refresh token against the hashed value stored in the session record.

What happens on replay

- The runtime logs a security warning.
- All sessions for the user are revoked.
- A blocked audit event is written.

Why it matters

- Replay detection prevents an attacker from repeatedly using a stolen refresh token.
- A replay indicates a compromised secret and should be treated as a security incident.

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)
- [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
