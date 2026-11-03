// backend/middleware/auth.js
// Authentication & Role-based Authorization Middleware
const jwt = require('jsonwebtoken');
const { query } = require('../db');

/**
 * requireAuth:
 * Verifies Bearer JWT from Authorization header.
 * Loads the user from database (omitting password_hash).
 * Attaches user object to req.user.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server authentication is not configured.' });

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }

    const result = await query(
      'SELECT id, name, email, role, faculty, department, student_id, level, staff_type, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error in requireAuth:', error);
    res.status(500).json({ error: 'An unexpected error occurred during authentication.' });
  }
};

/**
 * requireRole:
 * Restricts access to specified roles.
 * Returns 403 Forbidden if user role is not permitted.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "You don't have permission to perform this action.",
      });
    }

    next();
  };
};

module.exports = {
  requireAuth,
  requireRole,
};
