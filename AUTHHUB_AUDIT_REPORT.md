# AuthHub Performance Audit Report
**Date:** 2026-04-22
**Audited by:** GitHub Copilot (GPT-5.3-Codex)
**Codebase:** AuthHub v1.0.0 (Node.js / Express / TypeScript / Prisma / PostgreSQL / Redis)

---

## Executive Summary

AuthHub has a solid baseline for security-oriented architecture (graceful shutdown, Redis-backed rate limiting, RS256 key caching, and Docker multi-stage builds), but there are several production-scale performance gaps in hot auth and OIDC paths. The largest risk is database scaling pressure from missing Prisma/PostgreSQL indexes on high-cardinality lookup and sort paths used by sessions and audit analytics. The second major risk is cache-control correctness on token and OIDC metadata endpoints, where missing headers can create both performance inconsistency and security regression in intermediaries. Redis is used effectively in many paths, but client resiliency and key strategy need tightening. Estimated effort for full optimization is moderate: about 2-3 weeks across phased hardening, schema/index work, and endpoint response/caching improvements.

---

## Overall Score

| Category | Score | Top Finding |
|---|---|---|
| Event Loop & Concurrency | 6/10 | Token issuance path performs DB entitlement lookup on every sign operation in hot path. |
| Express Middleware & Routing | 6/10 | No global compression and missing dedicated rate limit for introspection/revocation endpoints. |
| Prisma & PostgreSQL | 4/10 | No explicit secondary indexes (`@@index`) in schema for frequent auth/session/audit filters. |
| Redis Usage | 6/10 | Redis client lacks bounded retry/backoff and autopipelining tuning for unstable network periods. |
| Auth-Specific Performance | 5/10 | Session creation and refresh hash update are multi-step and non-atomic in core token issuance flows. |
| API Response Optimization | 4/10 | OIDC metadata and token-bearing responses are missing explicit cache headers (`no-store` / public TTLs). |
| TypeScript Build & Dependencies | 7/10 | Build config misses incremental/isolated module settings; one type package is in runtime deps. |
| Monitoring & CI | 5/10 | Health endpoint checks DB only; CI has no latency/perf gate for auth hot paths. |
| **Overall** | **5.4/10** | |

---

## What's Already Good

- ✅ `backend/src/index.ts:201` — Graceful shutdown hooks for `SIGTERM`/`SIGINT` are implemented and `prisma.$disconnect()` is called before process exit.
- ✅ `backend/src/middlewares/rateLimiter.ts:12` — Rate limiting is Redis-backed (`rate-limit-redis` store), which is multi-instance safe.
- ✅ `backend/src/core/crypto.ts:56` — JWT private/public keys are imported once and cached in module scope, avoiding per-request key parsing overhead.
- ✅ `backend/prisma/schema.prisma:19` — Primary IDs consistently use `@db.Uuid`, which is appropriate for Postgres UUID storage.
- ✅ `backend/.github/workflows/ci.yml:25` — CI runs `npx tsc --noEmit` as a separate type-check stage.

---

## Findings

### Event Loop & Concurrency

---

#### Finding 1: DB Lookup In Token Signing Hot Path
**Severity:** 🟠 HIGH
**File:** `backend/src/core/crypto.ts` (Line 89-103)
**Impact:** `generateTokens()` runs for login, refresh, OAuth code exchange, and passkey flows; doing a DB query per call adds avoidable latency and DB load at peak auth throughput.

**Current code:**
```typescript
export const generateTokens = async (userId: string, sessionId: string, scopes: string[] = [], roles: string[] = ["USER"], name?: string | null, impersonatorId?: string) => {
  const key = await getPrivateKey();
  const kid = await getKeyId();
  const issuer = process.env.BASE_URL || "http://localhost:3000";

  // Feature 1: Entitlement Sync. Automatically append active billing plans to scopes.
  const entitlements = await prisma.entitlement.findMany({
    where: { userId, status: "active" },
    select: { planId: true }
  });
```

**Recommended fix:**
```typescript
// Keep token signing CPU/lightweight by passing entitlements in from caller,
// or cache active plan scopes in Redis with short TTL and invalidate on billing webhooks.
export const generateTokens = async (
  userId: string,
  sessionId: string,
  scopes: string[] = [],
  roles: string[] = ["USER"],
  name?: string | null,
  impersonatorId?: string,
  entitlementScopes: string[] = []
) => {
  const key = await getPrivateKey();
  const kid = await getKeyId();
  const issuer = process.env.BASE_URL || "http://localhost:3000";

  const finalScopes = Array.from(new Set([...scopes, ...entitlementScopes]));
  // ...sign tokens without DB query in this function
};
```

