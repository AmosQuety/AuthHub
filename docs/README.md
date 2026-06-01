# AuthHub Developer Portal Infrastructure

Welcome to the **AuthHub Developer Portal** repository directory. This folder houses the entire static documentation ecosystem, landing templates, social assets, styling layouts, search indexes, and SEO parameters. 

The developer portal is compiled via **Redocly CLI** and deployed automatically using **GitHub Pages**.

---

## 📁 Repository Directory Structure

```
docs/
├── .nojekyll                  # Tells GitHub Pages not to build with Jekyll
├── index.html                 # Main landing page template and theme shell
├── index.md                   # Home page markdown fallback
├── README.md                  # This management guide
├── getting-started.md         # Onboarding entry point guide
├── navigation.md              # Information Architecture specification
├── search.md                  # Indexing and search experience documentation
├── introduction.md            # AuthHub core introduction
├── quickstart.md              # Shortest integration manual
├── architecture.md            # Technical specifications and token mechanics
├── operations.md              # Resilient deployment models and cluster advice
├── faq.md                     # Frequently Asked Questions
├── glossary.md                # Identity terminologies
├── AI_AGENTS.md               # Primary prompt directives and AI integration file
├── openapi-reconciliation.md   # Open API consistency audit report
│
├── assets/                    # Static download files (PDFs, templates)
├── styles/
│   └── authhub.css            # Vanilla CSS site layout styling sheet
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

All navigation routes, search engines, API targets, themes, and rule parameters are controlled from the root config:
* 🔗 [redocly.yaml](file:///g:/MyProjects/new%20code/AuthHub/redocly.yaml)

### Key Configuration Nodes in `redocly.yaml`:
1. **`apis`**: Maps OpenID Connect endpoints to render the OpenAPI standard playground dynamically.
2. **`theme`**: Tailors primary, text, right-panel, success, and error styling tokens.
3. **`navbar` & `sidebar`**: Coordinates full document groupings logically.
4. **`search`**: Tunes the `flexsearch` algorithm indexing priority.
5. **`seo`**: Controls canonical links and general portal descriptions.

---

## 💻 Local Development

Run the following instructions to test, lint, and preview the developer portal locally.

### 1. Prerequisites
Ensure you have **Node.js** v20+ installed on your workspace.

### 2. Install Redocly CLI
```bash
npm install -g @redocly/cli@latest
```

### 3. Run Local Preview Server
Spin up the live-reloading hot-development preview server:
```bash
redocly preview authhub
```
* The portal will be served dynamically at `http://localhost:8080/`.

### 4. Lint Configurations
Verify OIDC definitions and Redocly rules conform to standards:
```bash
redocly lint authhub
```

---

## 🚀 CI/CD & Deployments

The portal employs a zero-touch GitOps deployment loop:
* Every commit pushed to the `main` branch triggers the GitHub Actions workflow at [docs.yml](file:///.github/workflows/docs.yml).
* **Lint Check**: Validates the OpenAPI schemas and configuration models.
* **Link Audit**: Scans and flags broken URLs in markdown pages dynamically using `lychee-action`.
* **Deploy**: Builds files and deploys securely to the custom domain page endpoint via GitHub Actions.

For detailed custom DNS settings, HTTPS setups, and search consoles verification check the [GitHub Pages Deployment Handbook](file:///g:/MyProjects/new%20code/AuthHub/docs/deployment/github-pages.md).

---

## 🤖 AI Agent Integration
To make our identity portal AI-friendly:
- Place absolute references to [AI_AGENTS.md](file:///g:/MyProjects/new%20code/AuthHub/docs/AI_AGENTS.md) in system prompts.
- Ensure the prompt context loaders inside the `ai/` folder stay synchronized with the latest API parameters.
- Provide OpenAPI code snippets on API reference endpoints to prevent hallucination during code generation.
