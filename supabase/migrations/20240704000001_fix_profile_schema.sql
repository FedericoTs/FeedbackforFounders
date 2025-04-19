-- Ensure users table has all required columns and fix any issues
DO $$ 
BEGIN
  -- Check if users table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Add missing columns if they don't exist
    BEGIN
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location TEXT;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website TEXT;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points_to_next_level INTEGER DEFAULT 100;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors
    END;
  ELSE
    -- Create users table if it doesn't exist
    CREATE TABLE public.users (
      id UUID PRIMARY KEY,
      email TEXT,
      full_name TEXT,
      bio TEXT,
      location TEXT,
      website TEXT,
      level INTEGER DEFAULT 1,
      points INTEGER DEFAULT 0,
      points_to_next_level INTEGER DEFAULT 100,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  -- Create social_links table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_links') THEN
    CREATE TABLE public.social_links (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      username TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  -- Create skills table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'skills') THEN
    CREATE TABLE public.skills (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  -- Create user_skills junction table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_skills') THEN
    CREATE TABLE public.user_skills (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, skill_id)
    );
  END IF;

  -- Create achievements table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'achievements') THEN
    CREATE TABLE public.achievements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      points_reward INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  -- Create user_achievements junction table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_achievements') THEN
    CREATE TABLE public.user_achievements (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
      earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, achievement_id)
    );
  END IF;

  -- Create activity_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
    CREATE TYPE activity_type AS ENUM (
      'feedback_given',
      'feedback_received',
      'project_created',
      'achievement_earned',
      'level_up'
    );
  END IF;

  -- Create user_activity table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_activity') THEN
    CREATE TABLE public.user_activity (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      activity_type activity_type NOT NULL,
      description TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;

  -- Insert default achievements if they don't exist
  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'First Feedback') THEN
    INSERT INTO public.achievements (title, description, icon, color, points_reward)
    VALUES ('First Feedback', 'Provided your first feedback', 'MessageSquare', 'teal', 25);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Top Reviewer') THEN
    INSERT INTO public.achievements (title, description, icon, color, points_reward)
    VALUES ('Top Reviewer', 'Received 10+ upvotes on your feedback', 'ThumbsUp', 'cyan', 50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = '7-Day Streak') THEN
    INSERT INTO public.achievements (title, description, icon, color, points_reward)
    VALUES ('7-Day Streak', 'Provided feedback for 7 consecutive days', 'Flame', 'amber', 75);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Helpful Pro') THEN
    INSERT INTO public.achievements (title, description, icon, color, points_reward)
    VALUES ('Helpful Pro', 'Received ''helpful'' badges on 5+ feedback items', 'Heart', 'rose', 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Level 5 Achieved') THEN
    INSERT INTO public.achievements (title, description, icon, color, points_reward)
    VALUES ('Level 5 Achieved', 'Reached level 5 in the platform', 'Trophy', 'emerald', 150);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Project Creator') THEN
    INSERT INTO public.achievements (title, description, icon, color, points_reward)
    VALUES ('Project Creator', 'Created your first project for feedback', 'Edit', 'indigo', 50);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Feedback Champion') THEN
    INSERT INTO public.achievements (title, description, icon, color, points_reward)
    VALUES ('Feedback Champion', 'Provided feedback on 25+ projects', 'Award', 'purple', 200);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.achievements WHERE title = 'Community Pillar') THEN
    INSERT INTO public.achievements (title, description, icon, color, points_reward)
    VALUES ('Community Pillar', 'Been active on the platform for 30+ days', 'Users', 'blue', 100);
  END IF;

  -- Enable realtime for tables that aren't already in the publication
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'social_links') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE social_links;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
  END;

  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_skills') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_skills;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
  END;

  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_achievements') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
  END;

  BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_activity') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_activity;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors
  END;
END $$;