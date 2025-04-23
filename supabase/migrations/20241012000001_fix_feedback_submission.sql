-- Step 1: Fix the feedback table schema to make element_selector nullable
ALTER TABLE feedback ALTER COLUMN element_selector DROP NOT NULL;

-- Step 2: Fix the infinite recursion in project_collaborators policies
-- First, drop all existing policies on project_collaborators
DROP POLICY IF EXISTS "Users can view collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can update collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can delete collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can insert collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view their own collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can view collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can update collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can delete collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can insert collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON project_collaborators;

-- Create simplified policies that avoid recursion
CREATE POLICY "Users can view their own collaborations"
ON project_collaborators FOR SELECT
USING (user_id = auth.uid());

-- Policy for project owners to view collaborations for their projects
-- This uses a direct join instead of a subquery to avoid recursion
CREATE POLICY "Project owners can view all collaborations"
ON project_collaborators FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_collaborators.project_id 
  AND projects.user_id = auth.uid()
));

-- Policy for project owners to update collaborations
CREATE POLICY "Project owners can update collaborations"
ON project_collaborators FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_collaborators.project_id 
  AND projects.user_id = auth.uid()
));

-- Policy for project owners to delete collaborations
CREATE POLICY "Project owners can delete collaborations"
ON project_collaborators FOR DELETE
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_collaborators.project_id 
  AND projects.user_id = auth.uid()
));

-- Policy for project owners to insert collaborations
CREATE POLICY "Project owners can insert collaborations"
ON project_collaborators FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_collaborators.project_id 
  AND projects.user_id = auth.uid()
));