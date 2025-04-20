-- Ensure user_activity table exists with all required columns
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS user_activity_user_id_idx ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS user_activity_activity_type_idx ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS user_activity_project_id_idx ON user_activity(project_id);

-- Enable RLS
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activity;
CREATE POLICY "Users can view their own activities"
  ON user_activity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activity;
CREATE POLICY "Users can insert their own activities"
  ON user_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table user_activity;

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Star',
  color TEXT DEFAULT 'amber',
  points_reward INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON user_achievements(user_id);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table achievements;
alter publication supabase_realtime add table user_achievements;

-- Insert some default achievements if they don't exist
INSERT INTO achievements (title, description, icon, color, points_reward)
VALUES
  ('First Project', 'Created your first project', 'Trophy', 'amber', 20),
  ('Feedback Master', 'Gave feedback on 10 projects', 'MessageSquare', 'blue', 30),
  ('Popular Creator', 'Received feedback from 5 different users', 'Star', 'purple', 25),
  ('Profile Complete', 'Completed your profile information', 'User', 'green', 15),
  ('Collaboration Star', 'Added 3 collaborators to your projects', 'Users', 'indigo', 25)
ON CONFLICT DO NOTHING;
