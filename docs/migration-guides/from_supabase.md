# Migration Guide — From Supabase Auth to AuthHub

Feature mapping

- Supabase `users` → AuthHub `User`
- Supabase `oauth` providers → AuthHub `AuthProvider`
- Supabase refresh/session model → AuthHub `Session` and refresh token rotation

Checklist

1. Export users and map fields to AuthHub schema. Re-hash passwords or require reset.
2. Recreate applications as `OAuthClient` records.
3. Update applications to use AuthHub OIDC discovery and token endpoints.

Notes

- Supabase stores hashed passwords; migration may require a password reset depending on algorithm compatibility.