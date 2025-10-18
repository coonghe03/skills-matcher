require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Health route for quick checks
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'resource-api', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
