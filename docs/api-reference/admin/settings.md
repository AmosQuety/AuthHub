# GET /api/v1/admin/settings and PATCH /api/v1/admin/settings

Purpose

Inspect and update global system settings.

Behavior

- `GET` returns the singleton system settings row.
- `PATCH` updates maintenance mode and global MFA forcing.

Example response

```json
{
  "settings": {
    "maintenanceMode": false,
    "globalMfaForce": true
  }
}
```

Security notes

- Requires the `ADMIN` role.
- Updates are audited.
- Maintenance cache is invalidated when settings change.

Source

- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
