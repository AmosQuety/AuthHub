# AuthHub Developer Portal Infrastructure

Welcome to the **AuthHub Developer Portal** repository directory. This folder houses the entire static documentation ecosystem, landing template, social assets, styling, and SEO parameters.

The portal is a **hand-rolled static single-page app**: `docs/index.html` fetches the raw markdown files in this folder over `fetch()`, renders them client-side with `marked` + Prism, and routes between pages via URL hash fragments (e.g. `#/getting-started.md`). It's deployed as-is to **GitHub Pages** — there is no build step that compiles the markdown into standalone HTML pages, so linking directly to `/getting-started.html` (without going through `index.html`) will 404.

---

## 📁 Repository Directory Structure

```
docs/
├── .nojekyll                  # Tells GitHub Pages not to build with Jekyll
├── index.html                 # The SPA shell: layout, nav, search, markdown renderer
├── index.md                   # Home page markdown content
├── README.md                  # This management guide
├── getting-started.md         # Onboarding entry point guide
├── navigation.md              # Information Architecture reference
├── search.md                  # Search & SEO reference
├── introduction.md            # AuthHub core introduction
├── quickstart.md              # Shortest integration manual
├── architecture.md            # Technical specifications and token mechanics
├── operations.md              # Deployment models and operational advice
├── faq.md                     # Frequently Asked Questions
├── glossary.md                # Identity terminologies
├── AI_AGENTS.md                # Primary directives and AI integration file
├── openapi-reconciliation.md   # OpenAPI consistency audit report
│
├── assets/                    # Static download files
├── styles/
│   └── authhub.css            # Site layout/theme stylesheet
├── images/
│   ├── authhub-og.svg         # Open Graph artwork SVG preview
│   ├── favicon.png            # Desktop browser PNG favicon
│   └── favicon.ico            # Windows legacy browser compatibility ICO
│
├── ai/                        # Optimized paths for AI agents
│   ├── index.md               # AI sub-index
│   ├── onboarding.md          # Context loaders
│   ├── integration.md         # Schema parameters
│   └── quick-reference.md     # Command cheatsheet
│
├── deployment/
│   └── github-pages.md        # Deployment operations handbook
│
├── api-reference/             # Endpoints, queries, and path parameters
├── oauth/                     # OAuth specifications implementation
├── oidc/                      # OIDC standard specs implementation
├── tutorials/                 # Interactive coding quick tutorials
├── security/                  # Cryptography, keys, and session parameters
├── troubleshooting/           # Common error resolutions
├── migration-guides/          # Competitor migrations (Auth0, Clerk, Firebase)
├── sdk-guides/                # SDK setups (React, Express, Python)
├── billing/                   # Syncing customer billing state
└── webhooks/                  # Responding to system transactions
```

---

## ⚙️ Core Configuration

The site's navigation is defined in **three places that must currently be kept in sync manually** (a known duplication — consolidating onto one source is worth doing, but out of scope here):
1. [`sidebar.yaml`](../sidebar.yaml) / [`navigation.yaml`](../navigation.yaml) at the repo root — the nominal source spec.
2. `sidebarStructure` — a JS array near the bottom of `docs/index.html`, explicitly commented as "a hardcoded representation of sidebar.yaml." This is what the live site actually renders; the two files above have no runtime effect on their own.
3. [`docs/navigation.md`](navigation.md) — the human-readable IA reference for people browsing the repo.

[`redocly.yaml`](../redocly.yaml) at the repo root is unrelated to the three files above — it exists only to drive `redocly lint` in CI, which validates the OpenAPI document served live by the backend at `/api/v1/docs/openapi.json`. It is **not** used to build or host this site — the wider navbar/sidebar/search/versions config style Redocly supports elsewhere describes a separate, paid Redocly Reunite portal product that this project does not run.

---

## 💻 Local Development

### 1. Prerequisites
Any static file server (Node.js v20+ recommended).

### 2. Preview locally
From the repo root:
```bash
npx serve docs
```
Then open the printed local URL — `index.html` loads and renders the markdown pages client-side, identically to production.

### 3. Lint the OpenAPI document (optional)
This validates the live API's OpenAPI output, not the docs site itself:
```bash
npm install -g @redocly/cli@latest
redocly lint authhub
```

---

## 🚀 CI/CD & Deployments

The portal employs a zero-touch GitOps deployment loop, defined in [`.github/workflows/docs.yml`](../.github/workflows/docs.yml):
* Every commit pushed to `main` that touches `docs/**` (or the workflow/config files) triggers the workflow.
* **Lint Check**: Validates the live OpenAPI document via `redocly lint authhub`.
* **Link Audit**: Scans and flags broken internal URLs in the built `dist/**/*.html` and `dist/**/*.md` files using `lychee-action`.
* **Deploy**: Copies `docs/`, `sitemap.xml`, `robots.txt`, and `.nojekyll` into `dist/` and publishes it to GitHub Pages via `actions/deploy-pages`.

For custom DNS/HTTPS setup, see the [GitHub Pages Deployment Handbook](deployment/github-pages.md).

---

## 🤖 AI Agent Integration

To make this portal useful to AI coding agents:
- Point agents at [AI_AGENTS.md](AI_AGENTS.md) directly — it's the primary, self-contained reference for autonomous integration.
- Keep the `ai/` folder's context files synchronized with the actual API surface as it evolves.
- Prefer linking to the live OpenAPI document (`GET /api/v1/docs/openapi.json` on the deployed backend) over static reference pages when precision matters, since `docs/api-reference/` pages are hand-maintained and can drift — see [openapi-reconciliation.md](openapi-reconciliation.md) for known gaps.
