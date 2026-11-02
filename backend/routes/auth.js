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
    let { name, email, password, role } = req.body;

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

    // Check if email already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, assignedRole]
    );

    const user = insertResult.rows[0];

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
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
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = $1',
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

    const secret = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
    const token = jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '1d' });

    res.json({
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Returns current authenticated user profile
 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
