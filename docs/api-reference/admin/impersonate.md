# POST /api/v1/admin/users/:id/impersonate

Purpose

Create a temporary access token that lets an admin act as another user.

Request schema

- Method: POST
- Authorization: `Bearer <ADMIN_ACCESS_TOKEN>`
- Path parameter: `id` = target user id

Response schema

- 200 OK

```json
{ "accessToken": "<impersonation-jwt>" }
```

Security notes

- The resulting token includes the actor (`act`) claim. 
- No refresh token is issued for impersonation.
- A notification email is sent to the target user.
- The event is audited.

Common mistakes

- Using impersonation for routine support workflows without audit controls.

Related endpoints

- `GET /api/v1/admin/users`
- `GET /api/v1/auth/me`

Source

- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
