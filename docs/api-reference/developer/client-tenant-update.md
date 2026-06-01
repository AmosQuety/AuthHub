# PATCH /api/v1/developer/clients/:id/tenant

Purpose

Update branding and integration settings for the isolated tenant attached to a client.

Request schema

- Method: PATCH
- Authorization: `Bearer <access_token>`
- Path parameter: `id` = client id
- Body may include:

```json
{
  "customDomain": "auth.example.com",
  "logoUrl": "https://cdn.example.com/logo.png",
  "primaryColor": "#0ea5e9",
  "smtpHost": "smtp.example.com",
  "smtpPort": 587,
  "smtpUser": "user",
  "smtpPass": "secret",
  "emailFrom": "noreply@example.com",
  "webhookUrl": "https://app.example.com/webhook"
}
```

Response schema

- 200 OK

```json
{
  "message": "Tenant configuration updated successfully",
  "tenant": {
    "id": "tenant-id",
    "customDomain": "auth.example.com"
  }
}
```

Error examples

- 401 Unauthorized
- 403 Forbidden when the user does not own the client
- 400 Bad Request when the client has no isolated tenant space
- 404 Not Found when the client does not exist

Security notes

- Ownership is verified against the client owner.
- SMTP passwords are encrypted before storage.
- Tenant branding changes affect the client-linked isolated tenant only.

Common mistakes

- Calling this for a client without an attached tenant.
- Assuming `smtpPass` is stored in plaintext; it is encrypted.

Related endpoints

- `PATCH /api/v1/developer/clients/:id`
- `POST /api/v1/developer/clients/:id/rotate`

Source

- [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)