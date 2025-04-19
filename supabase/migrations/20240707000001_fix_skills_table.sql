-- Fix the skills table to ensure it works correctly with spaces in skill names

-- First, let's make sure the skills table has the correct structure
ALTER TABLE IF EXISTS skills
  ALTER COLUMN name TYPE TEXT;

-- Add a unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'skills_name_key' AND conrelid = 'skills'::regclass
  ) THEN
    ALTER TABLE skills ADD CONSTRAINT skills_name_key UNIQUE (name);
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, which is fine
END;
$$;

-- Make sure RLS policies are correct
ALTER TABLE IF EXISTS skills ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Anyone can read skills" ON skills;
CREATE POLICY "Anyone can read skills"
  ON skills FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create skills" ON skills;
CREATE POLICY "Authenticated users can create skills"
  ON skills FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Make sure the user_skills table has the correct structure
ALTER TABLE IF EXISTS user_skills
  ALTER COLUMN user_id TYPE UUID,
  ALTER COLUMN skill_id TYPE UUID;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_skills_user_id_fkey' AND conrelid = 'user_skills'::regclass
  ) THEN
    ALTER TABLE user_skills 
      ADD CONSTRAINT user_skills_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_skills_skill_id_fkey' AND conrelid = 'user_skills'::regclass
  ) THEN
    ALTER TABLE user_skills 
      ADD CONSTRAINT user_skills_skill_id_fkey 
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, which is fine
END;
$$;

-- Make sure RLS policies are correct for user_skills
ALTER TABLE IF EXISTS user_skills ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can read their own skills" ON user_skills;
CREATE POLICY "Users can read their own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own skills" ON user_skills;
CREATE POLICY "Users can manage their own skills"
  ON user_skills FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
