const express = require('express');
const { pool } = require('./db');

const router = express.Router();

// Utility: get percent utilization over date window
async function getUtilization(personnelId, startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT percent_alloc, start_date, end_date
       FROM allocations
      WHERE personnel_id = ?
        AND (start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)`,
    [personnelId, endDate, startDate]
  );
  // Simplified: sum percent_alloc for any overlap in window
  const sum = rows.reduce((acc, r) => acc + (r.percent_alloc || 0), 0);
  return Math.min(100, sum);
}

// GET /match/:projectId?sort=fit|availability
router.get('/match/:projectId', async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const sort = (req.query.sort || 'fit').toLowerCase();

    const [[project]] = await pool.query(
      'SELECT id, name, start_date, end_date, team_capacity FROM projects WHERE id=?',
      [projectId]
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [reqSkills] = await pool.query(
      `SELECT prs.skill_id, s.name AS skill_name, s.category, prs.min_proficiency
         FROM project_required_skills prs
         JOIN skills s ON s.id = prs.skill_id
        WHERE prs.project_id = ?`,
      [projectId]
    );
    if (reqSkills.length === 0) return res.json({ project, required: [], matches: [] });

    // Pull all candidates & their skills
    const [cands] = await pool.query(
      `SELECT p.id, p.name, p.role_title, p.experience_level, ps.skill_id, ps.proficiency,
              s.name AS skill_name, s.category
         FROM personnel p
         LEFT JOIN personnel_skills ps ON ps.personnel_id = p.id
         LEFT JOIN skills s ON s.id = ps.skill_id
        ORDER BY p.id`
    );

    // Build map: personnelId -> { profile, skillsById }
    const byPerson = new Map();
    for (const row of cands) {
      if (!byPerson.has(row.id)) {
        byPerson.set(row.id, {
          id: row.id,
          name: row.name,
          role_title: row.role_title,
          experience_level: row.experience_level,
          skillsById: new Map()
        });
      }
      if (row.skill_id) {
        byPerson.get(row.id).skillsById.set(row.skill_id, {
          proficiency: row.proficiency,
          name: row.skill_name,
          category: row.category
        });
      }
    }

    // Score function:
    // - candidate must have ALL required skills with proficiency >= min
    // - fitScore = avg( candProf / minProf ), capped at 2.0 to reduce outliers
    // - bonus +0.1 per Senior (or +0.05 for Mid) to break ties slightly
    const matches = [];
    for (const p of byPerson.values()) {
      let meetsAll = true;
      let ratios = [];

      for (const req of reqSkills) {
        const got = p.skillsById.get(req.skill_id);
        if (!got || got.proficiency < req.min_proficiency) {
          meetsAll = false;
          break;
        }
        ratios.push(Math.min(2, got.proficiency / req.min_proficiency));
      }

      if (!meetsAll) continue;

      const avgFit = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      let tie = 0;
      if (p.experience_level === 'Senior') tie = 0.1;
      else if (p.experience_level === 'Mid') tie = 0.05;

      // Availability calc
      const start = project.start_date || new Date().toISOString().slice(0,10);
      const end = project.end_date || start;
      const utilization = await getUtilization(p.id, start, end);
      const availability = Math.max(0, 100 - utilization);

      matches.push({
        personnel_id: p.id,
        name: p.name,
        role_title: p.role_title,
        experience_level: p.experience_level,
        fit_score: Number((avgFit + tie).toFixed(3)),
        availability, // percentage free over window (simplified)
        details: reqSkills.map(req => {
          const got = p.skillsById.get(req.skill_id);
          return {
            skill_id: req.skill_id,
            skill_name: req.skill_name,
            required: req.min_proficiency,
            has: got?.proficiency ?? 0
          };
        })
      });
    }

    if (sort === 'availability') {
      matches.sort((a, b) => b.availability - a.availability || b.fit_score - a.fit_score);
    } else {
      matches.sort((a, b) => b.fit_score - a.fit_score || b.availability - a.availability);
    }

    res.json({ project: { ...project }, required: reqSkills, matches });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
