-- Fix infinite recursion in project_collaborators policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Project owners and collaborators can manage goals" ON project_goals;
DROP POLICY IF EXISTS "Project owners and collaborators can manage questionnaires" ON project_questionnaires;

-- Create new policies that avoid recursion by using direct joins instead of EXISTS subqueries
CREATE POLICY "Project owners and collaborators can manage goals"
  ON project_goals
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_collaborators
      WHERE project_collaborators.project_id = project_goals.project_id
      AND project_collaborators.role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Project owners and collaborators can manage questionnaires"
  ON project_questionnaires
  USING (
    auth.uid() IN (
      SELECT user_id FROM project_collaborators
      WHERE project_collaborators.project_id = project_questionnaires.project_id
      AND project_collaborators.role IN ('owner', 'editor')
    )
  );

-- Fix the policy for questionnaire responses as well
DROP POLICY IF EXISTS "Project owners and collaborators can view all responses" ON questionnaire_responses;

CREATE POLICY "Project owners and collaborators can view all responses"
  ON questionnaire_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_questionnaires
      WHERE project_questionnaires.id = questionnaire_responses.questionnaire_id
      AND project_questionnaires.project_id IN (
        SELECT project_id FROM project_collaborators
        WHERE project_collaborators.user_id = auth.uid()
        AND project_collaborators.role IN ('owner', 'editor')
      )
    )
  );
