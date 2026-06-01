# Webhook Security

Webhook endpoints are security-sensitive because they can trigger changes in your application.

Best practices

- Verify each incoming request with the endpoint secret.
- Use HTTPS for every delivery target.
- Reject unsigned or malformed requests.
- Store webhook secrets securely and rotate them when a tenant or consumer is compromised.
- Monitor delivery logs for repeated failures and unexpected status codes.

Tenant scoping

- AuthHub only exposes management data for the authenticated user's tenant.
- Endpoint ownership is checked before delete or delivery log access.

Retry behavior

- Delivery retries are handled by the webhook service.
- Persist delivery logs so you can see what failed and why.
- Build idempotent receivers because retries and duplicate deliveries are possible.

Stripe webhook note

- Stripe webhooks are handled separately and require raw-body signature verification.

Related pages

- [Overview](overview.md)
- [Management](management.md)
- [Events](events.md)
- [Billing Stripe Webhook](../billing/stripe-webhook.md)

Source

- [backend/src/modules/webhooks/controller.ts](backend/src/modules/webhooks/controller.ts)
- [backend/src/modules/billing/webhook.ts](backend/src/modules/billing/webhook.ts)
