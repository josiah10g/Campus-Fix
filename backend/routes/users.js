// backend/routes/users.js
// User management routes (super_admin only)
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Enforce requireAuth and super_admin role for all /api/users endpoints
router.use(requireAuth, requireRole('super_admin'));

const VALID_ROLES = ['student', 'staff', 'maintenance', 'admin', 'super_admin'];

/**
 * GET /api/users
 * List all users without password hashes
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Create a user with any valid role (e.g., maintenance, admin)
 */
router.post('/', async (req, res, next) => {
  try {
    let { name, email, password, role } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${VALID_ROLES.join(', ')}.`,
      });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );

    res.status(201).json({
      message: 'User created successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/users/:id/role
 * Change a user's role.
 * Restrictions:
 * - Cannot change your own role.
 * - Cannot remove/demote the last remaining super_admin.
 */
router.put('/:id/role', async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (isNaN(targetUserId)) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: `Role must be one of: ${VALID_ROLES.join(', ')}.`,
      });
    }

    // Prevent changing your own role
    if (req.user.id === targetUserId) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    // Check target user
    const targetResult = await query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const targetUser = targetResult.rows[0];

    // If target is currently super_admin and being changed to something else, check if another super_admin exists
    if (targetUser.role === 'super_admin' && role !== 'super_admin') {
      const superAdminCountResult = await query(
        "SELECT COUNT(*)::int AS count FROM users WHERE role = 'super_admin'"
      );
      if (superAdminCountResult.rows[0].count <= 1) {
        return res.status(400).json({
          error: 'Cannot demote the last remaining super_admin account.',
        });
      }
    }

    const updateResult = await query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING id, name, email, role, created_at`,
      [role, targetUserId]
    );

    res.json({
      message: 'User role updated successfully.',
      user: updateResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
