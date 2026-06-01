# Developer Portal — `/api/v1/developer/clients`

Purpose

Manage OAuth client registrations for developers.

Endpoints

- `GET /api/v1/developer/clients` — list clients owned by the current developer.
- `POST /api/v1/developer/clients` — register a new OAuth application.
- `PATCH /api/v1/developer/clients/{clientId}` — update redirect URIs or name.
- `DELETE /api/v1/developer/clients/{clientId}` — delete an application.
- `POST /api/v1/developer/clients/{clientId}/rotate` — rotate client secret (confidential clients only).

Create client (POST)

- Body example:

```json
{
  "name": "My App",
  "redirectUris": ["https://app.example.com/callback"],
  "isConfidential": true
}
```

- Success: 201 Created; for confidential clients, `clientSecret` is shown once and must be recorded by the developer.

Rotate client secret

- Path: `POST /api/v1/developer/clients/{clientId}/rotate`
- Behavior: creates a new client secret and invalidates the old one immediately. For public clients this endpoint returns 400 (not applicable).

Security & Ownership

- These endpoints require developer authentication and will enforce ownership checks when updating or deleting a client.
- Implementation: `backend/src/modules/developer/router.ts` (controllers live in `backend/src/modules/developer/`).

Related endpoints

- `GET /api/v1/developer/stats` — usage analytics for developer apps.