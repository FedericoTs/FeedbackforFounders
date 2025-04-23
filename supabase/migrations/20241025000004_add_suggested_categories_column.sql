-- Add suggested_categories column to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS suggested_categories JSONB;

-- Add primary_category_id column to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS primary_category_id UUID REFERENCES feedback_categories(id);

-- Add category_confidence column to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS category_confidence FLOAT;

-- Update the feedback table to include a categories array
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS categories TEXT[];

-- Add to realtime publication
alter publication supabase_realtime add table feedback;
