const express = require('express');
const { pool } = require('../db');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

const createRules = [
  body('project_id').isInt({ gt: 0 }),
  body('personnel_id').isInt({ gt: 0 }),
  body('start_date').isISO8601().withMessage('start_date must be YYYY-MM-DD'),
  body('end_date').optional({ nullable: true }).isISO8601().withMessage('end_date must be YYYY-MM-DD'),
  body('percent_alloc').isInt({ min: 1, max: 100 }).withMessage('percent_alloc 1–100')
];

// overlap check helper
async function currentUtilization(personnelId, startDate, endDate) {
  const [rows] = await pool.query(
    `SELECT percent_alloc FROM allocations
      WHERE personnel_id = ?
        AND (start_date <= ?)
        AND (end_date IS NULL OR end_date >= ?)`,
    [personnelId, endDate, startDate]
  );
  return rows.reduce((a, r) => a + (r.percent_alloc || 0), 0);
}

// GET /api/projects/:projectId/allocations
router.get('/projects/:projectId/allocations', async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const [rows] = await pool.query(
      `SELECT a.id, a.personnel_id, p.name, p.role_title, a.start_date, a.end_date, a.percent_alloc, a.created_at
         FROM allocations a
         JOIN personnel p ON p.id = a.personnel_id
        WHERE a.project_id = ?
        ORDER BY a.start_date DESC, a.id DESC`,
      [projectId]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// POST /api/allocations
router.post('/allocations', createRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { project_id, personnel_id, start_date, end_date, percent_alloc } = req.body;

    // validate foreign keys exist
    const [[proj]] = await pool.query('SELECT id FROM projects WHERE id=?', [project_id]);
    if (!proj) return res.status(404).json({ error: 'Project not found' });
    const [[pers]] = await pool.query('SELECT id FROM personnel WHERE id=?', [personnel_id]);
    if (!pers) return res.status(404).json({ error: 'Personnel not found' });

    const util = await currentUtilization(personnel_id, start_date, end_date || start_date);
    if (util + percent_alloc > 100) {
      return res.status(409).json({ error: 'Over-allocation (>100%) in the selected period' });
    }

    const [result] = await pool.query(
      `INSERT INTO allocations (project_id, personnel_id, start_date, end_date, percent_alloc)
       VALUES (?,?,?,?,?)`,
      [project_id, personnel_id, start_date, end_date || null, percent_alloc]
    );
    const [[row]] = await pool.query('SELECT * FROM allocations WHERE id=?', [result.insertId]);
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/allocations/:id
router.delete('/allocations/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM allocations WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Allocation not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
