// backend/routes/issues.js
// Issue CRUD routes with full role and ownership permission checks
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Allowed categories and statuses per spec
const ALLOWED_CATEGORIES = ['Electrical', 'Plumbing', 'Furniture', 'Network', 'Other'];
const ALLOWED_STATUSES = ['Open', 'In Progress', 'Resolved'];

/**
 * GET /api/issues
 * List all issues, newest first.
 * Optional query params:
 *   ?status=Open
 *   ?category=Electrical
 *   ?search=keyword (matches title or description)
 *   ?myReports=true (filters to current user's issues)
 */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, category, search, myReports } = req.query;

    const conditions = [];
    const values = [];

    if (status && ALLOWED_STATUSES.includes(status)) {
      values.push(status);
      conditions.push(`i.status = $${values.length}`);
    }

    if (category && ALLOWED_CATEGORIES.includes(category)) {
      values.push(category);
      conditions.push(`i.category = $${values.length}`);
    }

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(i.title ILIKE $${values.length} OR i.description ILIKE $${values.length})`);
    }

    if (myReports === 'true') {
      values.push(req.user.id);
      conditions.push(`i.reporter_id = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        i.id,
        i.title,
        i.description,
        i.category,
        i.category_detail,
        i.location,
        i.status,
        i.reporter_id,
        u.name AS reporter_name,
        u.role AS reporter_role,
        u.faculty AS reporter_faculty,
        u.department AS reporter_department,
        u.level AS reporter_level,
        u.student_id AS reporter_student_id,
        i.created_at
      FROM issues i
      JOIN users u ON i.reporter_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
    `;

    const result = await query(sql, values);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/issues/:id
 * Retrieve a single issue with reporter info
 */
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const issueId = parseInt(req.params.id, 10);
    if (isNaN(issueId)) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const sql = `
      SELECT
        i.id,
        i.title,
        i.description,
        i.category,
        i.category_detail,
        i.location,
        i.status,
        i.reporter_id,
        u.name AS reporter_name,
        u.role AS reporter_role,
        u.faculty AS reporter_faculty,
        u.department AS reporter_department,
        u.level AS reporter_level,
        u.student_id AS reporter_student_id,
        i.created_at
      FROM issues i
      JOIN users u ON i.reporter_id = u.id
      WHERE i.id = $1
    `;

    const result = await query(sql, [issueId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/issues
 * Create a new issue. Any logged-in user can report.
 * Reporter ID is securely taken from req.user.id (token), never request body.
 */
router.post('/', requireAuth, async (req, res, next) => {
  try {
    let { title, description, category, category_detail, location } = req.body;

    // Server-side validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    title = title.trim();
    if (title.length > 100) {
      return res.status(400).json({ error: 'Title cannot exceed 100 characters.' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description is required.' });
    }
    description = description.trim();

    if (!category || !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`,
      });
    }

    if (category === 'Other') {
      if (typeof category_detail !== 'string' || !category_detail.trim()) {
        return res.status(400).json({ error: 'Please describe the issue category.' });
      }
      category_detail = category_detail.trim();
      if (category_detail.length > 100) {
        return res.status(400).json({ error: 'The category description cannot exceed 100 characters.' });
      }
    } else {
      category_detail = null;
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      return res.status(400).json({ error: 'Location is required.' });
    }
    location = location.trim();
    if (location.length > 100) {
      return res.status(400).json({ error: 'Location cannot exceed 100 characters.' });
    }

    // Default status is always 'Open' on creation
    const insertSql = `
      INSERT INTO issues (title, description, category, category_detail, location, status, reporter_id)
       VALUES ($1, $2, $3, $4, $5, 'Open', $6)
       RETURNING *
    `;

    const result = await query(insertSql, [
      title,
      description,
      category,
      category_detail,
      location,
      req.user.id,
    ]);

    const createdIssue = result.rows[0];
    createdIssue.reporter_name = req.user.name;

    res.status(201).json(createdIssue);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/issues/:id
 * Update issue fields.
 * Permission rules:
 * - Details (title, description, category, location):
 *   - The owner can update IF current status is 'Open'.
 *   - Maintenance, admin, and super_admin can update ANY issue.
 * - Status field:
 *   - Only maintenance, admin, and super_admin can change status.
 *   - Students and staff receive 403 if they attempt to change status (even on their own issue).
 */
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const issueId = parseInt(req.params.id, 10);
    if (isNaN(issueId)) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    // Fetch existing issue to check ownership and state
    const existingResult = await query('SELECT * FROM issues WHERE id = $1', [issueId]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const existing = existingResult.rows[0];
    const user = req.user;
    const isOwner = existing.reporter_id === user.id;
    const isPrivilegedStaff = ['maintenance', 'admin', 'super_admin'].includes(user.role);

    let { title, description, category, category_detail, location, status } = req.body;

    // Statuses are read-only; this remains enforced even when a request bypasses the UI.
    if (status !== undefined && status !== existing.status) {
      return res.status(403).json({ error: 'Issue status is read-only.' });
    }
    status = existing.status;

    // Check detail edit permission:
    // If user is neither privileged staff nor (owner with Open status), reject with 403
    if (!isPrivilegedStaff) {
      if (!isOwner) {
        return res.status(403).json({
          error: "You don't have permission to edit this issue.",
        });
      }
      if (existing.status !== 'Open') {
        return res.status(403).json({
          error: 'Issues that are In Progress or Resolved can no longer be edited by reporters.',
        });
      }
    }

    // Validate details if provided
    let newTitle = title !== undefined ? String(title).trim() : existing.title;
    if (!newTitle) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (newTitle.length > 100) {
      return res.status(400).json({ error: 'Title cannot exceed 100 characters.' });
    }

    let newDescription = description !== undefined ? String(description).trim() : existing.description;
    if (!newDescription) {
      return res.status(400).json({ error: 'Description is required.' });
    }

    let newCategory = category !== undefined ? category : existing.category;
    if (!ALLOWED_CATEGORIES.includes(newCategory)) {
      return res.status(400).json({
        error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`,
      });
    }

    let newCategoryDetail = category_detail !== undefined
      ? String(category_detail).trim()
      : existing.category_detail;
    if (newCategory === 'Other') {
      if (!newCategoryDetail) {
        return res.status(400).json({ error: 'Please describe the issue category.' });
      }
      if (newCategoryDetail.length > 100) {
        return res.status(400).json({ error: 'The category description cannot exceed 100 characters.' });
      }
    } else {
      newCategoryDetail = null;
    }

    let newLocation = location !== undefined ? String(location).trim() : existing.location;
    if (!newLocation) {
      return res.status(400).json({ error: 'Location is required.' });
    }
    if (newLocation.length > 100) {
      return res.status(400).json({ error: 'Location cannot exceed 100 characters.' });
    }

    const updateSql = `
      UPDATE issues
      SET title = $1, description = $2, category = $3, category_detail = $4, location = $5, status = $6
      WHERE id = $7
      RETURNING *
    `;

    const updateResult = await query(updateSql, [
      newTitle,
      newDescription,
      newCategory,
      newCategoryDetail,
      newLocation,
      status,
      issueId,
    ]);

    // Fetch joined reporter details for response
    const fetchSql = `
      SELECT
        i.id, i.title, i.description, i.category, i.category_detail, i.location, i.status,
        i.reporter_id, u.name AS reporter_name, i.created_at
      FROM issues i
      JOIN users u ON i.reporter_id = u.id
      WHERE i.id = $1
    `;
    const finalResult = await query(fetchSql, [issueId]);

    res.json(finalResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/issues/:id
 * Delete issue.
 * Permission rules:
 * - The owner while status is 'Open'.
 * - Admin and super_admin on any issue.
 * - Otherwise 403.
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const issueId = parseInt(req.params.id, 10);
    if (isNaN(issueId)) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const existingResult = await query('SELECT * FROM issues WHERE id = $1', [issueId]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found.' });
    }

    const existing = existingResult.rows[0];
    const user = req.user;
    const isOwner = existing.reporter_id === user.id;
    const isAdmin = ['admin', 'super_admin'].includes(user.role);

    if (!isAdmin) {
      if (!isOwner) {
        return res.status(403).json({
          error: "You don't have permission to delete this issue.",
        });
      }
      if (existing.status !== 'Open') {
        return res.status(403).json({
          error: 'Only open issues can be deleted by the reporter.',
        });
      }
    }

    await query('DELETE FROM issues WHERE id = $1', [issueId]);
    res.json({ message: 'Issue deleted successfully.', id: issueId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
