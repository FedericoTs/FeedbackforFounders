-- Update rewards_rules table to include feedback quality points

-- First, check if the rewards_rules table exists
CREATE TABLE IF NOT EXISTS rewards_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  "limit" INTEGER,
  cooldown INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_type)
);

-- Insert or update the feedback_given rule
INSERT INTO rewards_rules (activity_type, points, description, enabled)
VALUES ('feedback_given', 10, 'Provided feedback on a project', true)
ON CONFLICT (activity_type) 
DO UPDATE SET 
  points = 10,
  description = 'Provided feedback on a project',
  enabled = true,
  updated_at = NOW();

-- Insert or update the feedback_quality rule
INSERT INTO rewards_rules (activity_type, points, description, enabled)
VALUES ('feedback_quality', 25, 'Provided high-quality feedback', true)
ON CONFLICT (activity_type) 
DO UPDATE SET 
  points = 25,
  description = 'Provided high-quality feedback',
  enabled = true,
  updated_at = NOW();

-- Insert or update the feedback_received rule
INSERT INTO rewards_rules (activity_type, points, description, enabled)
VALUES ('feedback_received', 5, 'Received feedback on your project', true)
ON CONFLICT (activity_type) 
DO UPDATE SET 
  points = 5,
  description = 'Received feedback on your project',
  enabled = true,
  updated_at = NOW();

-- Add feedback_quality to activity_type enum if it doesn't exist
DO $$ 
BEGIN
  -- Check if the enum_helper function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'add_value_to_enum_if_not_exists') THEN
    -- Use the helper function to add the value safely
    PERFORM add_value_to_enum_if_not_exists('activity_type', 'feedback_quality');
  ELSE
    -- If the helper function doesn't exist, we'll use a different approach
    -- This is a fallback and might not work in all cases
    BEGIN
      ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'feedback_quality';
    EXCEPTION WHEN OTHERS THEN
      -- If the above fails, it might be because the value already exists or the syntax is not supported
      -- We'll ignore the error and continue
      RAISE NOTICE 'Could not add feedback_quality to activity_type enum, it might already exist';
    END;
  END IF;
END $$;

-- Enable realtime for the rewards_rules table
ALTER PUBLICATION supabase_realtime ADD TABLE rewards_rules;
