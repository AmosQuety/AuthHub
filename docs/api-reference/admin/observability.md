# /api/v1/admin/observability/*

Endpoints

- `GET /api/v1/admin/observability/summary`
- `GET /api/v1/admin/observability/stats`
- `GET /api/v1/admin/observability/funnel`
- `GET /api/v1/admin/observability/heatmap`
- `GET /api/v1/admin/observability/risk-trends`

Purpose

Provide administrative analytics for sessions, logins, anomalies, and geographic risk trends.

Data points

- Active sessions
- Login counts
- Risk/anomaly counts
- Funnel counts
- Heatmap aggregates
- Daily risk trend data

Security notes

- Requires the `ADMIN` role.
- Designed for dashboarding and operational monitoring.

Source

- [backend/src/modules/observability/controller.ts](backend/src/modules/observability/controller.ts)
