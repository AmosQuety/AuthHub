# GET /api/v1/auth/sessions

Purpose

List active sessions for the authenticated user.

Request schema

- Method: GET
- Authorization: `Bearer <access_token>`

Response schema

- 200 OK

```json
{
  "sessions": [
    {
      "id": "session-id",
      "ipAddress": "203.0.113.10",
      "expiresAt": "2026-06-08T00:00:00.000Z",
      "createdAt": "2026-06-01T00:00:00.000Z",
      "deviceInfo": {
        "browser": "Chrome",
        "os": "Windows",
        "isMobile": false,
        "rawUserAgent": "Mozilla/5.0 ..."
      }
    }
  ]
}
```

Error examples

- 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

Security notes

- Device info is derived from user-agent heuristics.
- Use this endpoint to display active devices and to support targeted revocation.

Common mistakes

- Assuming the response includes refresh tokens; it never does.

Related endpoints

- `DELETE /api/v1/auth/sessions/others`
- `DELETE /api/v1/auth/sessions/:id`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)