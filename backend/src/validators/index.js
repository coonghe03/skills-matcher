const { body, param } = require('express-validator');

const experienceLevels = ['Junior', 'Mid', 'Senior'];

const createPersonnelRules = [
  body('name').isString().trim().isLength({ min: 2, max: 120 })
    .withMessage('Name must be 2–120 characters'),
  body('role_title').isString().trim().isLength({ min: 2, max: 120 })
    .withMessage('Role/Title must be 2–120 characters'),
  body('experience_level').isIn(experienceLevels)
    .withMessage(`experience_level must be one of: ${experienceLevels.join(', ')}`)
];

const updatePersonnelRules = [
  ...createPersonnelRules,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer')
];

const createSkillRules = [
  body('category').isString().trim().isLength({ min: 2, max: 100 })
    .withMessage('Category must be 2–100 characters'),
  body('name').isString().trim().isLength({ min: 1, max: 100 })
    .withMessage('Skill name must be 1–100 characters')
];

const updateSkillRules = [
  ...createSkillRules,
  param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer')
];

module.exports = {
  createPersonnelRules,
  updatePersonnelRules,
  createSkillRules,
  updateSkillRules
};
