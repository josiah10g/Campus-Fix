// backend/db.js
// Database connection configuration supporting both PostgreSQL pg Pool and Supabase
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Support both SUPABASE_DB_URL, DATABASE_URL, and direct pool configuration
const connectionString =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: isProduction || (connectionString && connectionString.includes('supabase.co'))
    ? { rejectUnauthorized: false }
    : false,
});

// Helper for running parameterised SQL queries
const query = (text, params) => pool.query(text, params);

// Initialize database tables automatically if they do not exist
const initDb = async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      email VARCHAR(120) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'maintenance', 'admin', 'super_admin')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const createIssuesTable = `
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(30) NOT NULL CHECK (category IN ('Electrical', 'Plumbing', 'Furniture', 'Network', 'Other')),
      location VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
      reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const createIndexes = `
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
    CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON issues(reporter_id);
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createIssuesTable);
    await pool.query(createIndexes);
    console.log('[DB] Database tables initialized successfully.');
  } catch (error) {
    console.error('[DB] Error initializing tables:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  initDb,
};
