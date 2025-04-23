-- Fix infinite recursion in project_collaborators policies
DO $$ 
BEGIN
    -- Drop existing policies that might be causing recursion
    DROP POLICY IF EXISTS "Collaborators can view projects they are part of" ON project_collaborators;
    DROP POLICY IF EXISTS "Project owners can manage collaborators" ON project_collaborators;
    DROP POLICY IF EXISTS "Users can view their own collaborations" ON project_collaborators;
    
    -- Create simplified policies without recursion
    -- Allow project owners to manage collaborators
    CREATE POLICY "Project owners can manage collaborators"
    ON project_collaborators
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );
    
    -- Allow users to view projects they collaborate on
    CREATE POLICY "Users can view their collaborations"
    ON project_collaborators
    FOR SELECT
    USING (
        user_id = auth.uid()
    );
    
    -- Allow public access to collaborator info for public projects
    CREATE POLICY "Public access to public project collaborators"
    ON project_collaborators
    FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE visibility = 'public'
        )
    );
END $$;
