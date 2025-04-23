-- EMERGENCY FIX: This migration is a fallback in case the first fix doesn't work
-- It temporarily disables RLS, then re-enables it with minimal policies

-- Step 1: Temporarily disable RLS on both tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "Users can view projects they collaborate on" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view public projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;

DROP POLICY IF EXISTS "Users can view collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can update collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can delete collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can insert collaborations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view their own collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can view collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can update collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can delete collaborations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can insert collaborations" ON project_collaborators;

-- Step 3: Re-enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Step 4: Create minimal policies that don't reference each other

-- Projects policies
CREATE POLICY "Allow all operations for authenticated users" 
ON projects FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Project collaborators policies
CREATE POLICY "Allow all operations for authenticated users" 
ON project_collaborators FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Step 5: Create a function to check access that can be used later
-- when implementing more restrictive policies
CREATE OR REPLACE FUNCTION public.check_project_access(project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN TRUE; -- Temporarily allow all access
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_project_access(uuid) TO authenticated;
