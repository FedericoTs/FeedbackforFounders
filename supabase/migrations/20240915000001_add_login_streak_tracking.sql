-- Add login streak tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0;

-- Create a table to track daily login history
CREATE TABLE IF NOT EXISTS user_login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL,
  streak_count INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- Enable RLS on the new table
ALTER TABLE user_login_history ENABLE ROW LEVEL SECURITY;

-- Create policies for the new table
DROP POLICY IF EXISTS "Users can view their own login history" ON user_login_history;
CREATE POLICY "Users can view their own login history"
  ON user_login_history
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all login history" ON user_login_history;
CREATE POLICY "Service role can manage all login history"
  ON user_login_history
  USING (auth.role() = 'service_role');

-- Add to realtime publication
alter publication supabase_realtime add table user_login_history;
