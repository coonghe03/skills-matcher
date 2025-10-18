## Database

- MySQL schema lives in `db/schema.sql`.
- Apply locally with: `cd backend && npm run db:migrate`
- Configure credentials via `backend/.env`.

### Tables
- `personnel` (CRUD + created_at)
- `skills` (central catalog)
- `personnel_skills` (proficiency 1–5)
- `projects` (status, team_capacity)
- `project_required_skills` (min proficiency)
- `allocations` (dates + percent_alloc)
