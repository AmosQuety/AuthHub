# GET /api/v1/developer/stats

Purpose

Provide usage analytics for the developer's registered applications (e.g., 7-day login trend).

Request

- Method: GET
- URL: `/api/v1/developer/stats`
- Authorization: Developer authentication required

Response example

```json
{
  "totalLogins": 1234,
  "chartData": [{ "date": "2026-05-26", "logins": 120 }, { "date": "2026-05-27", "logins": 98 }]
}
```

Implementation notes

- The implementation aggregates login events from `audit_logs` or other metrics tables.
- Implementation lives in `backend/src/modules/developer`.

Security

- Ensure analytics endpoints are access-controlled to prevent data leakage.