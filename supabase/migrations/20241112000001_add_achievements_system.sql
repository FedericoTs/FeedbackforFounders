-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  color VARCHAR(50) DEFAULT 'bg-amber-100',
  points_reward INTEGER NOT NULL DEFAULT 0,
  criteria JSONB,
  category VARCHAR(100),
  difficulty VARCHAR(50),
  is_hidden BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress INTEGER DEFAULT 100,
  metadata JSONB,
  UNIQUE(user_id, achievement_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Create function to check achievement criteria
CREATE OR REPLACE FUNCTION check_achievement_criteria()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be expanded to check various achievement criteria
  -- For now, it's a placeholder for future implementation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add some default achievements
INSERT INTO achievements (name, description, icon, color, points_reward, criteria, category, difficulty)
VALUES
  ('First Feedback', 'Provide your first piece of feedback', 'MessageSquare', 'bg-blue-100', 10, '{"action": "feedback_given", "count": 1}', 'Feedback', 'Easy'),
  ('Feedback Enthusiast', 'Provide 10 pieces of feedback', 'MessageSquare', 'bg-blue-200', 25, '{"action": "feedback_given", "count": 10}', 'Feedback', 'Medium'),
  ('Feedback Master', 'Provide 50 pieces of feedback', 'MessageSquare', 'bg-blue-300', 50, '{"action": "feedback_given", "count": 50}', 'Feedback', 'Hard'),
  ('Quality Contributor', 'Provide high-quality feedback (average score above 0.8)', 'Star', 'bg-amber-100', 30, '{"action": "feedback_quality", "threshold": 0.8}', 'Feedback', 'Medium'),
  ('Project Creator', 'Create your first project', 'FolderPlus', 'bg-green-100', 15, '{"action": "project_created", "count": 1}', 'Projects', 'Easy'),
  ('Project Portfolio', 'Create 5 projects', 'Folders', 'bg-green-200', 30, '{"action": "project_created", "count": 5}', 'Projects', 'Medium'),
  ('Early Bird', 'Join during the platform launch period', 'Sunrise', 'bg-purple-100', 20, '{"action": "early_adopter"}', 'Engagement', 'Special'),
  ('Welcome Aboard', 'Complete your profile', 'UserCheck', 'bg-teal-100', 10, '{"action": "profile_completed"}', 'Engagement', 'Easy'),
  ('Streak Starter', 'Log in for 3 consecutive days', 'Calendar', 'bg-indigo-100', 15, '{"action": "login_streak", "days": 3}', 'Engagement', 'Easy'),
  ('Dedicated User', 'Log in for 7 consecutive days', 'Calendar', 'bg-indigo-200', 25, '{"action": "login_streak", "days": 7}', 'Engagement', 'Medium'),
  ('Commitment', 'Log in for 30 consecutive days', 'Calendar', 'bg-indigo-300', 50, '{"action": "login_streak", "days": 30}', 'Engagement', 'Hard')
ON CONFLICT (id) DO NOTHING;

-- Enable row level security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON achievements;
CREATE POLICY "Achievements are viewable by everyone" ON achievements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "User achievements are viewable by the user" ON user_achievements;
CREATE POLICY "User achievements are viewable by the user" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User achievements are insertable by the service role" ON user_achievements;
CREATE POLICY "User achievements are insertable by the service role" ON user_achievements
  FOR INSERT WITH CHECK (true);

-- Add to realtime publication
alter publication supabase_realtime add table achievements;
alter publication supabase_realtime add table user_achievements;
