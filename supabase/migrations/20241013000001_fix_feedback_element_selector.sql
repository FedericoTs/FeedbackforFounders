-- Fix the feedback table schema to make element_selector nullable
ALTER TABLE feedback ALTER COLUMN element_selector DROP NOT NULL;

-- Fix the project_collaborators policies to avoid recursion
-- First, drop the problematic policy that's causing recursion
DROP POLICY IF EXISTS "Project owners can view all collaborations" ON project_collaborators;

-- Create a simplified policy that avoids recursion
CREATE POLICY "Project owners can view collaborations simplified"
ON project_collaborators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_collaborators.project_id 
    AND projects.user_id = auth.uid()
  )
);
