-- Migration for Feedback and Gamification Integration

-- Create feedback table with quality metrics
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project sections table for section-based feedback
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

-- Add feedback-specific fields to user_activity table
ALTER TABLE user_activity
  ADD COLUMN IF NOT EXISTS feedback_id UUID REFERENCES feedback(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS feedback_quality_score FLOAT;

-- Add feedback_quality to activity_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type 
    JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
    WHERE pg_type.typname = 'activity_type' AND pg_namespace.nspname = 'public'
  ) THEN
    CREATE TYPE activity_type AS ENUM (
      'feedback_given',
      'feedback_quality',
      'feedback_received',
      'project_created',
      'project_updated',
      'project_promoted',
      'achievement_earned',
      'level_up',
      'daily_login',
      'profile_completed',
      'goal_completed',
      'goal_created',
      'questionnaire_created',
      'questionnaire_response'
    );
  ELSE
    -- Check if the enum value exists
    BEGIN
      ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'feedback_quality';
    EXCEPTION
      WHEN duplicate_object THEN
        -- Value already exists, do nothing
    END;
  END IF;
END$$;

-- Add feedback-specific achievements
INSERT INTO achievements (id, name, description, points, icon, requirement_type, requirement_value)
VALUES
  (uuid_generate_v4(), 'Quality Reviewer', 'Achieve an average feedback quality score of 0.8+', 150, 'award', 'feedback_quality', 0.8),
  (uuid_generate_v4(), 'Section Specialist', 'Provide feedback on all sections of a project', 75, 'layout', 'complete_sections', 1),
  (uuid_generate_v4(), 'Critical Eye', 'Identify important issues that project owners implement', 100, 'search', 'implemented_suggestions', 3)
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies for feedback tables
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view feedback" ON feedback;
CREATE POLICY "Users can view feedback"
  ON feedback
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
CREATE POLICY "Users can insert their own feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own feedback" ON feedback;
CREATE POLICY "Users can update their own feedback"
  ON feedback
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Project owners can update feedback on their projects" ON feedback;
CREATE POLICY "Project owners can update feedback on their projects"
  ON feedback
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = feedback.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Add RLS policies for project_sections
ALTER TABLE project_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view project sections" ON project_sections;
CREATE POLICY "Users can view project sections"
  ON project_sections
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Project owners can manage their project sections" ON project_sections;
CREATE POLICY "Project owners can manage their project sections"
  ON project_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_sections.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Enable realtime for feedback tables
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE project_sections;