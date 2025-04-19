-- Drop the policy that's causing issues with altering the user_id column
DROP POLICY IF EXISTS "Users can view their own skills" ON user_skills;

-- Recreate the policy with a more flexible definition
CREATE POLICY "Users can view their own skills"
  ON user_skills
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add index on skills table name column for faster lookups
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills (name);

-- Make sure the skills table has the correct structure
ALTER TABLE skills ALTER COLUMN name TYPE text;
