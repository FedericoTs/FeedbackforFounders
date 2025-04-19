-- Add avatar and banner image columns to users table if they don't exist

DO $$
BEGIN
  -- Check if avatar_url column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
  
  -- Check if banner_url column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'banner_url') THEN
    ALTER TABLE users ADD COLUMN banner_url TEXT;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, which is fine
END;
$$;
