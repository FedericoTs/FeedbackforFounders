-- This migration fixes the issue with tables already being members of the supabase_realtime publication

-- First, let's check which tables exist and add them to realtime only if they're not already members
-- We'll use DO blocks with exception handling to avoid errors

DO $$
BEGIN
  -- Try to add skills table to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE skills;
    RAISE NOTICE 'Added skills table to realtime publication';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'skills table is already a member of supabase_realtime';
  END;

  -- Try to add user_skills table to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_skills;
    RAISE NOTICE 'Added user_skills table to realtime publication';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'user_skills table is already a member of supabase_realtime';
  END;

  -- Try to add social_links table to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE social_links;
    RAISE NOTICE 'Added social_links table to realtime publication';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'social_links table is already a member of supabase_realtime';
  END;

  -- Try to add achievements table to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE achievements;
    RAISE NOTICE 'Added achievements table to realtime publication';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'achievements table is already a member of supabase_realtime';
  END;

  -- Try to add user_achievements table to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;
    RAISE NOTICE 'Added user_achievements table to realtime publication';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'user_achievements table is already a member of supabase_realtime';
  END;

  -- Try to add user_activity table to realtime
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_activity;
    RAISE NOTICE 'Added user_activity table to realtime publication';
  EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'user_activity table is already a member of supabase_realtime';
  END;
END;
$$;