# POST /api/v1/billing/stripe

Purpose

Receive Stripe webhook events and synchronize entitlements with AuthHub.

Request schema

- Method: POST
- Content-Type: `application/json`
- Requires raw body for signature verification
- Headers:
  - `Stripe-Signature`

Behavior

- The controller verifies the Stripe signature using `STRIPE_WEBHOOK_SECRET`.
- The route uses `express.raw({ type: 'application/json' })` so the payload can be verified.
- On `checkout.session.completed`, the subscription is linked to the user through `client_reference_id`.
- On `customer.subscription.updated` and `customer.subscription.deleted`, entitlements are updated.

Response schema

- 200 OK

```json
{ "received": true }
```

Error examples

- 400 Bad Request

```text
Webhook missing signature or secret
```

- 400 Bad Request when signature verification fails

```text
Webhook Error: ...
```

- 503 Service Unavailable when Stripe is not configured

```json
{ "error": "Billing not configured" }
```

Security notes

- This endpoint must use raw-body parsing before any JSON parser touches it.
- Always verify the Stripe signature before updating entitlements.
- Audit logs record entitlement creation, update, and revocation.

Related endpoints

- `GET /api/v1/billing/status`
- `POST /api/v1/billing/checkout-session`
- `POST /api/v1/billing/customer-portal`

Source

- [backend/src/modules/billing/webhook.ts](backend/src/modules/billing/webhook.ts)
- [backend/src/modules/billing/router.ts](backend/src/modules/billing/router.ts)
