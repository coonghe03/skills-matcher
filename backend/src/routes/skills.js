const express = require('express');
const { validationResult } = require('express-validator');
const { pool } = require('../db');
const { parsePagination } = require('../lib/pagination');
const { createSkillRules, updateSkillRules } = require('../validators');

const router = express.Router();

/**
 * GET /api/skills
 * Optional: page, limit, q (search in name/category), category
 */
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { q, category } = req.query;

    const where = [];
    const params = [];

    if (q) {
      where.push('(name LIKE ? OR category LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM skills ${whereSql}`, params
    );
    const [rows] = await pool.query(
      `SELECT id, category, name
       FROM skills ${whereSql}
       ORDER BY category ASC, name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ page, limit, total, data: rows });
  } catch (e) {
    next(e);
  }
});

/** POST /api/skills */
router.post('/', createSkillRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { category, name } = req.body;
    await pool.query('INSERT INTO skills (category, name) VALUES (?,?)', [category, name]);
    const [[row]] = await pool.query(
      'SELECT id, category, name FROM skills WHERE category=? AND name=?',
      [category, name]
    );
    res.status(201).json(row);
  } catch (e) {
    // Handle duplicate (unique constraint on category+name)
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Skill already exists in this category' });
    }
    next(e);
  }
});

/** PUT /api/skills/:id */
router.put('/:id', updateSkillRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const id = Number(req.params.id);
    const { category, name } = req.body;
    const [result] = await pool.query(
      'UPDATE skills SET category=?, name=? WHERE id=?',
      [category, name, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Skill not found' });
    const [rows] = await pool.query('SELECT id, category, name FROM skills WHERE id=?', [id]);
    res.json(rows[0]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Skill already exists in this category' });
    }
    next(e);
  }
});

/** DELETE /api/skills/:id */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM skills WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Skill not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
