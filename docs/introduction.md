# Introduction

What AuthHub is

AuthHub is a production-grade Auth-as-a-Service platform that implements modern authentication, OAuth 2.0, and OpenID Connect (OIDC) for applications and APIs. It provides developer-facing APIs for user registration, session management, OAuth authorization (PKCE), OIDC discovery/JWKS/UserInfo, social logins (Google, GitHub), tenanting, audit logging, and operational tooling.

Why AuthHub exists

Auth is hard to get right. AuthHub centralizes secure authentication and authorization primitives so teams can integrate identity quickly without building and maintaining complex security systems. It emphasizes security best practices such as Argon2 password hashing, RS256-signed JWTs, PKCE, refresh-token rotation, and per-tenant configuration.

Core concepts

- Account: a `User` in the system (see [backend/prisma/schema.prisma](backend/prisma/schema.prisma)).
- Session: server-side persisted session stored in `sessions` (refresh token hashed) used for refresh token rotation.
- OAuth Client: registered application (`OAuthClient`) with `clientId` and optional `clientSecretHash`.
- Authorization Code: short-lived code stored in Redis produced during the OAuth authorize flow.
- Access Token: RS256 JWT (15 minutes) used to authenticate API requests.
- Refresh Token: RS256 JWT (7 days) used to rotate sessions and obtain new access tokens.
- ID Token: OIDC JWT issued during authorization for identity claims.

Key features

- Local email/password registration and login.
- Social login integrations: Google and GitHub (see `backend/src/modules/auth/social.ts`).
- OAuth 2.0 Authorization Code flow with PKCE and consent management.
- OIDC discovery, JWKS, and UserInfo endpoints.
- Refresh token rotation and session revocation.
- Per-tenant configuration and white-labeling support.
- Prisma-based PostgreSQL schema and Redis-backed short-lived artifacts.

Security model

- Passwords hashed with Argon2 and an optional server-side PEPPER (`ARGON2_PEPPER`). See [backend/src/core/crypto.ts](backend/src/core/crypto.ts).
- JWTs signed with RS256 using `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`; public keys served via JWKS with stable `kid` (JWK thumbprint).
- PKCE enforced for authorization code flows (only `S256` supported).
- Refresh token rotation: refresh tokens are JWTs bound to a `sid` and stored hashed in DB; rotation creates a new session and deletes the old one.

Supported standards

- OAuth 2.0 (authorization code with PKCE, refresh token grant)
- OpenID Connect (discovery, ID Token, UserInfo, JWKS)
- JWT (RS256), JWK/JWKS

Typical use cases

- Add login/registration to web & mobile apps quickly.
- Implement third-party OAuth integrations for delegated access.
- Use as identity provider for internal APIs and services.
- Provide multi-tenant authentication with per-tenant branding and SMTP.

Source code references

- Entry point: [backend/src/index.ts](backend/src/index.ts)
- OpenAPI spec: [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)
- Prisma schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- Crypto primitives: [backend/src/core/crypto.ts](backend/src/core/crypto.ts)
- OAuth controller: [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- OIDC controller: [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)
- Social login: [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts)

This documentation is implementation-driven and mirrors AuthHub's runtime behavior. Where the OpenAPI spec differs from runtime behavior, the runtime code is authoritative and will be documented as such.