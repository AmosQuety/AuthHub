# Authentication API Reference

This section documents every runtime authentication endpoint under `/api/v1/auth`.

Endpoint index

- [POST /api/v1/auth/revoke](revoke.md)
- [POST /api/v1/auth/introspect](introspect.md)
- [GET /api/v1/auth/me](me.md)
- [GET /api/v1/auth/role-check](role-check.md)
- [PATCH /api/v1/auth/profile](profile.md)
- [POST /api/v1/auth/complete-profile](complete-profile.md)
- [GET /api/v1/auth/sessions](sessions.md)
- [DELETE /api/v1/auth/sessions/others](sessions-others.md)
- [DELETE /api/v1/auth/sessions/:id](session-delete.md)
- [DELETE /api/v1/auth/providers/:id](provider-unlink.md)
- [POST /api/v1/auth/verify-email/send](verify-email-send.md)
- [GET /api/v1/auth/verify-email/:token](verify-email.md)
- [POST /api/v1/auth/forgot-password](forgot-password.md)
- [POST /api/v1/auth/reset-password](reset-password.md)
- [PUT /api/v1/auth/update-password](update-password.md)
- [POST /api/v1/auth/verify-password](verify-password.md)

Implementation references

- Router: [backend/src/modules/auth/router.ts](backend/src/modules/auth/router.ts)
- Controller: [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)
- Profile completion: [backend/src/modules/auth/profile.ts](backend/src/modules/auth/profile.ts)
- Crypto utilities: [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
