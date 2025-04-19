-- Update users table with additional profile fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_to_next_level INTEGER DEFAULT 100;

-- Create social_links table
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE
);

-- Create user_skills junction table
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create activity_types enum
CREATE TYPE activity_type AS ENUM (
  'feedback_given',
  'feedback_received',
  'project_created',
  'achievement_earned',
  'level_up'
);

-- Create user_activity table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  description TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Social links policies
DROP POLICY IF EXISTS "Users can view their own social links" ON public.social_links;
CREATE POLICY "Users can view their own social links"
  ON public.social_links
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own social links" ON public.social_links;
CREATE POLICY "Users can insert their own social links"
  ON public.social_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own social links" ON public.social_links;
CREATE POLICY "Users can update their own social links"
  ON public.social_links
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own social links" ON public.social_links;
CREATE POLICY "Users can delete their own social links"
  ON public.social_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- User skills policies
DROP POLICY IF EXISTS "Users can view their own skills" ON public.user_skills;
CREATE POLICY "Users can view their own skills"
  ON public.user_skills
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own skills" ON public.user_skills;
CREATE POLICY "Users can insert their own skills"
  ON public.user_skills
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own skills" ON public.user_skills;
CREATE POLICY "Users can delete their own skills"
  ON public.user_skills
  FOR DELETE
  USING (auth.uid() = user_id);

-- User achievements policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- User activity policies
DROP POLICY IF EXISTS "Users can view their own activity" ON public.user_activity;
CREATE POLICY "Users can view their own activity"
  ON public.user_activity
  FOR SELECT
  USING (auth.uid() = user_id);

-- Skills are public
DROP POLICY IF EXISTS "Skills are viewable by everyone" ON public.skills;
CREATE POLICY "Skills are viewable by everyone"
  ON public.skills
  FOR SELECT
  USING (true);

-- Achievements are public
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.achievements;
CREATE POLICY "Achievements are viewable by everyone"
  ON public.achievements
  FOR SELECT
  USING (true);

-- Enable realtime for these tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table social_links;
alter publication supabase_realtime add table user_skills;
alter publication supabase_realtime add table user_achievements;
alter publication supabase_realtime add table user_activity;

-- Insert default achievements
INSERT INTO public.achievements (title, description, icon, color, points_reward) VALUES
('First Feedback', 'Provided your first feedback', 'MessageSquare', 'teal', 25),
('Top Reviewer', 'Received 10+ upvotes on your feedback', 'ThumbsUp', 'cyan', 50),
('7-Day Streak', 'Provided feedback for 7 consecutive days', 'Flame', 'amber', 75),
('Helpful Pro', 'Received ''helpful'' badges on 5+ feedback items', 'Heart', 'rose', 100),
('Level 5 Achieved', 'Reached level 5 in the platform', 'Trophy', 'emerald', 150),
('Project Creator', 'Created your first project for feedback', 'Edit', 'indigo', 50),
('Feedback Champion', 'Provided feedback on 25+ projects', 'Award', 'purple', 200),
('Community Pillar', 'Been active on the platform for 30+ days', 'Users', 'blue', 100);
