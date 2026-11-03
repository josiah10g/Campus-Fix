-- Store an optional profile image URL without changing existing accounts.
BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

COMMIT;
