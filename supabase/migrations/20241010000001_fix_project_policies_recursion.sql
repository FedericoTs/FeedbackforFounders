-- This migration fixes the infinite recursion issue in the row level security policy for the `projects` table

-- Step 1: Temporarily disable RLS on both tables to avoid any issues during the changes
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies that might be causing recursion
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON projects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON project_collaborators;

-- Step 3: Create a more efficient function to check project access without recursion
CREATE OR REPLACE FUNCTION public.check_project_access(project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_owner boolean;
  is_collaborator boolean;
  is_public boolean;
BEGIN
  -- Check if user is the direct owner (most efficient check first)
  SELECT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND user_id = auth.uid()
  ) INTO is_owner;
  
  IF is_owner THEN
    RETURN TRUE;
  END IF;
  
  -- Check if project is public
  SELECT EXISTS (
    SELECT 1 FROM projects 
    WHERE id = project_id AND visibility = 'public'
  ) INTO is_public;
  
  IF is_public THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a collaborator
  SELECT EXISTS (
    SELECT 1 FROM project_collaborators 
    WHERE project_id = project_id AND user_id = auth.uid()
  ) INTO is_collaborator;
  
  RETURN is_collaborator;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_project_access(uuid) TO authenticated;

-- Step 4: Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Step 5: Create new non-recursive policies

-- Projects policies
-- View policy
CREATE POLICY "Users can view their own and public projects" 
ON projects FOR SELECT 
USING (
  user_id = auth.uid() OR 
  visibility = 'public' OR 
  EXISTS (SELECT 1 FROM project_collaborators WHERE project_id = id AND user_id = auth.uid())
);

-- Insert policy
CREATE POLICY "Users can insert their own projects" 
ON projects FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Update policy
CREATE POLICY "Users can update their own projects" 
ON projects FOR UPDATE 
USING (user_id = auth.uid());

-- Delete policy
CREATE POLICY "Users can delete their own projects" 
ON projects FOR DELETE 
USING (user_id = auth.uid());

-- Project collaborators policies
-- View policy
CREATE POLICY "Users can view collaborations" 
ON project_collaborators FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

-- Insert policy
CREATE POLICY "Project owners can insert collaborations" 
ON project_collaborators FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

-- Update policy
CREATE POLICY "Project owners can update collaborations" 
ON project_collaborators FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);

-- Delete policy
CREATE POLICY "Project owners can delete collaborations" 
ON project_collaborators FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
);
