# AuthHub Frontend

The React/Vite frontend for AuthHub — the "Aurora Glass" dashboard used for developer client management, admin observability, and end-user account flows (login, MFA, passkeys, billing).

## Prerequisites

- Node.js v20+
- A running AuthHub backend (see `backend/README.md`) — the frontend talks to it over HTTP, it does not run standalone against mock data.

## Environment variables

Create a `.env` (or `.env.local`) file in this directory. The app reads these via `import.meta.env`:

| Variable | Purpose | Example (local dev) |
|---|---|---|
| `VITE_API_URL` | Base URL of the AuthHub backend API | `http://localhost:3000` |
| `VITE_API_DOCS_URL` | URL of the backend's live OpenAPI document, used by in-app API reference views | `http://localhost:3000/api/v1/docs/openapi.json` |
| `VITE_BUILD_TARGET` | Optional. Overrides which app surface a build includes (`user` or `full`); see **Build targets** below. Not needed for `npm run dev`. |

## Setup

```bash
npm install
npm run dev
```

The dev server prints its local URL (typically `http://localhost:5173`). Make sure the backend (`cd ../../backend && npm run dev`) is running first, or API calls will fail.

## Build targets

This app ships three build modes, controlled by `vite.config.ts`'s `environments` API and the `__INCLUDE_ADMIN__` / `__INCLUDE_DEVELOPER__` compile-time flags:

- `npm run build` — full build, includes admin and developer surfaces.
- `npm run build:user` — end-user-only build (`mode: user`); admin/developer routes and code are excluded from the bundle entirely, not just hidden.
- `npm run build:full` — explicit alias for the full build (`mode: production`).

Pick the target based on what you're deploying — a standalone end-user portal doesn't need the admin/developer bundle weight shipped to it.

## Linting

```bash
npm run lint
```

## Notes

- Route/UI-level restrictions (e.g. hiding admin nav items) are a UX convenience only — all authorization is enforced server-side by the backend. See the backend's security documentation before assuming a hidden UI element implies an enforced permission.
- `npm run build` also emits `dist/bundle-analysis.html` (via `rollup-plugin-visualizer`) for inspecting bundle composition.
