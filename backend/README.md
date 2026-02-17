# AuthHub - Centralized Identity Provider (IdP)

A production-grade Identity Provider backend built with Express, TypeScript, Prisma (PostgreSQL), and Redis. AuthHub implementation supports secure authentication, session management, and standard OIDC/OAuth 2.0 protocols.

## 🚀 Features

- **Authentication**: Secure user registration and login with Argon2 password hashing.
- **Session Management**: Dual-layer session storage using PostgreSQL (persistent) and Redis (fast access/caching).
- **Security**: 
  - RS256 JWT Signing (Access & Refresh Tokens).
  - HttpOnly Cookies for Refresh Tokens.
  - Helmet for security headers.
- **OIDC Compliance**:
  - `/.well-known/jwks.json`: Public keys for token verification.
  - `/.well-known/openid-configuration`: Discovery endpoint.
- **OAuth 2.0**:
  - Authorization Code Flow with PKCE (RFC 7636).
  - Client Seeding script.

## 🛠️ Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express 5
- **Language**: TypeScript (Strict)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Caching**: Redis (via Docker)
- **Cryptography**: `jose` (JWT/JWK), `argon2` (Hashing)

## 📦 Prerequisites

- Node.js & npm
- Docker & Docker Compose (for Redis)
- PostgreSQL Database URL (e.g., Supabase)

## ⚙️ Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   *Note: You need to generate an RSA Key Pair for `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY`.*

3. **Database Setup**
   Ensure your `DATABASE_URL` is set in `.env`.
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start Infrastructure (Redis)**
   ```bash
   docker-compose up -d
   ```

5. **Seed OAuth Client**
   Initialize a test client for OAuth flow:
   ```bash
   npx tsx src/db/seed-client.ts
   ```

## 🏃‍♂️ Running the Server

- **Development**:
  ```bash
  npm run dev
  ```
- **Build & Start**:
  ```bash
  npm run build
  npm start
  ```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/register`: Create a new user.
- `POST /api/v1/auth/login`: Authenticate and receive tokens.
- `POST /api/v1/auth/logout`: Revoke session and clear cookies.
- `GET /api/v1/auth/me`: Get current user profile (Protected).

### OIDC Discovery
- `GET /auth/.well-known/openid-configuration`
- `GET /auth/.well-known/jwks.json`

### OAuth 2.0
- `GET /api/v1/oauth/authorize`: Authorization endpoint (supports PKCE).
- `POST /api/v1/oauth/token`: Token exchange endpoint.

## 🔒 Security Notes
- Ensure `.env` is never committed to version control.
- In production, ensure `NODE_ENV=production` is set to enable secure cookies.
