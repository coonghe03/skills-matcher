const express = require('express');
const { pool } = require('../db');

const router = express.Router();

/**
 * Utility: check availability by summing overlapping allocations between [start,end].
 * If utilization < 100, we treat the person as "available" (has capacity).
 */
async function utilizationBetween(personnelId, startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT percent_alloc, start_date, end_date
       FROM allocations
      WHERE personnel_id = ?
        AND (start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)`,
    [personnelId, endDate, startDate]
  );
  const sum = rows.reduce((acc, r) => acc + (r.percent_alloc || 0), 0);
  return Math.min(100, sum);
}

/**
 * GET /api/search/personnel
 * Query params:
 *  - q: string (search name/role)
 *  - level: Junior|Mid|Senior
 *  - skillId: number (filter personnel who have this skill)
 *  - minProf: number 1..5 (minimum proficiency for that skill)
 *  - available_start: YYYY-MM-DD (optional)
 *  - available_end: YYYY-MM-DD (optional; if provided we check capacity in range)
 *
 * Returns: { data: [ { id, name, role_title, experience_level, created_at, skills: [...], availability: {requestedUtilization, freePercent} } ] }
 */
router.get('/search/personnel', async (req, res, next) => {
  try {
    const { q, level, skillId, minProf, available_start, available_end } = req.query;

    // Build base where clause for name/role/level
    const where = [];
    const params = [];

    if (q) {
      where.push('(p.name LIKE ? OR p.role_title LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (level) {
      where.push('p.experience_level = ?');
      params.push(level);
    }

    // If skill filter, we’ll join on personnel_skills with where
    let skillJoin = '';
    if (skillId) {
      skillJoin = 'JOIN personnel_skills fps ON fps.personnel_id = p.id AND fps.skill_id = ?';
      params.unshift(Number(skillId)); // important: will be used first in query
      if (minProf) {
        where.push('fps.proficiency >= ?');
        params.push(Number(minProf));
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.role_title, p.experience_level, p.created_at
         FROM personnel p
         ${skillJoin}
         ${whereSql}
        ORDER BY p.id DESC
        LIMIT 200`,
      params
    );

    // Fetch all skills per the subset to display (one extra roundtrip)
    const ids = rows.map(r => r.id);
    let skillsByPerson = new Map();
    if (ids.length) {
      const [skills] = await pool.query(
        `SELECT ps.personnel_id, s.id AS skill_id, s.category, s.name, ps.proficiency
           FROM personnel_skills ps
           JOIN skills s ON s.id = ps.skill_id
          WHERE ps.personnel_id IN (${ids.map(() => '?').join(',')})
          ORDER BY s.category, s.name`,
        ids
      );
      skillsByPerson = skills.reduce((map, r) => {
        if (!map.has(r.personnel_id)) map.set(r.personnel_id, []);
        map.get(r.personnel_id).push({
          skill_id: r.skill_id,
          category: r.category,
          name: r.name,
          proficiency: r.proficiency
        });
        return map;
      }, new Map());
    }

    // If availability range provided, compute utilization in range
    const start = available_start;
    const end = available_end || available_start; // if only one given
    const data = [];
    for (const r of rows) {
      let availability = undefined;
      if (start) {
        const util = await utilizationBetween(r.id, start, end);
        availability = { requestedUtilization: util, freePercent: Math.max(0, 100 - util) };
      }
      data.push({
        ...r,
        skills: skillsByPerson.get(r.id) || [],
        availability
      });
    }

    res.json({ data });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/analytics/personnel-growth
 * Query:
 *  - granularity=day|month (default: day)
 *  - from=YYYY-MM-DD (optional; default min)
 *  - to=YYYY-MM-DD (optional; default today)
 *
 * Returns [{ period: 'YYYY-MM-DD' | 'YYYY-MM', count: number, cumulative: number }]
 */
router.get('/analytics/personnel-growth', async (req, res, next) => {
  try {
    const granularity = (req.query.granularity || 'day').toLowerCase();
    const from = req.query.from || '1970-01-01';
    const to = req.query.to || new Date().toISOString().slice(0, 10);

    let selectExpr, groupExpr, orderExpr, periodFormat;
    if (granularity === 'month') {
      selectExpr = `DATE_FORMAT(created_at, '%Y-%m') AS period`;
      groupExpr  = `DATE_FORMAT(created_at, '%Y-%m')`;
      orderExpr  = `period ASC`;
      periodFormat = 'YYYY-MM';
    } else {
      selectExpr = `DATE(created_at) AS period`;
      groupExpr  = `DATE(created_at)`;
      orderExpr  = `period ASC`;
      periodFormat = 'YYYY-MM-DD';
    }

    const [rows] = await pool.query(
      `SELECT ${selectExpr}, COUNT(*) AS count
         FROM personnel
        WHERE created_at BETWEEN ? AND ?
        GROUP BY ${groupExpr}
        ORDER BY ${orderExpr}`,
      [from, `${to} 23:59:59`]
    );

    // compute cumulative
    let cum = 0;
    const data = rows.map(r => {
      cum += Number(r.count);
      return { period: r.period, count: Number(r.count), cumulative: cum };
    });

    res.json({ granularity, from, to, data, periodFormat });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/analytics/utilization
 * Query:
 *  - from=YYYY-MM-DD  (default: today)
 *  - weeks=number     (default: 12) -> returns weekly utilization buckets for each personnel
 *  - personnel_id?    (optional) if provided, returns only that person
 *
 * Returns: { from, weeks, bucketStartDates: [YYYY-MM-DD...], data: [ { personnel_id, name, role_title, weekly: [0..100] } ] }
 */
router.get('/analytics/utilization', async (req, res, next) => {
  try {
    const from = req.query.from || new Date().toISOString().slice(0, 10);
    const weeks = Math.max(1, Math.min(26, parseInt(req.query.weeks || '12', 10)));
    const personnelIdFilter = req.query.personnel_id ? Number(req.query.personnel_id) : null;

    // Get personnel list (optionally 1 person)
    let people;
    if (personnelIdFilter) {
      const [one] = await pool.query(
        `SELECT id, name, role_title FROM personnel WHERE id = ?`,
        [personnelIdFilter]
      );
      people = one;
    } else {
      const [all] = await pool.query(`SELECT id, name, role_title FROM personnel ORDER BY id`);
      people = all;
    }

    // Generate week bucket start dates
    const startDate = new Date(`${from}T00:00:00`);
    const bucketStartDates = [];
    for (let i = 0; i < weeks; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i * 7);
      bucketStartDates.push(d.toISOString().slice(0,10));
    }

    // For each person, compute weekly utilization = sum of percent_alloc overlapping that week (capped 100)
    const data = [];
    for (const p of people) {
      const weekly = [];
      for (let i = 0; i < weeks; i++) {
        const bStart = bucketStartDates[i];
        const bEndDate = new Date(`${bStart}T00:00:00`);
        bEndDate.setDate(bEndDate.getDate() + 6); // 7-day bucket
        const bEnd = bEndDate.toISOString().slice(0,10);

        const [rows] = await pool.query(
          `SELECT percent_alloc FROM allocations
            WHERE personnel_id = ?
              AND (start_date <= ?)
              AND (end_date IS NULL OR end_date >= ?)`,
          [p.id, bEnd, bStart]
        );
        const sum = rows.reduce((acc, r) => acc + (r.percent_alloc || 0), 0);
        weekly.push(Math.min(100, sum));
      }
      data.push({
        personnel_id: p.id,
        name: p.name,
        role_title: p.role_title,
        weekly
      });
    }

    res.json({ from, weeks, bucketStartDates, data });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
