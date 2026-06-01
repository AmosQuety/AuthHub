# Tutorial — Admin Impersonation

This tutorial shows how to use the admin impersonation endpoint safely.

Flow

1. Require the operator to be authenticated as an admin.
2. Call `POST /api/v1/admin/users/:id/impersonate`.
3. Use the returned access token to view the target user's experience.
4. Stop impersonation as soon as the task is complete.

Important

- The runtime includes an `act` claim with the impersonator id.
- The target user receives an email notification about the access.
- The action is audited.

Related docs

- [Admin API Reference](../api-reference/admin.md)
- [Security Overview](../security/overview.md)
