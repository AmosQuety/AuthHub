# OpenAPI Reconciliation

This page records the differences between the runtime implementation, the OpenAPI document, and the generated portal so the documentation can remain source-of-truth aligned.

## Runtime vs OpenAPI differences

JWKS path

- OpenAPI documents a JWKS path that does not match the running server.
- Runtime path: `GET /api/v1/oidc/.well-known/jwks.json`
- OpenAPI path mismatch: `/oidc/jwks`

OAuth authorize flow

- OpenAPI shows only a GET authorize endpoint.
- Runtime includes both GET redirect behavior and a POST consent submission endpoint.

Token response format

- OpenAPI uses camelCase token field names in its reusable schema.
- Runtime token endpoints return snake_case OAuth fields and additional `id_token` values.

## Runtime vs Swagger differences

- Swagger UI is generated from the in-repo OpenAPI object, so the mismatches above also appear in the browser docs.
- The portal documentation in `docs/` should describe runtime behavior, even when that differs from Swagger.

## Recommended fixes

- Update the OpenAPI document to include the POST consent flow.
- Correct the JWKS path in the OpenAPI document.
- Align response schemas so the OAuth token endpoint and local login endpoint are documented separately.
- Add explicit notes for frontend-mediated authorize flow and state handling.

## Endpoint mismatches to track

- `/api/v1/oidc/.well-known/jwks.json` vs `/oidc/jwks`
- `GET /oauth/authorize` vs `GET + POST /oauth/authorize`
- `access_token` / `refresh_token` vs `accessToken` / `refreshToken`

## Schema mismatches to track

- Local login responses versus OAuth token responses
- OIDC discovery `jwks_uri` path alignment
- Developer client secret response is one-time only and should be called out separately

Sources

- [backend/src/docs/openapi.ts](backend/src/docs/openapi.ts)
- [backend/src/modules/oauth/controller.ts](backend/src/modules/oauth/controller.ts)
- [backend/src/modules/oidc/controller.ts](backend/src/modules/oidc/controller.ts)
