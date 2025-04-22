-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  section_id TEXT NOT NULL,
  section_name TEXT NOT NULL,
  section_type TEXT NOT NULL,
  content TEXT NOT NULL,
  sentiment FLOAT,
  category TEXT NOT NULL,
  subcategory TEXT,
  actionability_score FLOAT,
  specificity_score FLOAT,
  novelty_score FLOAT,
  helpfulness_rating INTEGER,
  screenshot_url TEXT,
  screenshot_annotations JSONB,
  quick_reactions JSONB,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_sections table
CREATE TABLE IF NOT EXISTS project_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  section_name TEXT NOT NULL,
  section_type TEXT NOT NULL,
  dom_path TEXT,
  visual_bounds JSONB,
  priority INTEGER,
  feedback_count INTEGER DEFAULT 0,
  average_sentiment FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, section_id)
);

-- Enable row-level security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_sections ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback table
DROP POLICY IF EXISTS "Feedback is viewable by everyone" ON feedback;
CREATE POLICY "Feedback is viewable by everyone"
  ON feedback FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
CREATE POLICY "Users can insert their own feedback"
  ON feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
CREATE POLICY "Users can update their own feedback"
  ON feedback FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own feedback" ON feedback;
CREATE POLICY "Users can delete their own feedback"
  ON feedback FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for project_sections table
DROP POLICY IF EXISTS "Project sections are viewable by everyone" ON project_sections;
CREATE POLICY "Project sections are viewable by everyone"
  ON project_sections FOR SELECT
  USING (true);

-- Add to realtime publication
alter publication supabase_realtime add table feedback;
alter publication supabase_realtime add table project_sections;
