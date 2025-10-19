const express = require('express');
const { validationResult } = require('express-validator');
const { pool } = require('../db');
const { parsePagination } = require('../lib/pagination');
const { createProjectRules, updateProjectRules, addRequiredSkillRules } = require('../validators');

const router = express.Router();

/** GET /api/projects  (with basic filters: status, q) */
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { q, status } = req.query;

    const where = [];
    const params = [];

    if (q) {
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (status) {
      where.push('status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM projects ${whereSql}`, params
    );
    const [rows] = await pool.query(
      `SELECT id, name, description, start_date, end_date, status, team_capacity, created_at
       FROM projects ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ page, limit, total, data: rows });
  } catch (e) {
    next(e);
  }
});

/** GET /api/projects/:id (include required skills) */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [[proj]] = await pool.query('SELECT * FROM projects WHERE id=?', [id]);
    if (!proj) return res.status(404).json({ error: 'Project not found' });

    const [reqSkills] = await pool.query(
      `SELECT prs.skill_id, s.category, s.name, prs.min_proficiency
       FROM project_required_skills prs
       JOIN skills s ON s.id=prs.skill_id
       WHERE prs.project_id=? ORDER BY s.category, s.name`,
      [id]
    );

    res.json({ ...proj, required_skills: reqSkills });
  } catch (e) {
    next(e);
  }
});

/** POST /api/projects */
router.post('/', createProjectRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, start_date, end_date, status, team_capacity } = req.body;
    const [result] = await pool.query(
      `INSERT INTO projects (name, description, start_date, end_date, status, team_capacity)
       VALUES (?,?,?,?,?,?)`,
      [name, description || null, start_date || null, end_date || null, status, team_capacity]
    );
    const [[row]] = await pool.query('SELECT * FROM projects WHERE id=?', [result.insertId]);
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

/** PUT /api/projects/:id */
router.put('/:id', updateProjectRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const id = Number(req.params.id);
    const { name, description, start_date, end_date, status, team_capacity } = req.body;
    const [result] = await pool.query(
      `UPDATE projects SET name=?, description=?, start_date=?, end_date=?, status=?, team_capacity=?
       WHERE id=?`,
      [name, description || null, start_date || null, end_date || null, status, team_capacity, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });
    const [[row]] = await pool.query('SELECT * FROM projects WHERE id=?', [id]);
    res.json(row);
  } catch (e) {
    next(e);
  }
});

/** DELETE /api/projects/:id */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM projects WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

/** GET required skills list for a project */
router.get('/:projectId/required-skills', async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const [rows] = await pool.query(
      `SELECT prs.skill_id, s.category, s.name, prs.min_proficiency
       FROM project_required_skills prs
       JOIN skills s ON s.id=prs.skill_id
       WHERE prs.project_id=? ORDER BY s.category, s.name`,
      [projectId]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** POST add/update required skill */
router.post('/:projectId/required-skills', addRequiredSkillRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const projectId = Number(req.params.projectId);
    const { skill_id, min_proficiency } = req.body;

    const [[p]] = await pool.query('SELECT id FROM projects WHERE id=?', [projectId]);
    if (!p) return res.status(404).json({ error: 'Project not found' });

    const [[s]] = await pool.query('SELECT id FROM skills WHERE id=?', [skill_id]);
    if (!s) return res.status(404).json({ error: 'Skill not found' });

    await pool.query(
      `INSERT INTO project_required_skills (project_id, skill_id, min_proficiency)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE min_proficiency=VALUES(min_proficiency)`,
      [projectId, skill_id, min_proficiency]
    );

    const [[row]] = await pool.query(
      `SELECT prs.skill_id, s.category, s.name, prs.min_proficiency
       FROM project_required_skills prs JOIN skills s ON s.id=prs.skill_id
       WHERE prs.project_id=? AND prs.skill_id=?`,
      [projectId, skill_id]
    );

    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

/** DELETE a required skill */
router.delete('/:projectId/required-skills/:skillId', async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    const skillId = Number(req.params.skillId);
    const [result] = await pool.query(
      'DELETE FROM project_required_skills WHERE project_id=? AND skill_id=?',
      [projectId, skillId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Required skill not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
