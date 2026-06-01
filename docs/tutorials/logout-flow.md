# Tutorial — Logout Flow

This tutorial explains logout behavior and how to implement logout across devices.

Single device logout

- Call `POST /api/v1/auth/logout` from the client with authentication.
- The server will delete the `Session` record and clear cookies.

Logout other sessions

- Call `DELETE /api/v1/auth/sessions/others` (authenticated) to revoke other sessions.
- Server deletes sessions for the user except the current session id.

Global logout

- To log a user out from all devices, delete all `Session` records for the user in the `sessions` table and invalidate refresh tokens.
- Consider sending webhook events to client systems to notify of revocation.