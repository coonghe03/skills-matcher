const express = require('express');
const { validationResult } = require('express-validator');
const { pool } = require('../db');
const { upsertPersonnelSkillRules } = require('../validators');

const router = express.Router({ mergeParams: true });

/** GET /api/personnel/:personnelId/skills */
router.get('/', async (req, res, next) => {
  try {
    const personnelId = Number(req.params.personnelId);
    const [rows] = await pool.query(
      `SELECT ps.skill_id, s.category, s.name, ps.proficiency
       FROM personnel_skills ps
       JOIN skills s ON s.id = ps.skill_id
       WHERE ps.personnel_id = ?
       ORDER BY s.category, s.name`,
      [personnelId]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** POST /api/personnel/:personnelId/skills  { skill_id, proficiency } (UPSERT) */
router.post('/', upsertPersonnelSkillRules, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const personnelId = Number(req.params.personnelId);
    const { skill_id, proficiency } = req.body;

    // Ensure personnel & skill exist
    const [[p]] = await pool.query('SELECT id FROM personnel WHERE id=?', [personnelId]);
    if (!p) return res.status(404).json({ error: 'Personnel not found' });
    const [[s]] = await pool.query('SELECT id FROM skills WHERE id=?', [skill_id]);
    if (!s) return res.status(404).json({ error: 'Skill not found' });

    await pool.query(
      `INSERT INTO personnel_skills (personnel_id, skill_id, proficiency)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE proficiency = VALUES(proficiency)`,
      [personnelId, skill_id, proficiency]
    );

    const [[row]] = await pool.query(
      `SELECT ps.skill_id, s.category, s.name, ps.proficiency
       FROM personnel_skills ps JOIN skills s ON s.id=ps.skill_id
       WHERE ps.personnel_id=? AND ps.skill_id=?`,
      [personnelId, skill_id]
    );

    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

/** DELETE /api/personnel/:personnelId/skills/:skillId */
router.delete('/:skillId', async (req, res, next) => {
  try {
    const personnelId = Number(req.params.personnelId);
    const skillId = Number(req.params.skillId);
    const [result] = await pool.query(
      'DELETE FROM personnel_skills WHERE personnel_id=? AND skill_id=?',
      [personnelId, skillId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Assignment not found' });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
