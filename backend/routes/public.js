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
    const { search = '', status, category } = req.query;
    const allowedQueryKeys = ['search', 'status', 'category', 'page', 'limit'];
    const unknownKey = Object.keys(req.query).find((key) => !allowedQueryKeys.includes(key));
    if (unknownKey) return res.status(400).json({ error: `Unknown query parameter: ${unknownKey}.` });
    if (typeof search !== 'string') {
      return res.status(400).json({ error: 'Search must be a single text value.' });
    }
    const parsePositiveInt = (value, fallback, name, maximum) => {
      if (value === undefined) return fallback;
      if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || (maximum && Number(value) > maximum)) {
        throw Object.assign(new Error(`${name} must be a positive integer${maximum ? ` no greater than ${maximum}` : ''}.`), { status: 400 });
      }
      return Number(value);
    };
    const page = parsePositiveInt(req.query.page, 1, 'Page');
    const requestedLimit = parsePositiveInt(req.query.limit, 8, 'Limit');
    const limit = Math.min(requestedLimit, 20);
    const allowedStatuses = ['Open', 'In Progress', 'Resolved'];
    const allowedCategories = ['Electrical', 'Plumbing', 'Furniture', 'Network', 'Other'];
    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status must be Open, In Progress, or Resolved.' });
    }
    if (category !== undefined && !allowedCategories.includes(category)) {
      return res.status(400).json({ error: 'Category must be Electrical, Plumbing, Furniture, Network, or Other.' });
    }

    const conditions = [];
    const values = [];
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }
    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(title ILIKE $${values.length} OR location ILIKE $${values.length})`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countResult = await query(`SELECT COUNT(*)::int AS total FROM issues ${where}`, values);
    const total = countResult.rows[0].total;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const pageValues = [...values, limit, offset];
    const sql = `
      SELECT
        id,
        title,
        location,
        category,
        status,
        created_at
      FROM issues
      ${where}
      ORDER BY created_at DESC
      LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}
    `;

    const result = await query(sql, pageValues);
    res.json({ issues: result.rows, total, page, totalPages });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

