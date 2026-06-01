# PATCH /api/v1/auth/profile

Purpose

Update the authenticated user's profile fields.

Request schema

- Method: PATCH
- Authorization: `Bearer <access_token>`
- Body:

```json
{
  "name": "New Name",
  "phoneNumber": "+14155550100"
}
```

Response schema

- 200 OK

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "New Name",
    "phoneNumber": "+14155550100"
  }
}
```

Error examples

- 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

Security notes

- The endpoint updates only the current authenticated user.
- Redis profile cache is cleared so `GET /api/v1/auth/me` reflects the change immediately.

Common mistakes

- Sending empty strings; the controller trims values but does not validate additional profile fields.
- Expecting it to update email or roles; it only updates name and phone number.

Related endpoints

- `POST /api/v1/auth/complete-profile`
- `GET /api/v1/auth/me`

Source

- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)