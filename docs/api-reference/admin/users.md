# /api/v1/admin/users

Endpoints

- `GET /api/v1/admin/users`
- `DELETE /api/v1/admin/users/:id`
- `POST /api/v1/admin/users/:id/impersonate`

Purpose

Inspect and manage users at the administrative layer.

Behavior

- List users with pagination and optional search.
- Delete a user and their sessions.
- Impersonate a user to diagnose issues.

Security notes

- Requires `ADMIN` role.
- Impersonation emits audit logs and sends a security notification email.

Source

- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
