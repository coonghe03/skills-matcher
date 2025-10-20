require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { pool } = require('./db');

const personnelRoutes = require('./routes/personnel');
const personnelSkillsRoutes = require('./routes/personnelSkills');
const skillsRoutes = require('./routes/skills');
const projectsRoutes = require('./routes/projects');
const allocationRoutes = require('./routes/allocations');
const matchProxyRoutes = require('./routes/matchProxy');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Trust proxy (important if behind a reverse proxy)
app.set('trust proxy', 1);

// Security + perf
app.use(helmet());
app.use(compression());

// Logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS (configurable)
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin }));

// Body parser
app.use(express.json());

// Rate limit (basic): 100 req / 15 mins / IP for API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api', limiter);

// Health endpoints
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

// API Routers
app.use('/api/personnel', personnelRoutes);
app.use('/api/personnel/:personnelId/skills', personnelSkillsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api', allocationRoutes);
app.use('/api', matchProxyRoutes);
app.use('/api', analyticsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
