# GET /api/v1/billing/status

Purpose

Return the authenticated user's current billing status and active plan.

Request schema

- Method: GET
- Authorization: `Bearer <access_token>`

Response schema

- 200 OK

```json
{
  "active": true,
  "planId": "pro_plan",
  "status": "active",
  "currentPeriodEnd": "2026-06-30T00:00:00.000Z"
}
```

When no entitlement exists:

```json
{ "active": false, "planId": "free" }
```

Security notes

- Returns billing state only for the authenticated user.
- The source of truth is the `entitlement` table populated by Stripe webhooks.

Related endpoints

- `POST /api/v1/billing/checkout-session`
- `POST /api/v1/billing/customer-portal`
- `POST /api/v1/billing/stripe`

Source

- [backend/src/modules/billing/controller.ts](backend/src/modules/billing/controller.ts)
