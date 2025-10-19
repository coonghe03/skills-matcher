### Matching (microservice)
- Separate Node service in `/matching-service` (connects to same MySQL).
- `GET http://localhost:5100/match/:projectId?sort=fit|availability`
- Main API proxy: `GET /api/match/:projectId?sort=...` (set `MATCHING_SERVICE_URL`)

Fit score:
- Candidate must meet all required skills with `proficiency >= min`.
- `fit_score = avg( candidateProf / minProf )`, capped at 2.0, with tie bonus (Senior +0.1, Mid +0.05).

Availability (simplified):
- Sum overlapping `percent_alloc` across allocations in the project window.
- `availability = 100 - utilization`. Filter/Sort by `?sort=`.

### Allocations
- `GET /api/projects/:projectId/allocations`
- `POST /api/allocations` { project_id, personnel_id, start_date, end_date?, percent_alloc (1–100) }
  - Prevents overallocation (>100%) on overlapping dates.
- `DELETE /api/allocations/:id`

## Deployment

### Docker (local, all services)
Requires Docker Engine + Compose.

```bash
docker compose build
docker compose up -d
# Backend: http://localhost:5000
# Matching service: http://localhost:5100
# MySQL: localhost:3306 (user: root / pass: rootpass)
