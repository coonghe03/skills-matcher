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

    console.log('✅ Seed complete.');
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

seed();
