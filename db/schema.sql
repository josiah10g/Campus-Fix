
-- CampusFix Database Schema
-- Plain SQL schema for PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'maintenance', 'admin', 'super_admin')),
    faculty VARCHAR(100),
    department VARCHAR(100),
    student_id VARCHAR(60),
    level VARCHAR(40),
    staff_type VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Issues table
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(30) NOT NULL CHECK (category IN ('Electrical', 'Plumbing', 'Furniture', 'Network', 'Other')),
    location VARCHAR(100) NOT NULL,
    category_detail VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved')),
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching and filtering performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON issues(reporter_id);

