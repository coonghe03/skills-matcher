require('dotenv').config();
const { pool } = require('../db');

async function seed() {
  try {
    // Seed skills
    const skills = [
      ['Programming Languages', 'JavaScript'],
      ['Programming Languages', 'TypeScript'],
      ['Programming Languages', 'Python'],
      ['Programming Languages', 'Java'],
      ['Frontend', 'React'],
      ['Frontend', 'CSS'],
      ['Backend', 'Node.js'],
      ['DevOps', 'Docker'],
      ['Cloud', 'AWS'],
      ['Data', 'SQL']
    ];

    for (const [category, name] of skills) {
      await pool.query(
        'INSERT IGNORE INTO skills (category, name) VALUES (?,?)',
        [category, name]
      );
    }

    // Seed personnel
    const people = [
      ['Alice Johnson', 'Frontend Developer', 'Mid'],
      ['Ben Silva', 'Backend Developer', 'Senior'],
      ['Chris Rao', 'Full-Stack Developer', 'Junior']
    ];

    for (const [name, role, level] of people) {
      await pool.query(
        'INSERT INTO personnel (name, role_title, experience_level) VALUES (?,?,?)',
        [name, role, level]
      );
    }

        // ----- Projects -----
    const projects = [
      ['Website Redesign', 'Marketing site revamp', '2025-11-01', '2026-01-31', 'Planning', 3],
      ['Client Portal', 'Secure portal for clients', '2025-10-20', '2026-03-15', 'Active', 4]
    ];

    for (const p of projects) {
      await pool.query(
        `INSERT INTO projects (name, description, start_date, end_date, status, team_capacity)
         VALUES (?,?,?,?,?,?)`,
        p
      );
    }

    // Map names -> ids for convenience
    const [[{ last_id: lastSkillId }]] = await pool.query(`SELECT MAX(id) AS last_id FROM skills`);
    const [[{ last_pid: lastProjectId }]] = await pool.query(`SELECT MAX(id) AS last_pid FROM projects`);

    // Required skills for the most recent project
    // (Assumes React, Node.js, SQL exist in skills table)
    const [skillRows] = await pool.query(`SELECT id, name FROM skills WHERE name IN ('React','Node.js','SQL')`);
    const nameToId = Object.fromEntries(skillRows.map(r => [r.name, r.id]));

    // Attach to latest project as example
    if (nameToId['React']) {
      await pool.query(
        `INSERT IGNORE INTO project_required_skills (project_id, skill_id, min_proficiency)
         VALUES (?,?,?)`, [lastProjectId, nameToId['React'], 3]
      );
    }
    if (nameToId['Node.js']) {
      await pool.query(
        `INSERT IGNORE INTO project_required_skills (project_id, skill_id, min_proficiency)
         VALUES (?,?,?)`, [lastProjectId, nameToId['Node.js'], 3]
      );
    }
    if (nameToId['SQL']) {
      await pool.query(
        `INSERT IGNORE INTO project_required_skills (project_id, skill_id, min_proficiency)
         VALUES (?,?,?)`, [lastProjectId, nameToId['SQL'], 2]
      );
    }


    console.log('✅ Seed complete.');
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
