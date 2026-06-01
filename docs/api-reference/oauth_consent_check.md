# GET /api/v1/oauth/consent-check

Purpose

Check whether the authenticated user has previously granted the requested scopes to a given OAuth client.

Request

- Method: GET
- URL: `/api/v1/oauth/consent-check?client_id=CLIENT&scope=openid%20email`
- Authorization: Bearer access token (user must be authenticated)

Response

- 200 OK
  - Example when consent required:

```json
{ "consentRequired": true }
```

- 200 OK when previously granted and covers scopes:

```json
{ "consentRequired": false, "previouslyGrantedScopes": ["openid", "email"] }
```

Errors

- 401 Unauthorized — user not authenticated
- 400 invalid_request — missing `client_id`

Implementation notes

- Consent records are stored in `user_consents` table and are retrieved via Prisma in `backend/src/modules/oauth/controller.ts`.
- The endpoint computes whether the previously granted scopes cover the currently requested scopes.

Related endpoints

- `POST /api/v1/oauth/authorize` — will create or update a consent on consent submission.