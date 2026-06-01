# Admin API Reference

Use the route-level pages in [docs/api-reference/admin/index.md](admin/index.md) for the complete admin API documentation.

Authorization and Middleware

- Admin routes are protected using `requireRole` and authenticated via `authenticate` middleware.

Security considerations

- Ensure only a minimal set of admin users have the `ADMIN` role.
- Log admin actions for audit trails.
- Protect endpoints via IP whitelisting or additional MFA in high-risk deployments.