**References:** Performance Bible §16.1 — Event Loop Hot Paths

---

#### Finding 2: Synchronous Console Error Logging In Global Error Path
**Severity:** 🟡 MEDIUM
**File:** `backend/src/middlewares/errorHandler.ts` (Line 3-5)
**Impact:** Under burst error conditions, synchronous console logging in the global error path can increase tail latency and block useful work on the main thread.

**Current code:**
```typescript
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
```

**Recommended fix:**
```typescript
import pino from "pino";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err, path: req.path, method: req.method }, "request_failed");
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ status: "error", statusCode, message });
};
```

**References:** Performance Bible §16.4 — Logging Overhead and Backpressure

---

### Express Middleware & Routing

---

#### Finding 3: Compression Middleware Missing On API Stack
**Severity:** 🟠 HIGH
**File:** `backend/src/index.ts` (Line 73-80)
**Impact:** JSON-heavy responses are sent uncompressed, increasing bandwidth and response times for metadata and analytics endpoints.

**Current code:**
```typescript
app.use(cookieParser());

// Webhooks must be mounted before expressive.json() so Stripe can read the raw buffer
app.use("/api/v1/webhooks", billingRouter);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

**Recommended fix:**
```typescript
import compression from "compression";

app.use(cookieParser());

// Do not compress webhook route that depends on raw request body
app.use(
  compression({
    filter: (req, res) => {
      if (req.path.startsWith("/api/v1/webhooks")) return false;
      return compression.filter(req, res);
    },
  })
);

app.use("/api/v1/webhooks", billingRouter);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
```

**References:** Performance Bible §11.1 — Transport Compression Strategy

---

#### Finding 4: Introspection/Revocation Endpoints Not Independently Rate Limited
**Severity:** 🟡 MEDIUM
**File:** `backend/src/modules/auth/router.ts` (Line 23-24)
**Impact:** Attackers can hammer introspection/revocation endpoints to amplify JWT verification work and reduce auth service availability.

**Current code:**
```typescript
// --- OAuth 2.0 Token Management ---
router.post("/revoke", revokeToken);
router.post("/introspect", introspectToken);
```

**Recommended fix:**
```typescript
import { introspectLimiter, revokeLimiter } from "../../middlewares/rateLimiter.js";

router.post("/revoke", revokeLimiter, revokeToken);
router.post("/introspect", introspectLimiter, introspectToken);
```

**References:** Performance Bible §12.3 — Endpoint-Sensitive Throttling

---

### Prisma & PostgreSQL

---

#### Finding 5: Missing Secondary Indexes On Core Auth Tables
**Severity:** 🔴 CRITICAL
**File:** `backend/prisma/schema.prisma` (Line 42-88)
**Impact:** Session and audit queries will degrade into expensive scans as data grows, directly impacting login/refresh/analytics latency and DB CPU.

**Current code:**
```prisma
model Session {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @db.Uuid @map("user_id")
  refreshTokenHash  String   @map("refresh_token_hash")
  deviceInfo        String?  @map("device_info")
  ipAddress         String?  @map("ip_address")
  familyId          String?  @map("family_id")
  riskScore         Int?     @map("risk_score")
  expiresAt         DateTime @map("expires_at")
  createdAt         DateTime @default(now()) @map("created_at")
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String?  @db.Uuid @map("user_id")
  action    String
  ipAddress String?  @map("ip_address")
  status    String
  createdAt DateTime @default(now()) @map("created_at")
  @@map("audit_logs")
}
```

**Recommended fix:**
```prisma
model Session {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @db.Uuid @map("user_id")
  refreshTokenHash  String   @map("refresh_token_hash")
  deviceInfo        String?  @map("device_info")
  ipAddress         String?  @map("ip_address")
  familyId          String?  @map("family_id")
  riskScore         Int?     @map("risk_score")
  expiresAt         DateTime @map("expires_at")
  createdAt         DateTime @default(now()) @map("created_at")
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, expiresAt])
  @@index([expiresAt])
  @@map("sessions")
}

