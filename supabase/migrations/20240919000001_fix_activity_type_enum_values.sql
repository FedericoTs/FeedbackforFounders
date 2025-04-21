-- First check if the activity_type_enum type exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type_enum') THEN
    -- If the enum already exists, add the missing values if they don't exist
    -- Add goal_created if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'goal_created' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'goal_created';
    END IF;
    
    -- Add goal_completed if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'goal_completed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'goal_completed';
    END IF;
    
    -- Add goal_updated if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'goal_updated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'goal_updated';
    END IF;
    
    -- Add goal_deleted if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'goal_deleted' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'goal_deleted';
    END IF;
    
    -- Add questionnaire_created if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'questionnaire_created' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'questionnaire_created';
    END IF;
    
    -- Add questionnaire_response if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'questionnaire_response' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'questionnaire_response';
    END IF;
    
    -- Add test_activity if it doesn't exist (for testing purposes)
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'test_activity' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'activity_type_enum')) THEN
      ALTER TYPE activity_type_enum ADD VALUE IF NOT EXISTS 'test_activity';
    END IF;
  ELSE
    -- If the enum doesn't exist, create it with all required values
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
      'goal_updated',
      'goal_completed',
      'goal_deleted',
      'questionnaire_created',
      'questionnaire_response',
      'test_activity',
      'points_sync'
    );
  END IF;
END $$;

-- Ensure the table is added to the realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.users, 
  public.user_activity, 
  public.projects, 
  public.project_activity, 
  public.project_comments, 
  public.project_goals, 
  public.project_questionnaires, 
  public.questionnaire_responses;
