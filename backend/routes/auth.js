// backend/routes/auth.js
// Authentication routes: register, login, verify-email, resend-verification, me, profile
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sendVerificationEmail, getVerifiedEmail } = require('../lib/supabase');

const router = express.Router();

/**
 * POST /api/auth/register
 * Public registration for 'student' and 'staff' roles only.
 * Creates an unverified account and sends a verification email via Supabase.
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

      // Matric number validation: maximum 9 digits (1 to 9 digits, numeric)
      if (!/^\d{1,9}$/.test(student_id)) {
        return res.status(400).json({ error: 'Matric number must be at most 9 digits (numbers only).' });
      }

      // Uniqueness check for matric number
      const existingMatric = await query('SELECT id FROM users WHERE student_id = $1', [student_id]);
      if (existingMatric.rows.length > 0) {
        return res.status(409).json({ error: 'A student account with this matric number already exists.' });
      }
    } else {
      faculty = null;
      department = null;
      student_id = null;
      level = null;
      staff_type = null;
    }

    // Check if email already exists
    const existing = await query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      // If user exists but is not verified, allow them to re-register (replace unverified profile)
      if (!existing.rows[0].is_verified) {
        await query('DELETE FROM users WHERE id = $1', [existing.rows[0].id]);
      } else {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert user as unverified (is_verified = false)
    const insertResult = await query(
      `INSERT INTO users (name, email, password_hash, role, faculty, department, student_id, level, staff_type, is_verified, verification_token, verification_expires)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, $10, $11)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, assignedRole, faculty, department, student_id, level, staff_type, verificationToken, verificationExpires]
    );

    const user = insertResult.rows[0];

    // Trigger verification email via Supabase & obtain fallback link if email service is delayed/throttled
    let emailResult = { success: false, actionLink: null, emailOtp: null };
    try {
      emailResult = await sendVerificationEmail(email, verificationToken);
    } catch (e) {
      console.error('[Auth] Supabase email trigger error:', e);
    }

    res.status(201).json({
      message: emailResult.success
        ? 'Account created! Please check your email inbox to verify your account before logging in.'
        : 'Account created, but we could not send the verification email. Please try resending it.',
      requiresVerification: true,
      emailSent: Boolean(emailResult.success),
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify-email
 * Marks an account as verified using email and/or token.
 */
