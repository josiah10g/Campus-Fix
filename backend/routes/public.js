// backend/routes/public.js
// Public read-only endpoints (no authentication required)
const express = require('express');
const rateLimit = require('express-rate-limit');
const { query } = require('../db');

const router = express.Router();

// Apply rate limiting to all /api/public/* routes (e.g. max 100 requests per 15 minutes)
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' },
});

router.use(publicLimiter);

/**
 * GET /api/public/stats
 * Public counts of issues: total, open, inProgress, resolved
 */
router.get('/stats', async (req, res, next) => {
  try {
    const totalQuery = 'SELECT COUNT(*)::int AS count FROM issues';
    const openQuery = "SELECT COUNT(*)::int AS count FROM issues WHERE status = 'Open'";
    const inProgressQuery = "SELECT COUNT(*)::int AS count FROM issues WHERE status = 'In Progress'";
    const resolvedQuery = "SELECT COUNT(*)::int AS count FROM issues WHERE status = 'Resolved'";

    const [totalRes, openRes, inProgressRes, resolvedRes] = await Promise.all([
      query(totalQuery),
      query(openQuery),
      query(inProgressQuery),
      query(resolvedQuery),
    ]);

    res.json({
      total: totalRes.rows[0].count,
      open: openRes.rows[0].count,
      inProgress: inProgressRes.rows[0].count,
      resolved: resolvedRes.rows[0].count,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/issues
 * Returns the latest public issues (default 8, maximum 20).
 * PRIVACY GUARANTEE:
 * Returns ONLY id, title, location, category, status, and created_at.
 * NEVER returns reporter_name, reporter_email, reporter_id, or description.
 */
router.get('/issues', async (req, res, next) => {
  try {
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) {
      limit = 8;
    } else if (limit > 20) {
      limit = 20;
    }

    const sql = `
      SELECT
        id,
        title,
        location,
        category,
        status,
        created_at
      FROM issues
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
