-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view public projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects they collaborate on" ON projects;

-- Create simplified policies without recursion
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public projects"
ON projects FOR SELECT
USING (visibility = 'public');

-- Create a separate policy for collaborators that doesn't use a join
-- This avoids the recursion issue
CREATE POLICY "Users can view projects they collaborate on"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_collaborators
    WHERE project_collaborators.project_id = projects.id
    AND project_collaborators.user_id = auth.uid()
  )
);

-- Fix project_collaborators policies to avoid recursion
DROP POLICY IF EXISTS "Users can view collaborators for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view collaborators for projects they collaborate on" ON project_collaborators;

CREATE POLICY "Users can view collaborators for their projects"
ON project_collaborators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = project_collaborators.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view collaborators for projects they collaborate on"
ON project_collaborators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_collaborators AS pc
    WHERE pc.project_id = project_collaborators.project_id
    AND pc.user_id = auth.uid()
  )
);
