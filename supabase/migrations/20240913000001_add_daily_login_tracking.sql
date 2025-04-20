-- Create a table to track daily logins
CREATE TABLE IF NOT EXISTS user_daily_logins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL,
  rewarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, login_date)
);

-- Add RLS policies
ALTER TABLE user_daily_logins ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own login records
DROP POLICY IF EXISTS "Users can view their own login records" ON user_daily_logins;
CREATE POLICY "Users can view their own login records"
  ON user_daily_logins FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own login records
DROP POLICY IF EXISTS "Users can insert their own login records" ON user_daily_logins;
CREATE POLICY "Users can insert their own login records"
  ON user_daily_logins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own login records
DROP POLICY IF EXISTS "Users can update their own login records" ON user_daily_logins;
CREATE POLICY "Users can update their own login records"
  ON user_daily_logins FOR UPDATE
  USING (auth.uid() = user_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE user_daily_logins;
