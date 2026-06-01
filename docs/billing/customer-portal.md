# POST /api/v1/billing/customer-portal

Purpose

Create a Stripe Billing Portal session so the authenticated user can manage their subscription.

Request schema

- Method: POST
- Authorization: `Bearer <access_token>`
- No body required

Response schema

- 200 OK

```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

Error examples

- 400 Bad Request

```json
{ "error": "No active subscription found to manage." }
```

- 404 Not Found

```json
{ "error": "Subscription could not be fetched from Stripe." }
```

- 503 Service Unavailable when Stripe is not configured

```json
{ "error": "Billing is not configured on this server." }
```

Security notes

- The portal session is derived from the active Stripe subscription linked to the current user.
- This endpoint is user-scoped and does not reveal other customers' billing state.

Related endpoints

- `GET /api/v1/billing/status`
- `POST /api/v1/billing/checkout-session`

Source

- [backend/src/modules/billing/controller.ts](backend/src/modules/billing/controller.ts)
