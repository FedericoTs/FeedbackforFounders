-- Add notification_preferences column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT jsonb_build_object(
  'feedback', true,
  'project', true,
  'reward', true,
  'achievement', true,
  'system', true,
  'email_notifications', true
);
