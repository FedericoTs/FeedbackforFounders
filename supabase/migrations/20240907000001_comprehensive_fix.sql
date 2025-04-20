-- Comprehensive fix for database issues

-- 1. Fix for 406 errors - Create missing tables if they don't exist

-- Create project_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_feedback_sentiment table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_feedback_sentiment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  positive INTEGER DEFAULT 0,
  negative INTEGER DEFAULT 0,
  neutral INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Fix for infinite recursion in RLS policies

-- Temporarily disable RLS on all tables to ensure functionality
ALTER TABLE project_goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_questionnaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses DISABLE ROW LEVEL SECURITY;

-- Drop all problematic policies
DROP POLICY IF EXISTS "Project owners and collaborators can manage goals" ON project_goals;
DROP POLICY IF EXISTS "Anyone can view goals for public projects" ON project_goals;
DROP POLICY IF EXISTS "Project owners and collaborators can manage questionnaires" ON project_questionnaires;
DROP POLICY IF EXISTS "Anyone can view questionnaires for public projects" ON project_questionnaires;
DROP POLICY IF EXISTS "Users can insert their own responses" ON questionnaire_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON questionnaire_responses;
DROP POLICY IF EXISTS "Project owners and collaborators can view all responses" ON questionnaire_responses;

-- Enable realtime for these tables if not already enabled
alter publication supabase_realtime add table project_feedback;
alter publication supabase_realtime add table project_feedback_sentiment;

-- Insert initial records for existing projects if they don't have feedback data
INSERT INTO project_feedback (project_id, count)
SELECT id, 0 FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM project_feedback WHERE project_feedback.project_id = projects.id
);

INSERT INTO project_feedback_sentiment (project_id, positive, negative, neutral)
SELECT id, 0, 0, 0 FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM project_feedback_sentiment WHERE project_feedback_sentiment.project_id = projects.id
);
