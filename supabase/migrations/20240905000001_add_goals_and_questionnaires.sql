-- Create table for project validation goals
CREATE TABLE IF NOT EXISTS project_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER,
  current_value INTEGER DEFAULT 0,
  goal_type TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for project questionnaires
CREATE TABLE IF NOT EXISTS project_questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create table for questionnaire responses
CREATE TABLE IF NOT EXISTS questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES project_questionnaires(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  responses JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE project_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Project goals policies
DROP POLICY IF EXISTS "Project owners and collaborators can manage goals" ON project_goals;
CREATE POLICY "Project owners and collaborators can manage goals"
  ON project_goals
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = project_goals.project_id
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Anyone can view goals for public projects" ON project_goals;
CREATE POLICY "Anyone can view goals for public projects"
  ON project_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_goals.project_id
      AND projects.visibility = 'public'
    )
  );

-- Project questionnaires policies
DROP POLICY IF EXISTS "Project owners and collaborators can manage questionnaires" ON project_questionnaires;
CREATE POLICY "Project owners and collaborators can manage questionnaires"
  ON project_questionnaires
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators
      WHERE project_collaborators.project_id = project_questionnaires.project_id
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.role IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Anyone can view questionnaires for public projects" ON project_questionnaires;
CREATE POLICY "Anyone can view questionnaires for public projects"
  ON project_questionnaires
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_questionnaires.project_id
      AND projects.visibility = 'public'
    )
  );

-- Questionnaire responses policies
DROP POLICY IF EXISTS "Users can insert their own responses" ON questionnaire_responses;
CREATE POLICY "Users can insert their own responses"
  ON questionnaire_responses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own responses" ON questionnaire_responses;
CREATE POLICY "Users can view their own responses"
  ON questionnaire_responses
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Project owners and collaborators can view all responses" ON questionnaire_responses;
CREATE POLICY "Project owners and collaborators can view all responses"
  ON questionnaire_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_questionnaires
      JOIN project_collaborators ON project_questionnaires.project_id = project_collaborators.project_id
      WHERE project_questionnaires.id = questionnaire_responses.questionnaire_id
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.role IN ('owner', 'editor')
    )
  );

-- Enable realtime for these tables
alter publication supabase_realtime add table project_goals;
alter publication supabase_realtime add table project_questionnaires;
alter publication supabase_realtime add table questionnaire_responses;
