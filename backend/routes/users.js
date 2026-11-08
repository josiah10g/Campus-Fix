// backend/routes/users.js
// User management routes (admin and super_admin)
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Keep user access and role changes protected on the server.
router.use(requireAuth, requireRole('admin', 'super_admin'));

const VALID_ROLES = ['student', 'staff', 'maintenance', 'admin', 'super_admin'];

/**
 * GET /api/users
 * List all users without password hashes
 */
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, name, email, role, faculty, department, student_id, level, staff_type, profile_picture_url, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ users: result.rows, total: result.rows.length });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/users
 * Create a user with any valid role (e.g., student, staff, maintenance, admin)
 */
router.post('/', async (req, res, next) => {
  try {
    let { name, email, password, role, faculty, department, student_id, level } = req.body;

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
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only a super admin can create another super admin.' });
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

    if (student_id && role === 'student') {
      student_id = student_id.trim();
      if (!/^\d{1,9}$/.test(student_id)) {
        return res.status(400).json({ error: 'Matric number must be at most 9 digits (numbers only).' });
      }
      const existingMatric = await query('SELECT id FROM users WHERE student_id = $1', [student_id]);
      if (existingMatric.rows.length > 0) {
        return res.status(409).json({ error: 'A student account with this matric number already exists.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Mark administrator created users as pre-verified so they can log in directly with their assigned password
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, faculty, department, student_id, level, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING id, name, email, role, faculty, department, student_id, level, staff_type, profile_picture_url, created_at`,
      [
        name,
        email,
        passwordHash,
        role,
        faculty?.trim() || null,
        department?.trim() || null,
        student_id?.trim() || null,
        level?.trim() || null,
      ]
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
 */
router.put('/:id/role', async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { role: newRole } = req.body;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (!newRole || !VALID_ROLES.includes(newRole)) {
      return res.status(400).json({
        error: `Role must be one of: ${VALID_ROLES.join(', ')}.`,
      });
    }

    const targetUser = await query('SELECT id, role FROM users WHERE id = $1', [targetUserId]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const currentRole = targetUser.rows[0].role;

    if (currentRole === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only a super admin can modify a super admin account.' });
    }
    if (newRole === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only a super admin can promote a user to super admin.' });
    }

    if (currentRole === 'super_admin' && newRole !== 'super_admin') {
      const superAdminCount = await query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'super_admin'");
      if (superAdminCount.rows[0].count <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last super admin.' });
      }
    }

    const result = await query(
      `UPDATE users SET role = $1
       WHERE id = $2
       RETURNING id, name, email, role, faculty, department, student_id, level, staff_type, profile_picture_url, created_at`,
      [newRole, targetUserId]
    );

    res.json({
      message: 'Role updated successfully.',
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/users/:id
 * Remove a user account and their reports.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const targetUser = await query('SELECT id, role, name FROM users WHERE id = $1', [targetUserId]);
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (targetUser.rows[0].role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only a super admin can delete a super admin account.' });
    }

    if (targetUser.rows[0].role === 'super_admin') {
      const superAdminCount = await query("SELECT COUNT(*)::int AS count FROM users WHERE role = 'super_admin'");
      if (superAdminCount.rows[0].count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last super admin.' });
      }
    }

    await query('DELETE FROM issues WHERE reporter_id = $1', [targetUserId]);
    await query('DELETE FROM users WHERE id = $1', [targetUserId]);

    res.json({ message: `User ${targetUser.rows[0].name} deleted successfully.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
