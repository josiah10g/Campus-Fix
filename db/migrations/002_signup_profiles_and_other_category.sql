-- Add optional profile fields without changing existing user or issue records.
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS faculty VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR(60);
ALTER TABLE users ADD COLUMN IF NOT EXISTS level VARCHAR(40);
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_type VARCHAR(30);
ALTER TABLE issues ADD COLUMN IF NOT EXISTS category_detail VARCHAR(100);

COMMIT;
