-- Fix missing columns and tables for the achievements and leaderboard system

-- Add max_login_streak column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'max_login_streak'
    ) THEN
        ALTER TABLE users ADD COLUMN max_login_streak integer DEFAULT 0;
    END IF;
END $$;

-- Create point_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS point_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    points integer NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add category column to achievements table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'achievements'
        AND column_name = 'category'
    ) THEN
        ALTER TABLE achievements ADD COLUMN category text DEFAULT 'Other';
    END IF;
END $$;

-- Enable row level security
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for point_transactions
CREATE POLICY "Users can view their own point transactions"
ON point_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Add to realtime publication
ALTER publication supabase_realtime ADD TABLE point_transactions;
