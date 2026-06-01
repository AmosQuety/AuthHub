# /api/v1/admin/tenants

Endpoints

- `GET /api/v1/admin/tenants`
- `POST /api/v1/admin/tenants`
- `GET /api/v1/admin/tenants/:id`
- `PATCH /api/v1/admin/tenants/:id`
- `DELETE /api/v1/admin/tenants/:id`

Purpose

Manage tenant records in the system.

Behavior

- Create tenants with a generated `clientId` and one-time webhook secret.
- Update branding and policy settings.
- Delete tenants when they are no longer needed.
- Inspect tenant metadata and related settings.

Security notes

- Requires the `ADMIN` role.
- Webhook secret is shown only once at creation.
- Deleting a tenant is destructive and should be audited and reviewed carefully.

Source

- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
