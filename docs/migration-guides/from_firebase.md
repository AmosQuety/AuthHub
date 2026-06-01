# Migration Guide — From Firebase Auth to AuthHub

Feature mapping

- Firebase users → AuthHub `User` records
- Social providers → AuthHub `AuthProvider` entries

Checklist

1. Export users from Firebase (use `auth:export`).
2. Import users into AuthHub, re-hash passwords or force password reset if necessary.
3. Reconfigure client apps to use AuthHub endpoints.
4. Migrate custom claims to AuthHub token generation logic if needed.

Notes

- Firebase uses different password hashing; for security, require password resets on first login or implement a migration shim.
- Keep audit logs of migration actions.