# Session Revocation

AuthHub stores sessions server-side so they can be revoked explicitly.

Revocation paths

- Current session logout: `POST /api/v1/auth/logout`
- Revoke a specific session: `DELETE /api/v1/auth/sessions/:id`
- Revoke all other sessions: `DELETE /api/v1/auth/sessions/others`
- Password reset and password change flows revoke sessions as part of the workflow.

Operational guidance

- Show the session list to the user before revoking devices.
- Revoke sessions immediately if you suspect credential compromise.

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)
