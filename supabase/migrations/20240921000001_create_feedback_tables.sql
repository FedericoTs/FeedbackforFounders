-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  element_selector TEXT NOT NULL,
  element_xpath TEXT,
  element_screenshot_url TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  severity INTEGER DEFAULT 3,
  sentiment FLOAT,
  actionability_score INTEGER,
  quality_score INTEGER,
  is_duplicate BOOLEAN DEFAULT FALSE,
  similar_feedback_ids UUID[],
  implementation_status TEXT DEFAULT 'pending',
  points_awarded INTEGER DEFAULT NULL,
  final_points_awarded INTEGER DEFAULT NULL,
  owner_rating INTEGER,
  owner_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback analysis table
CREATE TABLE IF NOT EXISTS feedback_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  raw_sentiment FLOAT,
  normalized_sentiment FLOAT,
  key_suggestions TEXT[],
  detected_categories TEXT[],
  quality_indicators JSONB,
  actionability_score INTEGER,
  uniqueness_score INTEGER,
  analysis_version TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create element feedback summary table
CREATE TABLE IF NOT EXISTS element_feedback_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  element_selector TEXT NOT NULL,
  feedback_count INTEGER DEFAULT 0,
  average_sentiment FLOAT,
  average_severity FLOAT,
  category_distribution JSONB,
  summary_text TEXT,
  pros TEXT[],
  cons TEXT[],
  action_recommendations JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, element_selector)
);

-- Create feedback interactions table
CREATE TABLE IF NOT EXISTS feedback_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  value INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points adjustments table
CREATE TABLE IF NOT EXISTS points_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  points_delta INTEGER NOT NULL,
  adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback duplicates table
CREATE TABLE IF NOT EXISTS feedback_duplicates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  duplicate_feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  similarity_score FLOAT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(original_feedback_id, duplicate_feedback_id)
);

-- Add RPC functions for feedback counters
CREATE OR REPLACE FUNCTION increment_project_feedback_count(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing record
  UPDATE project_feedback
  SET count = count + 1
  WHERE project_id = p_project_id;
  
  -- If no record exists, insert one
  IF NOT FOUND THEN
    INSERT INTO project_feedback (project_id, count)
    VALUES (p_project_id, 1);
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_project_positive_feedback(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing record
  UPDATE project_feedback_sentiment
  SET positive = positive + 1
  WHERE project_id = p_project_id;
  
  -- If no record exists, insert one
  IF NOT FOUND THEN
    INSERT INTO project_feedback_sentiment (project_id, positive, negative, neutral)
    VALUES (p_project_id, 1, 0, 0);
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_project_negative_feedback(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing record
  UPDATE project_feedback_sentiment
  SET negative = negative + 1
  WHERE project_id = p_project_id;
  
  -- If no record exists, insert one
  IF NOT FOUND THEN
    INSERT INTO project_feedback_sentiment (project_id, positive, negative, neutral)
    VALUES (p_project_id, 0, 1, 0);
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_project_neutral_feedback(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Try to update existing record
  UPDATE project_feedback_sentiment
  SET neutral = neutral + 1
  WHERE project_id = p_project_id;
  
  -- If no record exists, insert one
  IF NOT FOUND THEN
    INSERT INTO project_feedback_sentiment (project_id, positive, negative, neutral)
    VALUES (p_project_id, 0, 0, 1);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add RPC function to adjust user points
CREATE OR REPLACE FUNCTION adjust_user_points(p_user_id UUID, p_points_delta INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET points = COALESCE(points, 0) + p_points_delta
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add policies for feedback tables
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view feedback for projects they have access to" 
  ON feedback FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    project_id IN (
      SELECT project_id FROM project_collaborators WHERE user_id = auth.uid()
    ) OR
    project_id IN (
      SELECT id FROM projects WHERE visibility = 'public'
    )
  );

CREATE POLICY "Users can insert their own feedback" 
  ON feedback FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own feedback" 
  ON feedback FOR UPDATE 
  USING (user_id = auth.uid());

-- Add realtime publication for feedback tables
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_analysis;
ALTER PUBLICATION supabase_realtime ADD TABLE element_feedback_summary;
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_interactions;
