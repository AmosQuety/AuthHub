# Webhook Management

## POST /api/v1/webhooks/mgmt

Create a tenant-scoped webhook endpoint.

Request schema

```json
{
  "url": "https://app.example.com/webhooks/authhub",
  "events": ["user.created", "login.success"],
  "description": "Notify our app of AuthHub activity"
}
```

Response schema

- 201 Created with the created `WebhookEndpoint` record.

## GET /api/v1/webhooks/mgmt

List all webhook endpoints for the current tenant.

Response schema

- 200 OK with an array of webhook endpoints including delivery counts.

## DELETE /api/v1/webhooks/mgmt/:id

Delete a webhook endpoint owned by the current tenant.

Response schema

- 204 No Content on success.

## GET /api/v1/webhooks/mgmt/:id/deliveries

Return the latest deliveries for a webhook endpoint.

Response schema

- 200 OK with delivery records.

Security notes

- All management endpoints require authentication.
- Ownership is enforced using the tenant id from the authenticated user.
- A webhook endpoint cannot be managed across tenant boundaries.

Related pages

- [Overview](overview.md)
- [Security](security.md)

Source

- [backend/src/modules/webhooks/controller.ts](backend/src/modules/webhooks/controller.ts)
