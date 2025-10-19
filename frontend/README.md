## API (in progress)

### Personnel
- `GET /api/personnel?page=1&limit=20&q=alice&level=Mid`
- `GET /api/personnel/:id`
- `POST /api/personnel` { name, role_title, experience_level }
- `PUT /api/personnel/:id` { name, role_title, experience_level }
- `DELETE /api/personnel/:id`

### Skills
- `GET /api/skills?page=1&limit=20&q=react&category=Frontend`
- `POST /api/skills` { category, name }
- `PUT /api/skills/:id` { category, name }
- `DELETE /api/skills/:id`

> Validation: express-validator ensures basic constraints.  
> Uniqueness: skills are unique per (category, name).
