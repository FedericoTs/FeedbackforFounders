-- First, let's check if the activity_type_enum type exists and create it if not
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type_enum') THEN
    CREATE TYPE activity_type_enum AS ENUM (
      'feedback_given',
      'feedback_received',
      'project_created',
      'project_updated',
      'project_promoted',
      'achievement_earned',
      'level_up',
      'daily_login',
      'profile_completed',
      'goal_created',
      'goal_completed',
      'questionnaire_created',
      'questionnaire_response',
      'points_sync'
    );
  ELSE
    -- If the enum already exists, add the missing values
    -- Add goal_created if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'goal_created' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE 'goal_created';
    END IF;
    
    -- Add goal_completed if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'goal_completed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE 'goal_completed';
    END IF;
    
    -- Add questionnaire_created if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'questionnaire_created' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE 'questionnaire_created';
    END IF;
    
    -- Add questionnaire_response if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'questionnaire_response' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE 'questionnaire_response';
    END IF;
    
    -- Add points_sync if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'points_sync' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE 'points_sync';
    END IF;
  END IF;
END $$;

-- Ensure user_activity table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type activity_type_enum NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    metadata JSONB,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- If the table already exists but has a TEXT activity_type column, we need to convert it
DO $$ 
DECLARE
    column_type TEXT;
BEGIN
    SELECT data_type INTO column_type 
    FROM information_schema.columns 
    WHERE table_name = 'user_activity' AND column_name = 'activity_type';
    
    IF column_type = 'text' THEN
        -- Create a temporary column with the enum type
        ALTER TABLE public.user_activity ADD COLUMN activity_type_enum_temp activity_type_enum;
        
        -- Update the temporary column with values from the text column
        -- This will fail for any invalid values, which is what we want
        UPDATE public.user_activity 
        SET activity_type_enum_temp = activity_type::activity_type_enum 
        WHERE activity_type IN (
            'feedback_given', 'feedback_received', 'project_created', 'project_updated',
            'project_promoted', 'achievement_earned', 'level_up', 'daily_login',
            'profile_completed', 'goal_created', 'goal_completed',
            'questionnaire_created', 'questionnaire_response', 'points_sync'
        );
        
        -- Drop the old column and rename the new one
        ALTER TABLE public.user_activity DROP COLUMN activity_type;
        ALTER TABLE public.user_activity RENAME COLUMN activity_type_enum_temp TO activity_type;
        
        -- Add NOT NULL constraint
        ALTER TABLE public.user_activity ALTER COLUMN activity_type SET NOT NULL;
    END IF;
END $$;

-- Ensure the table is added to the realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.users, public.user_activity, public.projects, public.project_activity, public.project_comments, public.project_goals, public.project_questionnaires, public.questionnaire_responses;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_project_id ON public.user_activity(project_id);

-- Disable RLS for user_activity table
ALTER TABLE public.user_activity DISABLE ROW LEVEL SECURITY;