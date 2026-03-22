# AuthHub - Centralized Identity Provider (IdP)

AuthHub is a visually stunning, production-ready, full-stack Identity Provider. Built as a self-service platform, it combines a robust multi-tenant backend with a premium "Aurora Glass" React frontend, providing world-class authentication, subscription, and security features out of the box.

## 🌟 Key Platform Features

### 1. Advanced Authentication & Security
- **Multi-Factor Auth (MFA)**: Built-in strict support for TOTP Authenticator apps.
- **Passkeys (WebAuthn)**: Passwordless biometric authentication (FaceID / TouchID).
- **Redis Rate Limiting**: Strict limits on login attempts, registration, and token generation to prevent brute-force attacks.
- **JWT Key Rotation**: Dynamic RS256 token signing with robust RFC 7638 validation and standard OIDC `.well-known/jwks.json` discovery.

### 2. Multi-Tenancy & Developer Portal
- **Enterprise Tenants**: Configurable "Tenants" with isolated user bases (`@@unique([email, tenantId])`), custom branding, domains, and webhook routing.
- **Self-Service Developer Portal**: End-users can register their own OAuth 2.0 Clients, manage redirect URIs, and rotate secrets dynamically without admin intervention.
- **OAuth 2.0 / OIDC Compliant**: Fully supports Authorization Code Flow with PKCE, `refresh_tokens`, and standard `userinfo` endpoints.

### 3. Monetization & Entitlements
- **Native Stripe Integration**: A fully automated Stripe Webhook engine that maps user subscriptions to internal `Entitlement` records.
- **Billing-Aware Tokens**: `plan_id` (e.g., `pro_plan`, `scale_plan`) is dynamically injected directly into JWT `scopes` for downstream enforcement by microservices.
- **Self-Serve Custom Billing Portal**: A premium, unified UI for users to upgrade/manage their Stripe subscriptions securely.

### 4. Admin Observability & Support
- **Sanctioned Impersonation**: Support teams can "Login As" a user securely. It issues a special 15-minute, non-refreshable JWT with an `act` (Actor) claim and triggers immediate email transparency notifications to the user.
- **Auth Analytics Dashboard**: Real-time Recharts dashboards showing Geolocation logins, Login Funnel Dropoffs, and anomaly trend lines.
- **Audit Logging**: Every single security event (logins, MFA setup, impersonation, billing updates) is permanently stamped in the database.

### 5. "Aurora" Premium Design System
- **Dark & Light Mode Integration**: Powered by a highly efficient Tailwind native CSS variable inversion trick, allowing seamless transition from Deep Nebula Dark Mode to Frosted Slate Light Mode.
- **Glassmorphism UI**: Beautiful frosted glass cards, gradient glow actions, animated floating backgrounds, and micro-interactions powered by CSS and Framer.
- **Interactive Onboarding**: Fully guided interactive product tours (`react-joyride`) that walk new developers through their personalized dashboard.
- **Component Polish**: Custom Animated Toasts, responsive Skeleton Loaders, and dynamic Datatables with badge-based indicator systems.

## 🛠️ Tech Stack architecture

- **Frontend**: React, Vite, Tailwind CSS v4, React Router, Recharts, Lucide Icons.
- **Backend API**: Node.js (v20+), Express 5, TypeScript (Strict).
- **Database**: PostgreSQL (via Supabase) with Prisma ORM.
- **Caching & Limits**: Redis (via Docker)
- **Cryptography**: `jose` (JWT), `argon2` (Hashing)
- **Monetization**: Stripe API (`stripe-node`)

## 📦 Prerequisites

- Node.js & npm
- Docker & Docker Compose (for Redis)
- PostgreSQL Database URL (e.g., Supabase)
- Stripe Account (for `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`)

## ⚙️ Setup Instructions

1. **Install Dependencies**
   *Install packages for both the backend and frontend.*
   ```bash
   cd backend && npm install
   cd ../frontend/frontend && npm install
   ```

2. **Backend Configuration**
   Copy `backend/.env.example` to `backend/.env`.
   Configure your `DATABASE_URL`, `REDIS_URL`, and Stripe keys. You MUST generate an RSA Key Pair for `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`.

3. **Database Initialization (Prisma)**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npx tsx src/db/seed.ts     # Populates default Tenant, Admin, and initial OAuth client.
   ```

4. **Start Local Infrastructure**
   ```bash
   docker-compose up -d     # Spins up the Redis Rate Limiter caching server
   ```

## 🏃‍♂️ Running the Platform

- **Start Backend**: `cd backend && npm run dev`
- **Start Frontend**: `cd frontend/frontend && npm run dev`
- **Access App**: Navigate to `http://localhost:5173`

*(To test webhooks locally, use the Stripe CLI to forward events to `http://localhost:3000/api/v1/webhooks/stripe`)*

## 🔒 Production Guidelines
For 50+ DAU launches, ensure the system runs behind Cloudflare/WAF, use a Postgres Connection Pooler (Pgbouncer on Supabase port 6543), set backend `ALLOWED_ORIGINS` dynamically instead of `*`, and run on `NODE_ENV=production` to enforce Secure mapping on `HttpOnly` Cookies.
