# DELETE /api/v1/developer/clients/:id

Purpose

Delete an OAuth client and its isolated tenant space.

Request schema

- Method: DELETE
- Authorization: `Bearer <access_token>`
- Path parameter: `id` = client id

Response schema

- 200 OK

```json
{ "message": "Client and its isolated tenant space deleted successfully" }
```

Error examples

- 401 Unauthorized
- 404 Not Found when the client does not exist
- 403 Forbidden when the current user does not own the client

Security notes

- The runtime deletes the OAuth client and the linked tenant inside a transaction.
- Deleting the client removes the isolated tenant space as well.

Common mistakes

- Deleting a client while assuming the tenant remains intact.
- Attempting to delete a client owned by another user.

Related endpoints

- `POST /api/v1/developer/clients`
- `PATCH /api/v1/developer/clients/:id`

Source

- [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)
