# POST /api/v1/developer/clients/:id/rotate

Purpose

Rotate the OAuth client secret for a confidential client.

Request schema

- Method: POST
- Authorization: `Bearer <access_token>`
- Path parameter: `id` = client id

Response schema

- 200 OK

```json
{
  "message": "Secret rotated successfully",
  "clientSecret": "new-secret-shown-once"
}
```

Error examples

- 400 Bad Request when the client is public

```json
{ "error": "Public clients do not have secrets." }
```

- 403 Forbidden when the user does not own the client
- 404 Not Found when the client does not exist

Security notes

- The new secret is shown only once.
- The old secret is invalidated immediately by replacing the stored hash.

Common mistakes

- Rotating a public client secret, which is not supported.
- Forgetting to persist the new secret after the response returns.

Related endpoints

- `POST /api/v1/developer/clients`
- `PATCH /api/v1/developer/clients/:id`

Source

- [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)
