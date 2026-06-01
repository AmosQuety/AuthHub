# POST /api/v1/auth/complete-profile

Purpose

Complete a partially onboarded profile by setting name, phone number, and legal acceptance flags.

Request schema

- Method: POST
- Authorization: `Bearer <access_token>`
- Body:

```json
{
  "name": "New Name",
  "phoneNumber": "+14155550100",
  "tosAccepted": true
}
```

Response schema

- 200 OK

```json
{
  "success": true,
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "New Name",
    "phoneNumber": "+14155550100",
    "profilePictureUrl": null,
    "tosAcceptedAt": "2026-06-01T00:00:00.000Z",
    "privacyAcceptedAt": "2026-06-01T00:00:00.000Z"
  }
}
```

Error examples

- 400 Bad Request

```json
{ "error": "Name is required" }
```

```json
{ "error": "Phone number is required" }
```

```json
{ "error": "You must accept the Terms of Service to continue" }
```

```json
{ "error": "Invalid phone number format" }
```

Security notes

- The endpoint refreshes tokens after profile completion to carry updated claims.
- It requires a valid authenticated session/access token.

Common mistakes

- Using a phone number format that fails the runtime validation regex.
- Forgetting `tosAccepted: true`.

Related endpoints

- `PATCH /api/v1/auth/profile`
- `GET /api/v1/auth/me`

Source

- [backend/src/modules/auth/profile.ts](backend/src/modules/auth/profile.ts)