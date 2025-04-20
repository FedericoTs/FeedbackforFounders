-- Add project limits to the database

-- Create a table to store user project limits
CREATE TABLE IF NOT EXISTS user_project_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_projects INT NOT NULL DEFAULT 3,
  max_rewarded_projects INT NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies for user_project_limits
ALTER TABLE user_project_limits ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own limits
DROP POLICY IF EXISTS "Users can view their own project limits" ON user_project_limits;
CREATE POLICY "Users can view their own project limits"
  ON user_project_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role to manage limits
DROP POLICY IF EXISTS "Service role can manage project limits" ON user_project_limits;
CREATE POLICY "Service role can manage project limits"
  ON user_project_limits FOR ALL
  USING (auth.role() = 'service_role');

-- Create a table to store reward rules
CREATE TABLE IF NOT EXISTS reward_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  points INT NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  limit_count INT,
  cooldown_hours INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_type)
);

-- Add RLS policies for reward_rules
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;

-- Allow all users to view reward rules
DROP POLICY IF EXISTS "All users can view reward rules" ON reward_rules;
CREATE POLICY "All users can view reward rules"
  ON reward_rules FOR SELECT
  USING (true);

-- Allow service role to manage reward rules
DROP POLICY IF EXISTS "Service role can manage reward rules" ON reward_rules;
CREATE POLICY "Service role can manage reward rules"
  ON reward_rules FOR ALL
  USING (auth.role() = 'service_role');

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_project_limits;
ALTER PUBLICATION supabase_realtime ADD TABLE reward_rules;

-- Insert default reward rules
INSERT INTO reward_rules (activity_type, points, description, limit_count, cooldown_hours)
VALUES
  ('project_created', 20, 'Created a new project', 3, NULL),
  ('project_updated', 5, 'Updated a project', NULL, 24),
  ('feedback_given', 10, 'Provided feedback on a project', NULL, NULL),
  ('feedback_received', 5, 'Received feedback on your project', NULL, NULL),
  ('goal_created', 5, 'Created a project goal', NULL, NULL),
  ('goal_completed', 15, 'Completed a project goal', NULL, NULL),
  ('questionnaire_created', 10, 'Created a questionnaire', NULL, NULL),
  ('questionnaire_response', 5, 'Received a questionnaire response', NULL, NULL),
  ('project_promotion', -50, 'Promoted a project', NULL, NULL),
  ('daily_login', 5, 'Logged in for the day', NULL, 24),
  ('profile_completed', 10, 'Completed your profile', 1, NULL)
ON CONFLICT (activity_type) DO NOTHING;
