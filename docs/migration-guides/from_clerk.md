# Migration Guide — From Clerk to AuthHub

Feature mapping

- Clerk's users → AuthHub `User` records
- Clerk sessions → AuthHub `Session` model
- Clerk OAuth connections → AuthHub `AuthProvider`

Checklist

1. Export users from Clerk and import into AuthHub `users` table. Consider forcing password resets if password hashing formats differ.
2. Recreate registered OAuth apps as `OAuthClient` records in AuthHub via the Developer API.
3. Recreate webhooks and configure tenant SMTP if necessary.
4. Update client apps to use AuthHub endpoints (`/oauth/authorize`, `/oauth/token`, OIDC discovery).

Notes

- Clerk provides built-in session management; when migrating, ensure session semantics match AuthHub's refresh rotation model.
- Map Clerk claims to AuthHub token claims as needed by adjusting token generation logic in `backend/src/core/crypto.ts`.