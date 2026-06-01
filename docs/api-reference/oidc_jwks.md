# GET /api/v1/oidc/.well-known/jwks.json

Purpose

Return the JSON Web Key Set containing AuthHub's public keys for verifying RS256 signatures.

Response example

```json
{
  "keys": [
    {
      "kty": "RSA",
      "n": "...",
      "e": "AQAB",
      "alg": "RS256",
      "use": "sig",
      "kid": "<jwk-thumbprint>"
    }
  ]
}
```

Notes

- `kid` is computed using the JWK thumbprint (RFC 7638) to provide a stable key id.
- Implementation: `backend/src/modules/oidc/controller.ts` uses `core.getPublicJwk()`.

Cache headers

- JWKS responses are cacheable for an hour with stale-while-revalidate semantics per implementation.

Key rotation

- When rotating keys, ensure the new key appears in JWKS and keep old keys available until existing tokens signed with them expire.

Security

- Clients should fetch JWKS and cache it; on `kid` mismatch, re-fetch JWKS before rejecting tokens.