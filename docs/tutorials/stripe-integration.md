# Tutorial — Stripe Integration

This tutorial shows the billing lifecycle at a high level.

Flow

1. The user opens the billing page.
2. Create a checkout session with `POST /api/v1/billing/checkout-session`.
3. Stripe calls AuthHub's webhook endpoint when subscriptions change.
4. The entitlement table is updated.
5. The billing status endpoint reflects the user's plan.

Example checkout request

```js
await fetch('/api/v1/billing/checkout-session', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ priceId }),
});
```

Related docs

- [Billing Overview](../billing/index.md)
- [Stripe Webhook](../billing/stripe-webhook.md)
