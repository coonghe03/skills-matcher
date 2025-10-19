const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();

// GET /api/match/:projectId?sort=fit|availability
router.get('/match/:projectId', async (req, res, next) => {
  try {
    const base = process.env.MATCHING_SERVICE_URL || 'http://localhost:5100';
    const url = `${base}/match/${req.params.projectId}?sort=${encodeURIComponent(req.query.sort || 'fit')}`;
    const r = await fetch(url);
    const j = await r.json();
    res.status(r.status).json(j);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
