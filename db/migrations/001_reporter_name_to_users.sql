-- Run once when upgrading a database that still stores issues.reporter_name.
-- The generated legacy accounts cannot log in until an administrator resets them.
BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'staff', 'maintenance', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'issues' AND column_name = 'reporter_name'
  ) THEN
    INSERT INTO users (name, email, password_hash, role)
    SELECT DISTINCT LEFT(BTRIM(reporter_name), 60),
           'legacy-' || MD5(LOWER(BTRIM(reporter_name))) || '@example.invalid',
           '!password-reset-required!',
           'student'
    FROM issues
    WHERE reporter_name IS NOT NULL AND BTRIM(reporter_name) <> ''
    ON CONFLICT (email) DO NOTHING;

    ALTER TABLE issues ADD COLUMN IF NOT EXISTS reporter_id INTEGER;

    UPDATE issues AS issue
    SET reporter_id = users.id
    FROM users
    WHERE issue.reporter_id IS NULL
      AND users.email = 'legacy-' || MD5(LOWER(BTRIM(issue.reporter_name))) || '@example.invalid';

    ALTER TABLE issues ALTER COLUMN reporter_id SET NOT NULL;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = 'issues'
        AND constraint_name = 'issues_reporter_id_fkey'
    ) THEN
      ALTER TABLE issues ADD CONSTRAINT issues_reporter_id_fkey
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    ALTER TABLE issues DROP COLUMN reporter_name;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON issues(reporter_id);
COMMIT;
