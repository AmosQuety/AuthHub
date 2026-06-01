# Webhook Events

AuthHub uses webhook events to notify external systems of important account changes.

Documented runtime events

- `user.created`
- `login.success`
- `session.revoked`
- Billing events derived from Stripe webhook processing:
  - subscription created / updated / deleted through entitlement synchronization

Where events come from

- Registration flow dispatches `user.created`.
- Successful login dispatches `login.success`.
- Session revocation and password reset flows can emit security-related audit events.
- Stripe webhook events map into entitlement update events in the billing subsystem.

Recommended consumer behavior

- Treat events as at-least-once.
- De-duplicate using your own event id or a deterministic key from the payload.
- Return 2xx quickly and process asynchronously when possible.

Related pages

- [Overview](overview.md)
- [Management](management.md)
- [Security](security.md)

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)
- [backend/src/services/webhook.service.ts](backend/src/services/webhook.service.ts)
- [backend/src/modules/billing/webhook.ts](backend/src/modules/billing/webhook.ts)