model AuditLog {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String?  @db.Uuid @map("user_id")
  action    String
  ipAddress String?  @map("ip_address")
  status    String
  createdAt DateTime @default(now()) @map("created_at")

  @@index([userId, createdAt(sort: Desc)])
  @@index([action, createdAt(sort: Desc)])
  @@index([status, createdAt(sort: Desc)])
  @@map("audit_logs")
}
```

**References:** Performance Bible §7.2 — Indexing for Auth Workloads

---

#### Finding 6: App-Side Aggregation For Risk Trend Analytics
**Severity:** 🟡 MEDIUM
**File:** `backend/src/modules/observability/controller.ts` (Line 113-137)
**Impact:** Fetching raw rows and bucketing in Node inflates memory and transfer costs under growing audit volume.

**Current code:**
```typescript
const logs = await prisma.auditLog.findMany({
  where: {
    createdAt: { gte: since },
    action: { in: ["LOGIN_ATTEMPT", "LOGIN_SUCCESS", "LOGIN_FAILED", "MFA_FAILED"] },
  },
  select: {
    createdAt: true,
    status: true,
  }
});
```

**Recommended fix:**
```typescript
const rows = await prisma.$queryRaw<Array<{ day: string; status: string; count: number }>>`
  SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
         status,
         COUNT(*)::int AS count
  FROM audit_logs
  WHERE created_at >= ${since}
    AND action IN ('LOGIN_ATTEMPT','LOGIN_SUCCESS','LOGIN_FAILED','MFA_FAILED')
  GROUP BY 1,2
`;
```

**References:** Performance Bible §8.5 — Push Aggregation To Database

---

#### Finding 7: Migrations Lack Production-Safe Concurrent Index Strategy
**Severity:** 🟠 HIGH
**File:** `backend/prisma/migrations/20260310164820_init/migration.sql` (Line 34), `backend/prisma/migrations/20260311182102_add_advanced_auth_models/migration.sql` (Line 47)
**Impact:** Standard index DDL in large production tables can take heavyweight locks and impact write availability during deploy windows.

**Current code:**
```sql
-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_providers_provider_provider_id_key" ON "auth_providers"("provider", "provider_id");
```

**Recommended fix:**
```sql
-- Use raw SQL migrations for large-table index changes in production:
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS users_email_key
  ON users (email);

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS auth_providers_provider_provider_id_key
  ON auth_providers (provider, provider_id);
```

**References:** Performance Bible §7.8 — Online Index Creation

---

### Redis Usage

---

#### Finding 7: Redis Client Missing Production Retry/Backoff Tuning
**Severity:** 🟡 MEDIUM
**File:** `backend/src/db/redis.ts` (Line 12-19)
**Impact:** During transient Redis/network failures, default behavior can increase request latency and retry storms.

**Current code:**
```typescript
const redis = new Redis(redisUrl);

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});
```

**Recommended fix:**
```typescript
const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  enableAutoPipelining: true,
  retryStrategy(times) {
    return Math.min(times * 100, 2000);
  },
});

redis.on("error", (err) => logger.error({ err }, "redis_error"));
await redis.connect();
```

**References:** Performance Bible §9.3 — Redis Client Resilience

---

#### Finding 8: Redis Key Prefixing Is Inconsistent Across Auth Caches
**Severity:** 🟢 LOW
**File:** `backend/src/middlewares/rateLimiter.ts` (Line 93-94), `backend/src/modules/auth/controller.ts` (Line 194), `backend/src/modules/oauth/controller.ts` (Line 172)
**Impact:** Mixed key naming (`brute:*`, `lock:*`, `user:*`, `auth_code:*`) complicates operations, scanning, and memory policy enforcement.

**Current code:**
```typescript
const FAIL_KEY = (email: string) => `brute:${email.toLowerCase()}`;
const LOCK_KEY = (email: string) => `lock:${email.toLowerCase()}`;

await redis.setex(`user:${user.id}:profile`, 3600, JSON.stringify({ ... }));
await redis.setex(`auth_code:${code}`, 600, data);
```

**Recommended fix:**
```typescript
const NS = "authhub";
const FAIL_KEY = (email: string) => `${NS}:bruteforce:${email.toLowerCase()}`;
const LOCK_KEY = (email: string) => `${NS}:lockout:${email.toLowerCase()}`;
const USER_PROFILE_KEY = (userId: string) => `${NS}:user:profile:${userId}`;
const AUTH_CODE_KEY = (code: string) => `${NS}:oauth:auth_code:${code}`;
```

**References:** Performance Bible §9.1 — Cache Key Design and Operability

---

### Auth-Specific Performance

---

#### Finding 9: Token Issuance Uses Non-Atomic Session Create/Update Sequence
**Severity:** 🟠 HIGH
**File:** `backend/src/modules/auth/controller.ts` (Line 180-191), `backend/src/modules/oauth/controller.ts` (Line 273-296)
**Impact:** If hash/update fails after session create, stale `pending` session records remain and consistency breaks under partial failures.

**Current code:**
```typescript
const session = await prisma.session.create({
  data: sessionPayload,
});

