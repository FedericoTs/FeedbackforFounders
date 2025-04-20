-- This migration fixes the issue with the user_activity table already being a member of supabase_realtime publication

-- First, check if the table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_activity') THEN
    -- Only try to add to publication if it's not already a member
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'user_activity'
    ) THEN
      -- Add to realtime publication if not already a member
      ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity;
    END IF;
  END IF;
END $$;
