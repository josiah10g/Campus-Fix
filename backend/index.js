// backend/index.js
// Main Express server entry point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { initDb, query } = require('./db');
const { requireAuth } = require('./middleware/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, or server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS.`));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Request logging (clean, minimal)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[HTTP] ${req.method} ${req.url}`);
  }
  next();
});

// Root greeting endpoint
app.get('/', (req, res) => res.json({ ok: true, message: 'CampusFix API is live', health: '/api/health' }));

// Health check endpoint for monitoring & Render
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Issue counts / statistics (accessible to all authenticated users)
app.get('/api/stats', requireAuth, async (req, res, next) => {
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

// Routes
const authRoutes = require('./routes/auth');
const issuesRoutes = require('./routes/issues');
const usersRoutes = require('./routes/users');
const publicRoutes = require('./routes/public');

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/users', usersRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Global error handler - never crashes server and logs securely server-side
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message || err);
  const status = err.status || 500;
  const message =
    status === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Something went wrong.';

  res.status(status).json({ error: message });
});

// Bootstrap super admin account if not already present
const ensureSuperAdmin = async () => {
  try {
    const emailSetting = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!emailSetting || !password) throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set.');
    const email = emailSetting.toLowerCase();
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length === 0) {
      const passwordHash = await bcrypt.hash(password, 10);
      await query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'super_admin')`,
        ['Super Admin', email, passwordHash]
      );
      console.log('[Auth] Created initial super_admin account.');
    }
  } catch (err) {
    console.error('[Auth] Error checking or creating super admin:', err.message);
  }
};

// Start server function
const startServer = async () => {
  try {
    if (process.env.NODE_ENV !== 'test' && (process.env.DATABASE_URL || process.env.SUPABASE_DB_URL)) {
      await initDb();
      await ensureSuperAdmin();
    }
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`[CampusFix Server] Running on port ${PORT}`);
      });
    }
  } catch (err) {
    console.error('[Startup] Failed to initialize server:', err.message);
  }
};

startServer();

module.exports = app;
