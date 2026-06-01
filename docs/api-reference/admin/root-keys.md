# /api/v1/admin/root-keys

Endpoints

- `GET /api/v1/admin/root-keys`
- `POST /api/v1/admin/root-keys`
- `DELETE /api/v1/admin/root-keys/:id`

Purpose

Manage root API keys for privileged automation.

Lifecycle

- The secret is generated once and shown only at creation time.
- The stored value is hashed.
- `GET` shows metadata only.
- `DELETE` revokes the key.

Security notes

- Treat root API keys like production secrets.
- Rotate and scope them carefully.
- Audit logs are written for create and revoke events.

Source

- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
