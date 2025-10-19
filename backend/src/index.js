require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const personnelRoutes = require('./routes/personnel');
const personnelSkillsRoutes = require('./routes/personnelSkills'); // NEW
const skillsRoutes = require('./routes/skills');
const projectsRoutes = require('./routes/projects');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'resource-api', timestamp: new Date().toISOString() });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: true, db: rows[0].ok === 1 });
  } catch (e) {
    console.error('DB health error:', e);
    res.status(500).json({ ok: false, error: 'DB connection failed' });
  }
});

// Mount CRUD
app.use('/api/personnel', personnelRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/personnel/:personnelId/skills', personnelSkillsRoutes); // mount nested
app.use('/api/skills', skillsRoutes);
app.use('/api/projects', projectsRoutes);

// 404 & error handlers
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
