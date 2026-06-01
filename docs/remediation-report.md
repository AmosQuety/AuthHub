# AuthHub Documentation Remediation Report

Generated from an audit of the generated documentation against the AuthHub codebase.

## Executive Summary

The current documentation set covers the core identity flows well enough to be useful, but it is still incomplete relative to the runtime surface area. The largest gaps are in endpoint coverage, Swagger/runtime mismatches, operational behavior, and missing tutorials for important flows such as password reset, email verification, MFA, admin operations, billing, observability, and webhooks.

The source of truth for this report is the runtime code, especially:

- [backend/src/index.ts](backend/src/index.ts)
- [backend/src/modules/auth/router.ts](backend/src/modules/auth/router.ts)
- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)
- [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts)
- [backend/src/modules/oauth/router.ts](backend/src/modules/oauth/router.ts)
- [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- [backend/src/modules/oidc/router.ts](backend/src/modules/oidc/router.ts)
- [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)
- [backend/src/modules/admin/router.ts](backend/src/modules/admin/router.ts)
- [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)
- [backend/src/modules/developer/router.ts](backend/src/modules/developer/router.ts)
- [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)
- [backend/src/modules/webhooks/router.ts](backend/src/modules/webhooks/router.ts)
- [backend/src/modules/webhooks/controller.ts](backend/src/modules/webhooks/controller.ts)
- [backend/src/modules/billing/router.ts](backend/src/modules/billing/router.ts)
- [backend/src/modules/billing/webhook.ts](backend/src/modules/billing/webhook.ts)
- [backend/src/modules/observability/router.ts](backend/src/modules/observability/router.ts)
- [backend/src/modules/observability/controller.ts](backend/src/modules/observability/controller.ts)
- [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)

## Missing Documentation

### High priority gaps

1. Auth route documentation is incomplete.

The generated docs cover `register`, `login`, `refresh`, `logout`, and social login at a high level, but the code exposes many more public and authenticated auth endpoints:

- `POST /api/v1/auth/revoke`
- `POST /api/v1/auth/introspect`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/role-check`
- `PATCH /api/v1/auth/profile`
- `POST /api/v1/auth/complete-profile`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/others`
- `DELETE /api/v1/auth/sessions/:id`
- `DELETE /api/v1/auth/providers/:id`
- `POST /api/v1/auth/verify-email/send`
- `GET /api/v1/auth/verify-email/:token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `PUT /api/v1/auth/update-password`
- `POST /api/v1/auth/verify-password`

Source: [backend/src/modules/auth/router.ts](backend/src/modules/auth/router.ts) and [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)

2. Developer portal docs are incomplete.

The docs currently mention client management and stats, but the runtime supports additional behavior not fully described:

- `PATCH /api/v1/developer/clients/:id`
- `PATCH /api/v1/developer/clients/:id/tenant`
- `DELETE /api/v1/developer/clients/:id`
- `POST /api/v1/developer/clients/:id/rotate`
- `GET /api/v1/developer/stats`

Source: [backend/src/modules/developer/router.ts](backend/src/modules/developer/router.ts) and [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)

3. Admin API docs are too high level.

The current admin doc only sketches examples; the runtime exposes a much wider surface:

- `GET /api/v1/admin/search`
- `GET /api/v1/admin/clients`
- `POST /api/v1/admin/clients`
- `DELETE /api/v1/admin/clients/:id`
- `GET /api/v1/admin/users`
- `DELETE /api/v1/admin/users/:id`
- `POST /api/v1/admin/users/:id/impersonate`
- `GET /api/v1/admin/tenants`
- `POST /api/v1/admin/tenants`
- `GET /api/v1/admin/tenants/:id`
- `PATCH /api/v1/admin/tenants/:id`
- `DELETE /api/v1/admin/tenants/:id`
- `GET /api/v1/admin/settings`
- `PATCH /api/v1/admin/settings`
- `GET /api/v1/admin/root-keys`
- `POST /api/v1/admin/root-keys`
- `DELETE /api/v1/admin/root-keys/:id`
- `GET /api/v1/admin/observability/summary`
- `GET /api/v1/admin/observability/stats`
- `GET /api/v1/admin/observability/funnel`
- `GET /api/v1/admin/observability/heatmap`
- `GET /api/v1/admin/observability/risk-trends`

Source: [backend/src/modules/admin/router.ts](backend/src/modules/admin/router.ts), [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts), [backend/src/modules/observability/router.ts](backend/src/modules/observability/router.ts), [backend/src/modules/observability/controller.ts](backend/src/modules/observability/controller.ts)

4. Webhooks docs need a full operational section.

The generated docs mention webhooks, but the runtime exposes concrete management endpoints and delivery behavior that should be documented fully:

- `POST /api/v1/webhooks/mgmt`
- `GET /api/v1/webhooks/mgmt`
- `DELETE /api/v1/webhooks/mgmt/:id`
- `GET /api/v1/webhooks/mgmt/:id/deliveries`
- `POST /api/v1/billing/stripe` (raw-body Stripe webhook)

Source: [backend/src/modules/webhooks/router.ts](backend/src/modules/webhooks/router.ts), [backend/src/modules/webhooks/controller.ts](backend/src/modules/webhooks/controller.ts), [backend/src/modules/billing/router.ts](backend/src/modules/billing/router.ts), [backend/src/modules/billing/webhook.ts](backend/src/modules/billing/webhook.ts)

5. Billing docs are missing.

The code exposes authenticated billing endpoints and an unauthenticated Stripe webhook, but there is no dedicated billing guide or API reference.

Source: [backend/src/modules/billing/router.ts](backend/src/modules/billing/router.ts), [backend/src/modules/billing/controller.ts](backend/src/modules/billing/controller.ts), [backend/src/modules/billing/webhook.ts](backend/src/modules/billing/webhook.ts)

### Medium priority gaps

1. Missing tutorials for non-trivial AuthHub flows.

The current tutorial set is helpful but still incomplete. Missing tutorials include:

- Password reset flow
- Email verification flow
- MFA / step-up authentication flow
- Provider linking flow
- Admin impersonation flow
- Webhook receiver implementation
- Billing entitlement integration
- Observability/dashboard usage
- Logout from all devices
- Session management / session list UX
- Using `/auth/introspect` and `/auth/revoke`

2. Missing OIDC and OAuth examples.

The docs should include copy-paste examples for:

- A full browser authorize redirect
- Consent submission
- Refresh token rotation
- UserInfo call and claim handling
- JWKS verification using a standard library
- Handling `state` and `nonce` properly

3. Missing examples for server-side rendering and mobile.

The React, Next.js, Python, Express, and React Native guides exist, but they need stronger end-to-end examples that include callback handling, token persistence, refresh, and logout.

## Missing Endpoints

### Not documented in the generated docs but present in runtime

Authentication:
- `POST /api/v1/auth/revoke`
- `POST /api/v1/auth/introspect`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/role-check`
- `PATCH /api/v1/auth/profile`
- `POST /api/v1/auth/complete-profile`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/others`
- `DELETE /api/v1/auth/sessions/:id`
- `DELETE /api/v1/auth/providers/:id`
- `POST /api/v1/auth/verify-email/send`
- `GET /api/v1/auth/verify-email/:token`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `PUT /api/v1/auth/update-password`
- `POST /api/v1/auth/verify-password`

Developer:
- `PATCH /api/v1/developer/clients/:id`
- `PATCH /api/v1/developer/clients/:id/tenant`

Admin:
- `GET /api/v1/admin/search`
- `GET /api/v1/admin/observability/*`
- `GET /api/v1/admin/root-keys`
- `POST /api/v1/admin/root-keys`
- `DELETE /api/v1/admin/root-keys/:id`

Webhooks / Billing:
- `POST /api/v1/webhooks/mgmt`
- `GET /api/v1/webhooks/mgmt`
- `DELETE /api/v1/webhooks/mgmt/:id`
- `GET /api/v1/webhooks/mgmt/:id/deliveries`
- `POST /api/v1/billing/stripe`
- `GET /api/v1/billing/status`
- `POST /api/v1/billing/checkout-session`
- `POST /api/v1/billing/customer-portal`

Observability:
- `GET /api/v1/admin/observability/summary`
- `GET /api/v1/admin/observability/stats`
- `GET /api/v1/admin/observability/funnel`
- `GET /api/v1/admin/observability/heatmap`
- `GET /api/v1/admin/observability/risk-trends`

## Undocumented Behaviors

1. Refresh-token rotation is stricter than the docs currently imply.

The runtime does more than issue a new token:

- It verifies the refresh JWT signature.
- It checks the session record exists and is unexpired.
- It compares the presented refresh token against the stored Argon2 hash.
- If replay is detected, it revokes all sessions for that user.

Source: [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)

2. Login can return MFA-required responses instead of a token payload.

The generated docs do not mention that successful password verification can still return:

- `{ status: "mfa_required", mfa_token, message }`

This occurs when the user has enabled MFA or the risk score is elevated.

Source: [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)

3. Login is risk-based.

The login controller applies an adaptive risk engine. High-risk logins can be blocked entirely, and medium-risk logins can require MFA.

Source: [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts), [backend/src/core/riskEngine.ts](backend/src/core/riskEngine.ts)

4. `me` response is richer than the current docs imply.

`GET /api/v1/auth/me` returns computed fields such as:

- `hasPassword`
- `mfaEnabled`
- `clientCount`
- `providers`
- `sid`

Source: [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)

5. OAuth authorize flow is two-step and frontend-mediated.

The current docs imply a more direct server-side redirect than the actual flow. Runtime behavior is:

- `GET /oauth/authorize` redirects to the frontend authorization UI.
- The frontend posts consent back to `POST /oauth/authorize`.
- The server returns a redirect URL containing the authorization code instead of redirecting directly in the backend flow.

Source: [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)

6. Social login has auto-tenant provisioning and account-linking logic.

This behavior should be explicitly documented because it changes onboarding and tenant creation semantics:

- If no user is found and no tenant is resolved, a new tenant is created automatically.
- `mode=link` can attach a provider to an existing user.
- The provider `state` carries `client_id`, `mode`, and `user_id`.

Source: [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts)

7. Webhook endpoints are tenant-scoped.

The docs should note that webhook management APIs are filtered by `req.user.tenantId`.

Source: [backend/src/modules/webhooks/controller.ts](backend/src/modules/webhooks/controller.ts)

8. Developer client creation returns secrets only once.

This is important and should be repeated in the docs everywhere client creation is shown.

Source: [backend/src/modules/developer/controller.ts](backend/src/modules/developer/controller.ts)

## Swagger / OpenAPI Mismatches

1. JWKS path mismatch.

- OpenAPI documents `/oidc/jwks`.
- Runtime serves `GET /api/v1/oidc/.well-known/jwks.json`.

Source mismatch:
- [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)
- [backend/src/modules/oidc/router.ts](backend/src/modules/oidc/router.ts)
- [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)

2. OAuth authorize flow mismatch.

- OpenAPI documents only `GET /oauth/authorize` and describes it as a redirect to consent page or redirect URI.
- Runtime also exposes `POST /oauth/authorize` for consent submission and uses a frontend-mediated redirect URL flow.

Source mismatch:
- [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)
- [backend/src/modules/oauth/router.ts](backend/src/modules/oauth/router.ts)
- [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)

3. Token response schema mismatch.

- OpenAPI uses `accessToken` / `refreshToken` camelCase in `TokenResponse`.
- Runtime returns `access_token`, `refresh_token`, `token_type`, `expires_in`, and `id_token` in OAuth token responses.
- `POST /api/v1/auth/login` returns `accessToken` in a different shape again.

Source mismatch:
- [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)
- [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)

4. Discovery document mismatch.

The runtime discovery document points `jwks_uri` at the `.well-known` path, while the OpenAPI coverage does not reflect that correctly and the docs use inconsistent path naming.

Source:
- [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)
- [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)

5. OpenAPI coverage is far narrower than runtime.

The generated docs currently mirror the OpenAPI file too closely, but the runtime exposes many more endpoints. This means the docs should be based on code, not spec alone.

## Security Gaps

1. Refresh token security details need a clearer warning.

The docs should explicitly say that replay detection can revoke all sessions for a user. That is a material behavior and should be documented for production operators.

2. Cookie security should be described precisely.

Current docs should specify where the runtime uses `SameSite=Lax` versus `SameSite=Strict`, and that `accessToken` is intentionally non-HttpOnly in social login flows for frontend handoff.

Source: [backend/src/modules/auth/social.ts](backend/src/modules/auth/social.ts), [backend/src/modules/auth/controller.ts](backend/src/modules/auth/controller.ts)

3. Admin endpoints need stronger security documentation.

The generated admin docs do not explain that the entire admin API is protected by `authenticate` plus `requireRole("ADMIN")`, and that impersonation emits an `act` claim and sends an email notification.

Source: [backend/src/modules/admin/router.ts](backend/src/modules/admin/router.ts), [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts), [backend/src/core/crypto.ts](backend/src/core/crypto.ts)

4. Webhook signature verification should be documented.

Stripe webhooks require raw-body signature verification. This is an important production detail and should be called out in the docs.

Source: [backend/src/modules/billing/webhook.ts](backend/src/modules/billing/webhook.ts), [backend/src/index.ts](backend/src/index.ts)

5. Root API key handling is undocumented.

The runtime includes `RootApiKey` management for privileged automation, but the docs do not mention it. This is a security-sensitive surface.

Source: [backend/prisma/schema.prisma](backend/prisma/schema.prisma), [backend/src/modules/admin/controller.ts](backend/src/modules/admin/controller.ts)

## Missing Tutorials

The generated tutorials should be expanded with full end-to-end examples for:

- Password reset
- Email verification
- MFA challenge and verification
- Provider linking and unlinking
- Logout across all devices
- Admin impersonation
- Webhook receiver implementation
- Billing entitlement sync with Stripe
- Observability dashboards and login risk trends
- Token revocation and introspection

## Missing Examples

The docs should include copy-paste-ready examples for:

- `/api/v1/auth/revoke`
- `/api/v1/auth/introspect`
- `/api/v1/auth/verify-email/send`
- `/api/v1/auth/forgot-password`
- `/api/v1/auth/reset-password`
- `/api/v1/auth/update-password`
- `/api/v1/auth/verify-password`
- `/api/v1/developer/clients/:id/rotate`
- `/api/v1/admin/users/:id/impersonate`
- `/api/v1/webhooks/mgmt`
- `/api/v1/billing/stripe`
- `/api/v1/billing/status`
- OIDC JWKS verification
- OAuth `state` and `nonce` handling

## Recommended Remediation Plan

### Phase 1: Critical documentation completion

- Add full auth endpoint reference pages for every route in `backend/src/modules/auth/router.ts`.
- Add full admin reference pages, including observability and root keys.
- Add webhooks and billing docs.
- Expand OAuth and OIDC docs to cover actual runtime behavior and response payloads.

### Phase 2: Tutorial and example expansion

- Add step-by-step tutorials for password reset, email verification, MFA, provider linking, and admin impersonation.
- Add concrete examples for Stripe webhook handling and entitlement sync.
- Add server-side and client-side examples for token refresh, logout, and token introspection.

### Phase 3: Swagger and docs reconciliation

- Update `backend/src/docs/openapi.ts` to match runtime behavior.
- Decide whether to keep snake_case or camelCase in docs, then normalize examples and schemas.
- Correct JWKS and authorize endpoint descriptions.

### Phase 4: Security hardening notes

- Document session replay revocation behavior.
- Document cookie modes and the social-login handoff flow.
- Document the admin impersonation risk model and audit trail.
- Document raw-body requirements for Stripe webhook verification.

## Conclusion

The documentation is a good start, but it is not yet production-complete. The highest-value fixes are to document the full route surface, reconcile OpenAPI mismatches, and add the missing operational tutorials and security details. After those changes, the docs will be much closer to a true source-of-truth portal for developers and AI agents.
