-- Fix infinite recursion in projects policy
DROP POLICY IF EXISTS "Users can view projects they collaborate on" ON projects;
CREATE POLICY "Users can view projects they collaborate on" 
ON projects FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM project_collaborators 
    WHERE project_collaborators.project_id = projects.id 
    AND project_collaborators.user_id = auth.uid()
  )
);

-- Fix infinite recursion in project_collaborators policy
DROP POLICY IF EXISTS "Users can view collaborations for their projects" ON project_collaborators;
CREATE POLICY "Users can view collaborations for their projects" 
ON project_collaborators FOR SELECT 
USING (
  user_id = auth.uid() OR 
  project_id IN (
    SELECT id FROM projects 
    WHERE user_id = auth.uid()
  )
);

-- Fix infinite recursion in projects policy for other operations
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects" 
ON projects FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects" 
ON projects FOR DELETE 
USING (auth.uid() = user_id);
