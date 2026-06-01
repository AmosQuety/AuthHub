# GET /api/v1/developer/clients

Purpose

List OAuth clients owned by the authenticated user.

Request schema

- Method: GET
- Authorization: `Bearer <access_token>`

Response schema

- 200 OK

```json
{
  "clients": [
    {
      "clientId": "client-id",
      "name": "My App",
      "redirectUris": ["https://app.example.com/callback"],
      "isPublic": true,
      "tenantId": "tenant-id",
      "createdAt": "2026-06-01T00:00:00.000Z"
    }
  ]
}
```

Security notes

- Ownership is enforced by filtering on `ownerId`.
- The returned data is scoped to the authenticated user.

Related endpoints

- `POST /api/v1/developer/clients`
- `PATCH /api/v1/developer/clients/:id`

Source

- [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)
