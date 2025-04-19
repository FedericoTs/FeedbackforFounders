-- Fix the user profile columns to ensure they can be updated correctly

-- Make sure the users table has the correct structure for profile fields
ALTER TABLE IF EXISTS users
  ALTER COLUMN bio TYPE TEXT,
  ALTER COLUMN location TYPE TEXT,
  ALTER COLUMN website TYPE TEXT;

-- Set default values for these columns if they are null
UPDATE users SET bio = '' WHERE bio IS NULL;
UPDATE users SET location = '' WHERE location IS NULL;
UPDATE users SET website = '' WHERE website IS NULL;

-- Add NOT NULL constraints to prevent nulls in the future
ALTER TABLE IF EXISTS users
  ALTER COLUMN bio SET DEFAULT '',
  ALTER COLUMN location SET DEFAULT '',
  ALTER COLUMN website SET DEFAULT '';
