-- Add missing columns to the feedback table
ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS rating INTEGER,
  ADD COLUMN IF NOT EXISTS page_url TEXT,
  ADD COLUMN IF NOT EXISTS helpfulness_rating INTEGER;

-- Update the realtime publication to include the feedback table
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
