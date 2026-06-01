# Information Architecture & Navigation Directory

The AuthHub Developer Portal is organized into six major logical areas based on developer jobs and deployment phases. This structure ensures that engineers, operations teams, security auditors, and AI coding agents can discover answers quickly without scrolling through raw codebase logic.

---

## 🗺️ Portal Navigation Map

The high-level mapping matches the structure configured in [redocly.yaml](file:///g:/MyProjects/new%20code/AuthHub/redocly.yaml):

```
Developer Portal
├── 🏁 Getting Started (Onboarding)
├── 🔐 Authentication (Core Flows)
├── 🔌 API Reference (Interactive Specifications)
├── 📚 Guides (SDKs & Migrations)
├── ⚙️ Operations (Deployment & Observability)
└── 🤖 AI Integration (Context & Prompts)
```

---

## 🗂️ Detailed Section Mappings

### 1. Getting Started
*Focus: Speed-to-first-token. Explains basic mechanics and registers first client application.*
- **[Introduction](introduction.md)**: Product values, high-level features, SLA, and supported specifications.
- **[Quick Start](quickstart.md)**: 5-minute onboarding code run to authenticate a user locally.
- **[Getting Started Overview](getting-started.md)**: Complete step-by-step roadmap from tenant creation to token exchange.
- **[Create Account](getting-started/create-account.md)**: Signup, email verification, and workspace configuration.
- **[Create OAuth Client](getting-started/create-oauth-client.md)**: Selecting client scopes, redirect URIs, and credentials types.
- **[PKCE Authentication Flow](getting-started/pkce.md)**: Proof Key for Code Exchange (PKCE) cryptographic algorithms.
- **[Login and Tokens](getting-started/login-and-tokens.md)**: Request and response shapes on token endpoints.
- **[Architecture & Core Concepts](architecture.md)**: JWT scopes, refresh lifetimes, token storage security, and trust hierarchies.

### 2. Authentication
*Focus: Protocol-level deep dives and session security mechanisms.*
- **[OAuth 2.0 Specifications](oauth/index.md)**: RFC compliance details, standard token parameters, and scopes rules.
- **[OpenID Connect Standard](oidc/index.md)**: Discovery parameters, JWKS configurations, and `id_token` claims verification.
- **[Session Revocation Security](security/session-revocation.md)**: Global API session invalidate procedures and caching parameters.
- **[MFA Enforcement Policy](security/mfa-enforcement.md)**: Real-time Multi-Factor challenges, hardware keys, and TOTP code setup.
- **[Password Reset Tutorial](tutorials/password-reset.md)**: Secure transactional email password change pipelines.
- **[Email Verification Tutorial](tutorials/email-verification.md)**: Automated token-based registration verification.

### 3. API Reference
*Focus: Live interactive endpoints and direct API client specifications.*
- **[API Reference Hub](api-reference/index.md)**: Overview of production API base URLs, rate limiting policies, and headers.
- **[Authentication Endpoints](api-reference/auth/index.md)**: Account registration, signups, profile updates, and logout parameters.
- **[OAuth APIs](api-reference/oauth.md)**: `/oauth/authorize`, `/oauth/token`, and `/oauth/revoke` specs.
- **[OIDC APIs](api-reference/oidc.md)**: `/.well-known/openid-configuration` and JWKS definitions.
- **[Developer APIs](api-reference/developer/index.md)**: Administrative applications CRUD and token listings.
- **[Admin APIs](api-reference/admin/index.md)**: System console access, tenant configuration overrides, and DB states.
- **[Billing APIs](billing/index.md)**: Sync subscriptions, query billing quotas, and update card details.
- **[Webhook APIs](webhooks/index.md)**: Listening to system notifications and validating payload cryptographic headers.

### 4. Guides
*Focus: Boilerplate setup templates, multi-language SDK integrations, and platform migrations.*
- **[Tutorials Portal](tutorials/index.md)**: Core dashboard integrations and user setup walk-throughs.
- **[Javascript SDK Guide](sdk-guides/javascript.md)**: Vanilla browser integrations.
- **[React SDK Guide](sdk-guides/react.md)**: React Context API integration, hook listeners, and route guards.
- **[Next.js SDK Guide](sdk-guides/nextjs.md)**: SSR pages protection and server actions validation.
- **[Express SDK Guide](sdk-guides/express.md)**: Middleware routes validations.
- **[Python SDK Guide](sdk-guides/python.md)**: Machine-to-machine background tasks authentication.
- **[React Native SDK Guide](sdk-guides/react-native.md)**: Secure keychain storage and deep link handlers.
- **[Competitor Migration Guides](migration-guides/from_auth0.md)**: High-speed user export/import templates from Auth0, Clerk, Firebase, Supabase, and Keycloak.

### 5. Operations
*Focus: Orchestration, clustering resiliency, scaling, security audits, and dashboards.*
- **[Operations Guide](operations.md)**: Infrastructure configuration keys and environment variables profiles.
- **[Deployment Handbook](deployment/github-pages.md)**: Repository actions setup and DNS mappings for static sites.
- **[Observability & Dashboard](tutorials/observability-dashboard.md)**: Custom dashboards, OpenTelemetry metrics, and alerts.
- **[Security Best Practices](security/index.md)**: Token rotation parameters, CORS rules, and secure key exchanges.
- **[Root API Key Management](security/root-api-keys.md)**: Safe rotation of administrator root parameters.
- **[Troubleshooting Guide](troubleshooting/common-errors.md)**: Mapping identity error codes (e.g. `invalid_grant`, `invalid_client`).

### 6. AI Agent Integration
*Focus: Seamless automated ingestion.*
- **[AI Agents Master Manifest](AI_AGENTS.md)**: Directives, prompt schemas, and quick context injection markers.
- **[AI Onboarding Portal](ai/index.md)**: Setup guides for code generation agents.
- **[AI Context Loader](ai/onboarding.md)**: Compact prompt-friendly summary file for LLMs.
- **[AI JSON Schema Reference](ai/integration.md)**: System definitions and data models.
- **[AI Cheat Sheet](ai/quick-reference.md)**: Rapid token retrieval commands.

---

## 🛠️ Modifying Navigation

To add new markdown documentation pages to the portal:
1. Save the new markdown file in the appropriate directory (e.g., `docs/security/my-feature.md`).
2. Add the file link under the correct category group in `sidebar` within the [redocly.yaml](file:///g:/MyProjects/new%20code/AuthHub/redocly.yaml) file.
3. Commit and push the changes to trigger the automatic deploy CI/CD.
