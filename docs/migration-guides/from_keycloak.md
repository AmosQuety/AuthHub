# Migration Guide — From Keycloak to AuthHub

Feature mapping

- Keycloak realms → AuthHub tenants
- Keycloak clients → AuthHub `OAuthClient`
- Keycloak user federation → import users to AuthHub `User` table

Checklist

1. Export user data from Keycloak (CSV or Admin API).
2. Map realms to `Tenant` records and clients to `OAuthClient` entries.
3. Recreate roles and map them to AuthHub `roles` or entitlement scopes.
4. Update application configuration to use AuthHub OIDC discovery and JWKS.

Notes

- Keycloak supports extensive customization (mappings, mappers); replicate needed claims during token generation in `backend/src/core/crypto.ts`.
- Test SSO and logout flows thoroughly.