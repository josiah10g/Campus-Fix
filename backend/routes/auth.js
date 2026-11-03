// backend/routes/auth.js
// Authentication routes: register, login, me
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * Public registration for 'student' and 'staff' roles only.
 */
router.post('/register', async (req, res, next) => {
  try {
    let { name, email, password, role, faculty, department, student_id, level, staff_type } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    name = name.trim();
    email = email.trim().toLowerCase();

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Role validation: public registration allows only 'student' or 'staff'
    // Default to 'student' if not specified or if an invalid role was sent
    const validRoles = ['student', 'staff'];
    const assignedRole = validRoles.includes(role) ? role : 'student';

    if (assignedRole === 'student') {
      const studentFields = [
        ['faculty', faculty, 100],
        ['department', department, 100],
        ['student ID', student_id, 60],
        ['level', level, 40],
      ];
      for (const [label, value, maxLength] of studentFields) {
        if (typeof value !== 'string' || !value.trim()) {
          return res.status(400).json({ error: `${label} is required for students.` });
        }
        if (value.trim().length > maxLength) {
          return res.status(400).json({ error: `${label} cannot exceed ${maxLength} characters.` });
        }
      }
      faculty = faculty.trim();
      department = department.trim();
      student_id = student_id.trim();
      level = level.trim();
      staff_type = null;
    } else {
      const staffTypes = ['Lecturer', 'Maintenance officer'];
      if (!staffTypes.includes(staff_type)) {
        return res.status(400).json({ error: 'Select Lecturer or Maintenance officer.' });
      }
      faculty = null;
      department = null;
      student_id = null;
      level = null;
    }

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role, faculty, department, student_id, level, staff_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, role, faculty, department, student_id, level, staff_type, created_at`,
      [name, email, passwordHash, assignedRole, faculty, department, student_id, level, staff_type]
    );

    const user = insertResult.rows[0];

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server authentication is not configured.' });
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '1d' });

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns JWT token + user info.
 */
router.post('/login', async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    email = String(email).trim().toLowerCase();

    // Query user including password_hash
    const result = await query(
      'SELECT id, name, email, password_hash, role, faculty, department, student_id, level, staff_type, profile_picture_url, created_at FROM users WHERE email = $1',
      [email]
    );

    // Use generic error for wrong email or wrong password to avoid user enumeration
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRecord = result.rows[0];
    const passwordMatch = await bcrypt.compare(String(password), userRecord.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Never return password_hash in response
    const { password_hash, ...user } = userRecord;

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server authentication is not configured.' });
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '1d' });

    res.json({
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/** Update the signed-in user's own account and optional profile picture URL. */
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    let { name, email, password, faculty, department, student_id, level, staff_type, profile_picture_url } = req.body;
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (name.trim().length > 60) return res.status(400).json({ error: 'Full name cannot exceed 60 characters.' });
    if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ error: 'Email address is required.' });
    email = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password !== undefined && password !== '' && (typeof password !== 'string' || password.length < 8)) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const picture = typeof profile_picture_url === 'string' ? profile_picture_url.trim() : '';
    const isImageData = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(picture);
    const isImageUrl = /^https?:\/\//i.test(picture) && picture.length <= 2048;
    if (picture && !isImageData && !isImageUrl) {
      return res.status(400).json({ error: 'Choose a PNG, JPEG, or WebP image up to 1 MB.' });
    }
    if (isImageData && picture.length > 1400000) return res.status(400).json({ error: 'Profile picture must be 1 MB or smaller.' });

    if (req.user.role === 'student') {
      const studentDetails = [['faculty', faculty, 100], ['department', department, 100], ['student ID', student_id, 60], ['level', level, 40]];
      for (const [label, value, max] of studentDetails) {
        if (typeof value !== 'string' || !value.trim()) return res.status(400).json({ error: `${label} is required.` });
        if (value.trim().length > max) return res.status(400).json({ error: `${label} cannot exceed ${max} characters.` });
      }
    }
    if (req.user.role === 'staff' && !['Lecturer', 'Maintenance officer'].includes(staff_type)) {
      return res.status(400).json({ error: 'Select Lecturer or Maintenance officer.' });
    }

    const duplicate = await query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, req.user.id]);
    if (duplicate.rows.length) return res.status(409).json({ error: 'An account with this email already exists.' });

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const result = await query(
      `UPDATE users SET name = $1, email = $2,
        password_hash = COALESCE($3, password_hash),
        faculty = $4, department = $5, student_id = $6, level = $7,
        staff_type = $8, profile_picture_url = $9
       WHERE id = $10
       RETURNING id, name, email, role, faculty, department, student_id, level, staff_type, profile_picture_url, created_at`,
      [name.trim(), email, passwordHash, faculty?.trim() || null, department?.trim() || null,
        student_id?.trim() || null, level?.trim() || null, staff_type || null, picture || null, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, faculty, department, student_id, level, staff_type, profile_picture_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
