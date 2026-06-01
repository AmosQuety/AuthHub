# GET /api/v1/developer/stats

Purpose

Return 7-day login trend data for the authenticated user's apps.

Request schema

- Method: GET
- Authorization: `Bearer <access_token>`

Response schema

- 200 OK

```json
{
  "totalLogins": 42,
  "chartData": [
    { "date": "2026-05-26", "logins": 4 },
    { "date": "2026-05-27", "logins": 8 }
  ]
}
```

Security notes

- Stats are filtered to the authenticated user's owned clients.
- The implementation derives counts from audit logs.

Common mistakes

- Expecting per-client drill-down metrics; this endpoint returns an aggregate trend.

Related endpoints

- `GET /api/v1/developer/clients`
- `POST /api/v1/developer/clients/:id/rotate`

Source

- [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)
