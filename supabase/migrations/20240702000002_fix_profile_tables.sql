-- Ensure users table has all required columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_to_next_level INTEGER DEFAULT 100;

-- Create social_links table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE
);

-- Create user_skills junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create activity_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
    CREATE TYPE activity_type AS ENUM (
      'feedback_given',
      'feedback_received',
      'project_created',
      'achievement_earned',
      'level_up'
    );
  END IF;
END $$;

-- Create user_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  description TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default achievements if they don't exist
INSERT INTO public.achievements (title, description, icon, color, points_reward)
SELECT 'First Feedback', 'Provided your first feedback', 'MessageSquare', 'teal', 25
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'First Feedback');

INSERT INTO public.achievements (title, description, icon, color, points_reward)
SELECT 'Top Reviewer', 'Received 10+ upvotes on your feedback', 'ThumbsUp', 'cyan', 50
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Top Reviewer');

INSERT INTO public.achievements (title, description, icon, color, points_reward)
SELECT '7-Day Streak', 'Provided feedback for 7 consecutive days', 'Flame', 'amber', 75
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = '7-Day Streak');

INSERT INTO public.achievements (title, description, icon, color, points_reward)
SELECT 'Helpful Pro', 'Received ''helpful'' badges on 5+ feedback items', 'Heart', 'rose', 100
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Helpful Pro');

INSERT INTO public.achievements (title, description, icon, color, points_reward)
SELECT 'Level 5 Achieved', 'Reached level 5 in the platform', 'Trophy', 'emerald', 150
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Level 5 Achieved');

INSERT INTO public.achievements (title, description, icon, color, points_reward)
SELECT 'Project Creator', 'Created your first project for feedback', 'Edit', 'indigo', 50
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Project Creator');

INSERT INTO public.achievements (title, description, icon, color, points_reward)
SELECT 'Feedback Champion', 'Provided feedback on 25+ projects', 'Award', 'purple', 200
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Feedback Champion');

INSERT INTO public.achievements (title, description, icon, color, points_reward)
SELECT 'Community Pillar', 'Been active on the platform for 30+ days', 'Users', 'blue', 100
WHERE NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Community Pillar');

-- Enable realtime for these tables (excluding users which is already enabled)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'social_links') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_links;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_skills') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_skills;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_achievements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_activity') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_activity;
  END IF;
END $$;
