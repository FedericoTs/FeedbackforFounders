-- Create a stored procedure to add a project owner with admin privileges
-- This can be used as a fallback when normal inserts fail due to RLS or other issues

CREATE OR REPLACE FUNCTION add_project_owner(p_project_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert the owner record directly, bypassing RLS
  INSERT INTO project_collaborators (project_id, user_id, role)
  VALUES (p_project_id, p_user_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  
  -- Ensure the project exists and is owned by the user
  UPDATE projects
  SET user_id = p_user_id
  WHERE id = p_project_id
  AND (user_id IS NULL OR user_id = p_user_id);
 END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_project_owner TO authenticated;

-- Add this function to realtime publication
COMMENT ON FUNCTION add_project_owner IS 'Adds a user as the owner of a project with admin privileges';
