# GET /api/v1/admin/search

Purpose

Search users, clients, and tenants from a single admin endpoint.

Request schema

- Method: GET
- Authorization: `Bearer <ADMIN_ACCESS_TOKEN>`
- Query parameter: `q`

Response schema

- 200 OK

```json
{
  "results": [
    {
      "id": "tenant-id",
      "title": "Tenant Name",
      "type": "Tenant",
      "url": "/admin/tenants/tenant-id",
      "icon": "Shield"
    }
  ]
}
```

Security notes

- The endpoint is admin-only.
- Results are limited to users, clients, and tenants.

Related endpoints

- `GET /api/v1/admin/users`
- `GET /api/v1/admin/clients`
- `GET /api/v1/admin/tenants`

Source

- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