const { accessToken, refreshToken } = await generateTokens(user.id, session.id, [], user.roles, user.name);

const refreshTokenHash = await hashPassword(refreshToken);
await prisma.session.update({
  where: { id: session.id },
  data: { refreshTokenHash },
});
```

**Recommended fix:**
```typescript
const result = await prisma.$transaction(async (tx) => {
  const session = await tx.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: "pending",
      expiresAt,
      deviceInfo,
      ipAddress,
      riskScore,
    },
  });

  const { accessToken, refreshToken } = await generateTokens(user.id, session.id, scopes, user.roles, user.name);
  const refreshTokenHash = await hashPassword(refreshToken);

  await tx.session.update({
    where: { id: session.id },
    data: { refreshTokenHash },
  });

  return { session, accessToken, refreshToken };
});
```

**References:** Performance Bible §15.2 — Atomicity In Token/Session Lifecycles

---

#### Finding 10: Authorization Code TTL Is Too Long For High-Security OIDC Flow
**Severity:** 🟡 MEDIUM
**File:** `backend/src/modules/oauth/controller.ts` (Line 172)
**Impact:** 10-minute code lifetime increases replay window and stale cache footprint; most OIDC deployments use ~60-120 seconds.

**Current code:**
```typescript
await redis.setex(`auth_code:${code}`, 600, data);
```

**Recommended fix:**
```typescript
// Short-lived auth codes reduce replay risk and memory churn
await redis.setex(`authhub:oauth:auth_code:${code}`, 60, data);
```

**References:** Performance Bible §15.4 — OAuth Authorization Code Hygiene

---

#### Finding 11: WebAuthn Credential Material Stored As Delimited String
**Severity:** 🟡 MEDIUM
**File:** `backend/prisma/schema.prisma` (Line 108), `backend/src/modules/passkey/controller.ts` (Line 118-123, 237-238)
**Impact:** Storing credential material in concatenated text increases parsing cost and schema fragility; binary fields are more efficient and safer for key material.

**Current code:**
```prisma
model MfaMethod {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid @map("user_id")
  type      String
  secret    String   // TOTP secret or WebAuthn public key/credential ID
  enabled   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")
}
```

```typescript
const publicKeyStr = isoBase64URL.fromBuffer(credential.publicKey);
const secret = `${credentialIdStr}:${publicKeyStr}:${credential.counter}`;
```

**Recommended fix:**
```prisma
model MfaMethod {
  id               String   @id @default(uuid()) @db.Uuid
  userId           String   @db.Uuid @map("user_id")
  type             String
  totpSecret       String?  @map("totp_secret")
  credentialId     Bytes?   @map("credential_id")
  credentialPubKey Bytes?   @map("credential_pub_key")
  credentialCount  Int?     @map("credential_count")
  enabled          Boolean  @default(false)
  createdAt        DateTime @default(now()) @map("created_at")
}
```

```typescript
await prisma.mfaMethod.create({
  data: {
    userId,
    type: "webauthn",
    credentialId: isoBase64URL.toBuffer(credential.id),
    credentialPubKey: credential.publicKey,
    credentialCount: credential.counter,
    enabled: true,
  },
});
```

**References:** Performance Bible §15.6 — WebAuthn Data Modeling

---

### API Response Optimization

---

#### Finding 12: OIDC Discovery/JWKS Endpoints Missing Explicit Cache Headers
**Severity:** 🟠 HIGH
**File:** `backend/src/modules/oidc/controller.ts` (Line 9, 15-33)
**Impact:** Read-heavy metadata endpoints are recomputed/served without explicit cache policy, reducing CDN/browser cache efficiency.

**Current code:**
```typescript
export const getJwks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jwk = await getPublicJwk();
    res.json({ keys: [{ ...jwk, use: "sig", alg: "RS256" }] });
  } catch (error) {
    next(error);
  }
};

