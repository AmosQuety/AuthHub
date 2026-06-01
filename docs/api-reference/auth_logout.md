# POST /api/v1/auth/logout

Purpose

Revoke the currently authenticated session and clear any authentication cookies.

Description

Invalidates the session associated with the current refresh token or authenticated access token. Removes server-side `Session` record and clears `refreshToken` and `accessToken` cookies when applicable.

Request

- Method: POST
- URL: `/api/v1/auth/logout`
- Authorization: Access token (Bearer) or cookie-based session

Responses

- 200 OK
  - Body: `{ "message": "Logged out successfully" }`

Implementation notes

- The API will identify the session via token `sid` or refresh cookie and remove the corresponding `Session` record from the database.
- For cookie-based flows, the server will clear the `refreshToken` cookie and any handover `accessToken` cookie.

Security considerations

- Clients should also remove any client-side stored tokens.
- Consider logging logout events to `audit_logs` for forensic traceability.

Related endpoints

- `POST /api/v1/auth/revoke` (if present) — revoke tokens programmatically.
- `DELETE /api/v1/sessions/:id` — delete specific session (admin or user endpoints).