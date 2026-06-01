# Webhooks Overview

AuthHub emits outbound webhooks for tenant events and provides APIs to manage endpoint destinations.

Primary concepts

- Webhook endpoint: a URL, shared secret, and event subscription list.
- Webhook delivery: the record of a dispatched event and its HTTP result.
- Tenant scoping: each webhook endpoint belongs to the authenticated user's tenant.

Runtime behavior

- Outbound webhook endpoints are managed by `POST /api/v1/webhooks/mgmt`, `GET /api/v1/webhooks/mgmt`, `DELETE /api/v1/webhooks/mgmt/:id`, and `GET /api/v1/webhooks/mgmt/:id/deliveries`.
- Endpoint creation generates a secret prefixed with `whsec_`.
- Delivery logs store response code, body, duration, and error message.

Related pages

- [Management](management.md)
- [Events](events.md)
- [Security](security.md)

Source

- [backend/src/modules/webhooks/router.ts](backend/src/modules/webhooks/router.ts)
- [backend/src/modules/webhooks/controller.ts](backend/src/modules/webhooks/controller.ts)
- [backend/src/services/webhook.service.ts](backend/src/services/webhook.service.ts)
