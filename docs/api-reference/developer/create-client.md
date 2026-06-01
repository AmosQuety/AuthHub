# POST /api/v1/developer/clients

Purpose

Create an OAuth client and its isolated tenant space for the authenticated user.

Request schema

- Method: POST
- Authorization: `Bearer <access_token>`
- Body:

```json
{
  "name": "My App",
  "redirectUris": ["https://app.example.com/callback"],
  "isConfidential": true
}
```

Response schema

- 201 Created

```json
{
  "message": "Application registered. A new isolated tenant space has been provisioned.",
  "client": {
    "clientId": "uuid",
    "name": "My App",
    "redirectUris": ["https://app.example.com/callback"],
    "isPublic": false,
    "tenantId": "tenant-id",
    "clientSecret": "shown-once"
  },
  "tenant": {
    "id": "tenant-id",
    "name": "My App",
    "clientId": "tenant-slug"
  }
}
```

Error examples

- 400 Bad Request when name or redirectUris are missing
- 409 Conflict when a duplicate app name exists

Security notes

- The secret is shown once at creation time.
- A new tenant is provisioned atomically with the client.
- The authenticated user becomes the client owner.

Common mistakes

- Losing the client secret after creation.
- Treating the client id and tenant slug as the same value; they are distinct.

Related endpoints

- `GET /api/v1/developer/clients`
- `POST /api/v1/developer/clients/:id/rotate`

Source

- [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)