router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, token, access_token: accessToken } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const result = await query(
      'SELECT id, is_verified, verification_token, verification_expires FROM users WHERE email = $1',
      [cleanEmail]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    const user = result.rows[0];

    if (user.is_verified) {
      return res.json({ message: 'Email is already verified. You can log in now.', alreadyVerified: true });
    }

    // Require proof from either the server-issued token or a confirmed Supabase session.
    // Merely knowing an account's email must never be enough to verify it.
    let validToken = false;
    if (token) {
      if (token !== user.verification_token) {
        return res.status(400).json({ error: 'Invalid or expired verification link.' });
      }
      if (!user.verification_expires || new Date(user.verification_expires) < new Date()) {
        return res.status(400).json({ error: 'Verification link has expired. Please request a new one.' });
      }
      validToken = true;
    }
    if (accessToken) {
      const confirmedEmail = await getVerifiedEmail(accessToken);
      if (confirmedEmail && confirmedEmail.toLowerCase() === cleanEmail) validToken = true;
    }
    if (!validToken) {
      return res.status(400).json({ error: 'A valid verification link is required.' });
    }

    // Mark user verified
    await query(
      'UPDATE users SET is_verified = true, verification_token = NULL, verification_expires = NULL WHERE id = $1',
      [user.id]
    );

    res.json({ message: 'Email verified successfully! You can now log in.', verified: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/resend-verification
 * Resends the verification email for an unverified account.
 */
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const cleanEmail = String(email).trim().toLowerCase();
    const result = await query('SELECT id, is_verified FROM users WHERE email = $1', [cleanEmail]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    if (result.rows[0].is_verified) {
      return res.json({ message: 'This email is already verified. You can log in.' });
    }

    // Refresh verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await query(
      'UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3',
      [verificationToken, verificationExpires, result.rows[0].id]
    );

    const emailSent = await sendVerificationEmail(cleanEmail, verificationToken);

    if (!emailSent.success) {
      return res.status(emailSent.rateLimited ? 429 : 502).json({
        error: emailSent.error || 'Could not send the verification email. Check the Supabase Auth email settings and try again.',
        rateLimited: Boolean(emailSent.rateLimited),
      });
    }

    res.json({
      message: 'Verification email resent! Please check your inbox (and spam/junk folder).',
      sent: true,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and checks verification status.
 * Blocks unverified accounts (Option A).
 */
router.post('/login', async (req, res, next) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    email = String(email).trim().toLowerCase();

    // Query user including password_hash and is_verified
    const result = await query(
      `SELECT id, name, email, password_hash, role, faculty, department, student_id, level, staff_type, profile_picture_url, is_verified, created_at
       FROM users WHERE email = $1`,
      [email]
    );

    // Specific and helpful error messages for login
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'No account exists with this email address. Please sign up to create an account.',
        notRegistered: true,
        email,
      });
    }

    const userRecord = result.rows[0];
    const passwordMatch = await bcrypt.compare(String(password), userRecord.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Incorrect password. Please re-check your password or reset it.',
        wrongPassword: true,
      });
    }

    // Option A: Block unverified users from logging in
    if (!userRecord.is_verified) {
      return res.status(403).json({
        error: 'Please verify your email address before logging in. Check your inbox for the verification email.',
        unverified: true,
        email: userRecord.email,
      });
    }

    const { password_hash, is_verified, verification_token, verification_expires, ...user } = userRecord;

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

/**
 * PUT /api/auth/profile
 * Update the signed-in user's own account.
 * When password or email is changed, sends a verification email.
 */
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    let { name, email, password, faculty, department, student_id, level, profile_picture_url } = req.body;
    if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Full name is required.' });
    if (name.trim().length > 60) return res.status(400).json({ error: 'Full name cannot exceed 60 characters.' });
    if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ error: 'Email address is required.' });
    email = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

    // Validate new password if changing
    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }
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

      student_id = student_id.trim();
      if (!/^\d{1,9}$/.test(student_id)) {
        return res.status(400).json({ error: 'Matric number must be at most 9 digits (numbers only).' });
      }

      const duplicateMatric = await query('SELECT id FROM users WHERE student_id = $1 AND id <> $2', [student_id, req.user.id]);
      if (duplicateMatric.rows.length) {
        return res.status(409).json({ error: 'A student account with this matric number already exists.' });
      }
    }

    const duplicate = await query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, req.user.id]);
    if (duplicate.rows.length) return res.status(409).json({ error: 'An account with this email already exists.' });

    // Check if user is changing their email address or password
    const currentUserRow = await query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const isChangingEmail = currentUserRow.rows.length > 0 && currentUserRow.rows[0].email !== email;
    const isChangingPassword = Boolean(password && password.trim());

    // Generate new verification token if email or password is being changed
    const verificationToken = (isChangingEmail || isChangingPassword) ? crypto.randomBytes(32).toString('hex') : null;
    const verificationExpires = (isChangingEmail || isChangingPassword) ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const passwordHash = isChangingPassword ? await bcrypt.hash(password, 10) : null;
    const result = await query(
      `UPDATE users SET name = $1, email = $2,
        password_hash = COALESCE($3, password_hash),
        faculty = $4, department = $5, student_id = $6, level = $7,
        profile_picture_url = $8,
        is_verified = CASE WHEN ($10 = true OR $11 = true) THEN false ELSE is_verified END,
        verification_token = COALESCE($12, verification_token),
        verification_expires = COALESCE($13, verification_expires)
       WHERE id = $9
       RETURNING id, name, email, role, faculty, department, student_id, level, staff_type, profile_picture_url, is_verified, created_at`,
      [name.trim(), email, passwordHash, faculty?.trim() || null, department?.trim() || null,
        student_id?.trim() || null, level?.trim() || null, picture || null, req.user.id, isChangingEmail, isChangingPassword, verificationToken, verificationExpires]
    );

    const requiresVerification = isChangingEmail || isChangingPassword;

    let emailSent = true;
    if (requiresVerification) {
      // Trigger Supabase email verification to the new/existing email address
      const emailResult = await sendVerificationEmail(email, verificationToken);
      emailSent = Boolean(emailResult.success);
    }

    res.json({
      user: result.rows[0],
      requiresVerification,
      emailSent,
      message: requiresVerification && emailSent
        ? 'Account updated! We sent a verification email to your inbox to confirm these changes.'
        : requiresVerification
          ? 'Account updated, but we could not send the verification email. Please try resending it.'
        : 'Profile updated successfully.'
    });
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
