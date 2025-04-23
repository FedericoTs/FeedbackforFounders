-- Create feedback_categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback_category_mappings table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedback_category_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES feedback_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, category_id)
);

-- Add suggested_categories column to feedback table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'feedback' AND column_name = 'suggested_categories') THEN
    ALTER TABLE feedback ADD COLUMN suggested_categories JSONB;
  END IF;
END $$;

-- Add realtime for feedback_categories table
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_categories;

-- Add realtime for feedback_category_mappings table
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_category_mappings;