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


const idParam = param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer');

const proficiencyRule = body('proficiency')
  .isInt({ min: 1, max: 5 })
  .withMessage('proficiency must be an integer 1–5');

const skillIdRule = body('skill_id')
  .isInt({ gt: 0 })
  .withMessage('skill_id must be a positive integer');

const createProjectRules = [
  body('name').isString().trim().isLength({ min: 2, max: 150 }),
  body('description').optional().isString(),
  body('start_date').optional().isISO8601().withMessage('start_date must be YYYY-MM-DD'),
  body('end_date').optional().isISO8601().withMessage('end_date must be YYYY-MM-DD'),
  body('status').isIn(['Planning', 'Active', 'Completed']),
  body('team_capacity').isInt({ min: 1 }).withMessage('team_capacity must be >= 1')
];

const updateProjectRules = [
  idParam,
  ...createProjectRules
];

const addRequiredSkillRules = [
  param('projectId').isInt({ gt: 0 }).withMessage('projectId must be a positive integer'),
  skillIdRule,
  body('min_proficiency').isInt({ min: 1, max: 5 })
    .withMessage('min_proficiency must be 1–5')
];

const upsertPersonnelSkillRules = [
  param('personnelId').isInt({ gt: 0 }).withMessage('personnelId must be a positive integer'),
  skillIdRule,
  proficiencyRule
];

module.exports = {
  createPersonnelRules,
  updatePersonnelRules,
  createSkillRules,
  updateSkillRules,
  createProjectRules,
  updateProjectRules,
  addRequiredSkillRules,
  upsertPersonnelSkillRules
};