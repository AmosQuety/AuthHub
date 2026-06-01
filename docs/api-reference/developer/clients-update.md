# PATCH /api/v1/developer/clients/:id

Purpose

Update an OAuth client's name, redirect URIs, or confidential/public classification.

Request schema

- Method: PATCH
- Authorization: `Bearer <access_token>`
- Path parameter: `id` = client id
- Body:

```json
{
  "name": "Updated App Name",
  "redirectUris": ["https://app.example.com/callback"],
  "isConfidential": true
}
```

Response schema

- 200 OK

```json
{
  "message": "Client updated successfully",
  "client": {
    "clientId": "client-id",
    "name": "Updated App Name",
    "redirectUris": ["https://app.example.com/callback"],
    "isPublic": false
  }
}
```

Error examples

- 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

- 404 Not Found

```json
{ "error": "Client not found" }
```

- 403 Forbidden

```json
{ "error": "Forbidden: You do not own this client" }
```

Security notes

- Only the owner of the client can update it.
- Use this endpoint to manage redirect URI changes carefully; exact redirect URI matching is enforced at token exchange.

Common mistakes

- Using a client id not owned by the current user.
- Assuming `isConfidential` is a no-op; it toggles the public/confidential classification.

Related endpoints

- `POST /api/v1/developer/clients`
- `POST /api/v1/developer/clients/:id/rotate`

Source

- [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)