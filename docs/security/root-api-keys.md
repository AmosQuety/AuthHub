# Root API Keys

Root API keys are privileged credentials used for automation and administrative tasks.

Lifecycle

- Create via `POST /api/v1/admin/root-keys`.
- View only metadata via `GET /api/v1/admin/root-keys`.
- Revoke via `DELETE /api/v1/admin/root-keys/:id`.
- The raw key is shown only once at creation time.

Security notes

- Store root API keys in a secrets manager.
- Rotate them regularly.
- Audit their use and revocation.

Source

- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
