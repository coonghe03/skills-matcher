const express = require('express');
const { validationResult } = require('express-validator');
const { pool } = require('../db');
const { parsePagination } = require('../lib/pagination');
const { createPersonnelRules, updatePersonnelRules } = require('../validators');

const router = express.Router();

/**
 * GET /api/personnel
 * Optional query: page, limit, q (search by name/role_title), level (Junior|Mid|Senior)
 */
router.get('/', async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { q, level } = req.query;

    const where = [];
    const params = [];

    if (q) {
      where.push('(name LIKE ? OR role_title LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (level) {
      where.push('experience_level = ?');
      params.push(level);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM personnel ${whereSql}`, params
    );
    const [rows] = await pool.query(
      `SELECT id, name, role_title, experience_level, created_at
       FROM personnel ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ page, limit, total, data: rows });
  } catch (e) {
    next(e);
  }
});

/** GET /api/personnel/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query(
      'SELECT id, name, role_title, experience_level, created_at FROM personnel WHERE id = ?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Personnel not found' });
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

/** POST /api/personnel */
router.post('/', createPersonnelRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const { name, role_title, experience_level } = req.body;
    const [result] = await pool.query(
      'INSERT INTO personnel (name, role_title, experience_level) VALUES (?,?,?)',
      [name, role_title, experience_level]
    );
    const [rows] = await pool.query('SELECT * FROM personnel WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) {
    next(e);
  }
});

/** PUT /api/personnel/:id */
router.put('/:id', updatePersonnelRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const id = Number(req.params.id);
    const { name, role_title, experience_level } = req.body;
    const [result] = await pool.query(
      'UPDATE personnel SET name=?, role_title=?, experience_level=? WHERE id=?',
      [name, role_title, experience_level, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Personnel not found' });
    const [rows] = await pool.query('SELECT * FROM personnel WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

/** DELETE /api/personnel/:id */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const [result] = await pool.query('DELETE FROM personnel WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Personnel not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
