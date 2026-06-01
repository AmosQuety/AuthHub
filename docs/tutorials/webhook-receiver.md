# Tutorial — Webhook Receiver

This tutorial shows how to build a webhook receiver for AuthHub outbound events.

Flow

1. Create a webhook endpoint in AuthHub.
2. Store the generated secret securely.
3. Verify incoming requests with the secret.
4. Process the event idempotently.
5. Return a 2xx response quickly.

Recommended handler shape

```js
app.post('/webhooks/authhub', express.json(), async (req, res) => {
  // verify signature using the endpoint secret
  // process req.body.event
  res.status(200).send('ok');
});
```

Related docs

- [Webhooks Overview](../webhooks/index.md)
- [Webhook Security](../webhooks/security.md)
