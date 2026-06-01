# Webhooks API Reference

AuthHub supports outbound webhooks for tenant events and provides management APIs under `/api/v1/webhooks/mgmt` for creating and configuring webhook endpoints. Incoming webhooks (for billing or third-party events) are handled by dedicated routes as needed.

Outbound webhook delivery

- Event examples: `user.created`, `login.success`, `session.revoked`.
- Webhook endpoints are represented by `WebhookEndpoint` and deliveries by `WebhookDelivery` in the Prisma schema.
- Webhook requests are signed using the endpoint `secret` and delivered with retries by the `webhook` service.

Management endpoints (examples)

- `GET /api/v1/webhooks/mgmt` — list webhook endpoints for the tenant
- `POST /api/v1/webhooks/mgmt` — create a new webhook endpoint (url, secret, events)
- `PATCH /api/v1/webhooks/mgmt/{id}` — update endpoint
- `DELETE /api/v1/webhooks/mgmt/{id}` — disable or delete endpoint
- `GET /api/v1/webhooks/mgmt/{id}/deliveries` — view recent deliveries and status

Incoming webhook endpoints

- Some modules expose inbound webhook handlers for third-party services (e.g., billing webhooks). These endpoints expect raw request bodies; the server configures body-parsing exclusions for webhook routes to preserve signature verification ability. Example: Stripe webhook handler in `backend/src/modules/billing/webhook.ts`.

Implementation references

- Router: `backend/src/modules/webhooks/router.ts`
- Controller: `backend/src/modules/webhooks/controller.ts`
- Delivery service: `backend/src/services/webhook.service.ts`
- Billing webhook example: `backend/src/modules/billing/webhook.ts`

Security

- Verify webhook signatures using the configured `secret` before processing deliveries.
- Restrict webhook management APIs to tenant owners or admin roles.
- Log all webhook deliveries and responses for auditing and retry analysis.