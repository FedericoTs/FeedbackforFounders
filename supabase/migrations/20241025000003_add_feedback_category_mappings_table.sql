-- Create feedback_category_mappings table
CREATE TABLE IF NOT EXISTS feedback_category_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES feedback_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_primary BOOLEAN DEFAULT false,
  confidence_score FLOAT,
  UNIQUE(feedback_id, category_id)
);

-- Enable RLS
ALTER TABLE feedback_category_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can read their own feedback categories" ON feedback_category_mappings;
CREATE POLICY "Users can read their own feedback categories"
  ON feedback_category_mappings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT f.user_id FROM feedback f WHERE f.id = feedback_id
    ) OR
    auth.uid() IN (
      SELECT p.user_id FROM projects p 
      JOIN feedback f ON f.project_id = p.id 
      WHERE f.id = feedback_id
    )
  );

DROP POLICY IF EXISTS "Users can insert their own feedback categories" ON feedback_category_mappings;
CREATE POLICY "Users can insert their own feedback categories"
  ON feedback_category_mappings FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT f.user_id FROM feedback f WHERE f.id = feedback_id
    ) OR
    auth.uid() IN (
      SELECT p.user_id FROM projects p 
      JOIN feedback f ON f.project_id = p.id 
      WHERE f.id = feedback_id
    )
  );

DROP POLICY IF EXISTS "Users can update their own feedback categories" ON feedback_category_mappings;
CREATE POLICY "Users can update their own feedback categories"
  ON feedback_category_mappings FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT f.user_id FROM feedback f WHERE f.id = feedback_id
    ) OR
    auth.uid() IN (
      SELECT p.user_id FROM projects p 
      JOIN feedback f ON f.project_id = p.id 
      WHERE f.id = feedback_id
    )
  );

-- Add to realtime publication
alter publication supabase_realtime add table feedback_category_mappings;