export const getOpenIdConfiguration = (req: Request, res: Response): void => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  const config = { ... };
  res.json(config);
};
```

**Recommended fix:**
```typescript
const OIDC_CACHE = "public, max-age=3600, stale-while-revalidate=86400";

export const getJwks = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jwk = await getPublicJwk();
    res.set("Cache-Control", OIDC_CACHE);
    res.set("Vary", "Accept-Encoding");
    res.json({ keys: [{ ...jwk, use: "sig", alg: "RS256" }] });
  } catch (error) {
    next(error);
  }
};

export const getOpenIdConfiguration = (_req: Request, res: Response): void => {
  res.set("Cache-Control", OIDC_CACHE);
  res.set("Vary", "Accept-Encoding");
  res.json(config);
};
```

**References:** Performance Bible §11.4 — OIDC Metadata Caching

---

#### Finding 13: Token-Bearing Responses Missing `no-store`
**Severity:** 🟠 HIGH
**File:** `backend/src/modules/auth/controller.ts` (Line 219, 425), `backend/src/modules/oauth/controller.ts` (Line 300, 369), `backend/src/modules/oidc/controller.ts` (Line 54)
**Impact:** Without explicit `no-store`, intermediary caches and browser layers may retain sensitive auth material.

**Current code:**
```typescript
res.json({
  message: "Login successful",
  accessToken,
  user: {
    id: user.id,
    email: user.email,
```

```typescript
res.json({
  access_token: accessToken,
  token_type: "Bearer",
  expires_in: 900,
  refresh_token: newRefreshToken,
  id_token: idToken,
});
```

**Recommended fix:**
```typescript
res.set("Cache-Control", "no-store");
res.set("Pragma", "no-cache");
res.json({
  access_token: accessToken,
  token_type: "Bearer",
  expires_in: 900,
  refresh_token: newRefreshToken,
  id_token: idToken,
});
```

**References:** Performance Bible §11.7 — Secure Caching For Auth APIs

---

### TypeScript Build & Dependencies

---

#### Finding 14: Build Config Missing Incremental/Isolated Module Optimization
**Severity:** 🟢 LOW
**File:** `backend/tsconfig.json` (Line 3-19)
**Impact:** Slower local and CI TypeScript cycles than necessary; no semantic runtime risk but reduced developer throughput.

**Current code:**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```

**Recommended fix:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsbuildinfo",
    "isolatedModules": true,
    "sourceMap": false,
    "emitDecoratorMetadata": false,
    "experimentalDecorators": false
  }
}
```

**References:** Performance Bible §5.2 — TypeScript Build Throughput

---

#### Finding 15: Type Package Included In Production Dependencies
**Severity:** 🟢 LOW
**File:** `backend/package.json` (Line 20-24)
**Impact:** Slight production install bloat and larger attack surface from unnecessary runtime dependency graph.

**Current code:**
```json
"dependencies": {
  "@prisma/client": "^6.19.2",
  "@simplewebauthn/server": "^13.3.0",
  "@types/cookie-parser": "^1.4.10",
```

**Recommended fix:**
```json
"dependencies": {
  "@prisma/client": "^6.19.2",
  "@simplewebauthn/server": "^13.3.0"
},
"devDependencies": {
  "@types/cookie-parser": "^1.4.10"
}
```

**References:** Performance Bible §5.5 — Dependency Hygiene

---

### Monitoring & CI

---

#### Finding 16: `/health` Endpoint Does Not Validate Redis Readiness
**Severity:** 🟡 MEDIUM
**File:** `backend/src/index.ts` (Line 83-90)
**Impact:** Service can report healthy while Redis is unavailable, causing auth/session failures after orchestrator readiness passes.

**Current code:**
```typescript
app.get("/health", async (req, res) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected", timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", error: String(error) });
  }
});
```

**Recommended fix:**
```typescript
import redis from "./db/redis.js";

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.json({
      status: "ok",
      database: "connected",
      redis: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ status: "error", error: String(error) });
  }
});
```

**References:** Performance Bible §13.1 — Readiness Fidelity

---

#### Finding 17: CI Lacks Auth Latency Performance Gate
**Severity:** 🟡 MEDIUM
**File:** `backend/.github/workflows/ci.yml` (Line 11-120)
**Impact:** Regressions in token issuance/login throughput can merge unnoticed even when tests/build pass.

**Current code:**
```yaml
jobs:
  typecheck:
    ...
  test:
    ...
  build:
    ...
  docker:
    ...
