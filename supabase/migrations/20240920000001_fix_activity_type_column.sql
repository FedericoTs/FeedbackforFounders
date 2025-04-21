-- First, check if the user_activity table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_activity') THEN
    -- Change the activity_type column from enum to TEXT to accept any value
    ALTER TABLE public.user_activity ALTER COLUMN activity_type TYPE TEXT;
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
