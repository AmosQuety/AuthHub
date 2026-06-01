# Tutorial — Billing Entitlements Synchronization

This tutorial shows how to synchronize Stripe subscription state with AuthHub entitlements.

Flow

1. Stripe checkout succeeds.
2. Stripe sends a `checkout.session.completed` webhook.
3. AuthHub creates or updates an entitlement.
4. The entitlement drives `GET /api/v1/billing/status`.

Operational advice

- Keep your webhook receiver idempotent.
- Use the subscription id as the natural key.
- Verify the Stripe signature and use the raw request body.

Related docs

- [Billing Overview](../billing/index.md)
- [Stripe Webhook](../billing/stripe-webhook.md)
