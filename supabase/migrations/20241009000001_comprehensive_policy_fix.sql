-- STEP 1: Drop all existing policies on projects and project_collaborators tables
-- This ensures we start with a clean slate

DROP POLICY IF EXISTS "Users can view projects they collaborate on" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view public projects" ON projects;

DROP POLICY IF EXISTS "Users can view collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can update collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can delete collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can insert collaborations for their projects" ON project_collaborators;

-- STEP 2: Create base policies for projects table that don't reference project_collaborators

-- Policy for users to view their own projects (no recursion)
CREATE POLICY "Users can view their own projects"
ON projects FOR SELECT
USING (auth.uid() = user_id);

-- Policy for users to view public projects (no recursion)
CREATE POLICY "Users can view public projects"
ON projects FOR SELECT
USING (visibility = 'public');

-- Policy for users to update their own projects (no recursion)
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for users to delete their own projects (no recursion)
CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
USING (auth.uid() = user_id);

-- Policy for users to insert their own projects (no recursion)
CREATE POLICY "Users can insert their own projects"
ON projects FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- STEP 3: Create policies for project_collaborators table

-- Policy for users to view collaborations they're part of (no recursion)
CREATE POLICY "Users can view their own collaborations"
ON project_collaborators FOR SELECT
USING (auth.uid() = user_id);

-- Policy for project owners to view collaborations for their projects
CREATE POLICY "Project owners can view collaborations"
ON project_collaborators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_collaborators.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Policy for project owners to update collaborations
CREATE POLICY "Project owners can update collaborations"
ON project_collaborators FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_collaborators.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Policy for project owners to delete collaborations
CREATE POLICY "Project owners can delete collaborations"
ON project_collaborators FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_collaborators.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Policy for project owners to insert collaborations
CREATE POLICY "Project owners can insert collaborations"
ON project_collaborators FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_collaborators.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- STEP 4: Now that project_collaborators policies are established,
-- we can safely add the policy for users to view projects they collaborate on
-- without causing recursion

CREATE POLICY "Users can view projects they collaborate on"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_collaborators 
    WHERE project_collaborators.project_id = projects.id 
    AND project_collaborators.user_id = auth.uid()
  )
);

-- STEP 5: Add a function to check if a user has access to a project
-- This can be used in other policies to avoid recursion

CREATE OR REPLACE FUNCTION public.user_has_project_access(project_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_exists boolean;
  is_owner boolean;
  is_collaborator boolean;
  is_public boolean;
BEGIN
  -- Check if project exists
  SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_id) INTO project_exists;
  
  IF NOT project_exists THEN
    RETURN false;
  END IF;
  
  -- Check if user is owner
  SELECT EXISTS(SELECT 1 FROM projects WHERE id = project_id AND user_id = user_id) INTO is_owner;
  
  IF is_owner THEN
    RETURN true;
  END IF;
  
  -- Check if project is public
  SELECT (visibility = 'public') FROM projects WHERE id = project_id INTO is_public;
  
  IF is_public THEN
    RETURN true;
  END IF;
  
  -- Check if user is collaborator
  SELECT EXISTS(SELECT 1 FROM project_collaborators WHERE project_id = project_id AND user_id = user_id) INTO is_collaborator;
  
  RETURN is_collaborator;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_project_access(uuid, uuid) TO authenticated;
