-- First, check if the deprecated rewards_rules table exists and drop it if it does
DROP TABLE IF EXISTS rewards_rules;

-- Now, ensure the reward_rules table is properly updated with the latest point values
-- First, drop the table if it exists to recreate it with the correct structure
DROP TABLE IF EXISTS reward_rules;

-- Create the reward_rules table with proper column names (using quotes for reserved keywords)
CREATE TABLE IF NOT EXISTS reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "limit" INTEGER,
  cooldown INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the current reward rules based on the gamification documentation
INSERT INTO reward_rules (activity_type, points, description, enabled, "limit", cooldown) VALUES
  ('project_created', 20, 'Created a new project', true, 3, null),
  ('project_updated', 5, 'Updated a project', true, null, 24),
  ('feedback_given', 10, 'Provided feedback on a project', true, null, null),
  ('feedback_quality', 25, 'Provided high-quality feedback', true, null, null),
  ('feedback_received', 5, 'Received feedback on your project', true, null, null),
  ('goal_created', 5, 'Created a project goal', true, null, null),
  ('goal_completed', 15, 'Completed a project goal', true, null, null),
  ('questionnaire_created', 10, 'Created a questionnaire', true, null, null),
  ('questionnaire_response', 5, 'Received a questionnaire response', true, null, null),
  ('daily_login', 5, 'Logged in for the day', true, null, 24),
  ('profile_completed', 10, 'Completed your profile', true, 1, null),
  ('project_promotion', -50, 'Promoted a project', true, null, null);

-- Enable row-level security
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Reward rules are viewable by all users" 
ON reward_rules FOR SELECT 
USING (true);

-- Create policy for insert/update/delete (admin only)
DROP POLICY IF EXISTS "Reward rules are editable by admins only" ON reward_rules;
CREATE POLICY "Reward rules are editable by admins only" 
ON reward_rules FOR ALL 
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE reward_rules;
