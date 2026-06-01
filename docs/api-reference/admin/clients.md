# /api/v1/admin/clients

Endpoints

- `GET /api/v1/admin/clients`
- `POST /api/v1/admin/clients`
- `DELETE /api/v1/admin/clients/:id`

Purpose

Manage OAuth clients across the system as an administrator.

Behavior

- List clients with their ids, names, redirect URIs, and status.
- Create clients with optional tenant assignment.
- Delete clients by id.

Security notes

- All operations require the `ADMIN` role.
- Use admin client management sparingly; most day-to-day app administration should happen in the user-owned developer portal.

Source

- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