```

**Recommended fix:**
```yaml
perf-smoke:
  name: Perf Smoke
  runs-on: ubuntu-latest
  needs: [build]
  steps:
    - uses: actions/checkout@v4
    - run: docker compose -f backend/docker-compose.yml up -d --build
    - run: npx autocannon -c 50 -d 20 http://localhost/health
    - run: npx autocannon -c 50 -d 20 -m POST http://localhost/api/v1/oauth/token
    - run: docker compose -f backend/docker-compose.yml down -v
```

**References:** Performance Bible §13.6 — CI Performance Guardrails

---

## Implementation Roadmap

Prioritized phases based on severity and dependency order.

### Phase 1 — Critical (Do Immediately, < 1 week)
| # | Finding | File | Effort |
|---|---|---|---|
| 1 | Add core Session/Audit indexes | backend/prisma/schema.prisma | M |
| 2 | Roll out index migration strategy for production-safe deploys | backend/prisma/migrations/* | M |

### Phase 2 — High Impact (Next Sprint, 1–2 weeks)
| # | Finding | File | Effort |
|---|---|---|---|
| 1 | Remove DB query from `generateTokens` hot path | backend/src/core/crypto.ts | M |
| 2 | Add global compression and explicit parser sizing | backend/src/index.ts | S |
| 3 | Add OIDC metadata cache headers and token `no-store` headers | backend/src/modules/oidc/controller.ts, backend/src/modules/auth/controller.ts, backend/src/modules/oauth/controller.ts | S |
| 4 | Make session + refresh hash writes atomic with `$transaction` | backend/src/modules/auth/controller.ts, backend/src/modules/oauth/controller.ts | M |

### Phase 3 — Medium Gains (This Month)
| # | Finding | File | Effort |
|---|---|---|---|
| 1 | Introduce dedicated limiter for introspection/revocation | backend/src/modules/auth/router.ts | S |
| 2 | Optimize observability daily trend aggregation in SQL | backend/src/modules/observability/controller.ts | M |
| 3 | Harden Redis client retry/backoff/autopipelining | backend/src/db/redis.ts | S |
| 4 | Add Redis probe to readiness endpoint | backend/src/index.ts | S |
| 5 | Reduce OAuth auth-code TTL to short-lived window | backend/src/modules/oauth/controller.ts | S |

### Phase 4 — Low / Polish (Ongoing)
| # | Finding | File | Effort |
|---|---|---|---|
| 1 | Standardize Redis key namespace strategy | backend/src/modules/*, backend/src/middlewares/rateLimiter.ts | S |
| 2 | Enable TS incremental/isolated module build settings | backend/tsconfig.json | S |
| 3 | Move type-only dependency out of runtime deps | backend/package.json | S |
| 4 | Replace console logging with structured async logger | backend/src/**/*.ts | M |
| 5 | Normalize WebAuthn credential storage to binary columns | backend/prisma/schema.prisma, backend/src/modules/passkey/controller.ts | L |

---

## Quick Reference: Files That Need the Most Work

1. `backend/src/modules/auth/controller.ts` — 2 HIGH, 1 MEDIUM
2. `backend/src/modules/oauth/controller.ts` — 2 HIGH, 2 MEDIUM
3. `backend/prisma/schema.prisma` — 1 CRITICAL, 1 MEDIUM
4. `backend/src/index.ts` — 1 HIGH, 1 MEDIUM
5. `backend/src/core/crypto.ts` — 1 HIGH
6. `backend/src/modules/oidc/controller.ts` — 1 HIGH
7. `backend/src/db/redis.ts` — 1 MEDIUM
8. `backend/.github/workflows/ci.yml` — 1 MEDIUM

---

## Implementation Agent Prompt

After this audit is reviewed and approved, use the following prompt to drive implementation:

> "You are implementing the optimizations from AUTHHUB_AUDIT_REPORT.md.
> Work through Phase 1 findings first, in order.
> For each finding: read the current file, apply the recommended fix exactly as described,
> run `npm run build` and `npm test` after each change to verify nothing breaks.
> Do not proceed to the next finding until the current one passes tests.
> After all Phase 1 changes, commit with message: `perf: Phase 1 critical optimizations`.
> Then await confirmation before proceeding to Phase 2."
