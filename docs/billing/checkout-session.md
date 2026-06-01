# POST /api/v1/billing/checkout-session

Purpose

Create a Stripe Checkout session for a subscription purchase.

Request schema

- Method: POST
- Authorization: `Bearer <access_token>`
- Body:

```json
{
  "priceId": "price_123",
  "successUrl": "https://app.example.com/billing/success",
  "cancelUrl": "https://app.example.com/billing/cancel"
}
```

Response schema

- 200 OK

```json
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

Error examples

- 400 Bad Request

```json
{ "error": "priceId is required" }
```

- 503 Service Unavailable when Stripe is not configured

```json
{ "error": "Billing is not configured on this server." }
```

Security notes

- `client_reference_id` is set to the current user id so the webhook can link the subscription back to the user.
- Do not expose Stripe secret keys in the browser; only this API should create the session.

Related endpoints

- `GET /api/v1/billing/status`
- `POST /api/v1/billing/customer-portal`

Source

- [backend/src/modules/billing/controller.ts](backend/src/modules/billing/controller.ts)
