# Glossary

- Access Token: A short-lived JWT used to access protected APIs. In AuthHub it's RS256-signed and expires in 15 minutes.
- Refresh Token: A long-lived JWT used to obtain new access tokens; stored hashed in the `sessions` table and rotated on use.
- ID Token: An OpenID Connect JWT containing identity claims about the authenticated user.
- Authorization Code: A single-use short-lived code used in the OAuth authorization code flow; stored in Redis in AuthHub.
- PKCE: Proof Key for Code Exchange — a mitigation for public clients which binds the authorization code to a `code_verifier`.
- JWKS: JSON Web Key Set — publishes public keys for verifying JWTs.
- JWK thumbprint (kid): Deterministic identifier for the JWK used as `kid` in JWT headers.
- Client (OAuth): The application registered to use AuthHub's OAuth endpoints. Represented by `OAuthClient` in the database.
- Confidential Client: OAuth client with `clientSecret` (server-based app).
- Public Client: OAuth client without a secret (single-page or mobile app).
- Tenant: A logical grouping (organization) used for multi-tenant deployments.
- Consent: A record of user-approved scopes for an OAuth client (stored in `user_consents`).
- Session ID (sid): Identifier stored in tokens to bind tokens to a server-side session.

This glossary maps terms to AuthHub's implementation specifics. For code-level references see `backend/prisma/schema.prisma` and the modules under `backend/src/modules/`.