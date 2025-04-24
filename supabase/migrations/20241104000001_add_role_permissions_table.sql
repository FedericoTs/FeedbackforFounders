-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission)
);

-- Add RLS policies
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage role permissions
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;
CREATE POLICY "Admins can manage role permissions"
  ON role_permissions
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Allow all authenticated users to view role permissions
DROP POLICY IF EXISTS "All users can view role permissions" ON role_permissions;
CREATE POLICY "All users can view role permissions"
  ON role_permissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Add default permissions for each role
INSERT INTO role_permissions (role, permission)
VALUES
  -- Admin permissions (all permissions)
  ('admin', 'manage_users'),
  ('admin', 'view_users'),
  ('admin', 'create_project'),
  ('admin', 'edit_project'),
  ('admin', 'delete_project'),
  ('admin', 'view_projects'),
  ('admin', 'feature_project'),
  ('admin', 'create_feedback'),
  ('admin', 'edit_feedback'),
  ('admin', 'delete_feedback'),
  ('admin', 'view_feedback'),
  ('admin', 'moderate_feedback'),
  ('admin', 'edit_own_profile'),
  ('admin', 'edit_any_profile'),
  ('admin', 'view_profiles'),
  ('admin', 'view_analytics'),
  ('admin', 'export_analytics'),
  ('admin', 'manage_system'),
  ('admin', 'view_system_logs'),
  
  -- Moderator permissions
  ('moderator', 'view_users'),
  ('moderator', 'create_project'),
  ('moderator', 'edit_project'),
  ('moderator', 'view_projects'),
  ('moderator', 'feature_project'),
  ('moderator', 'create_feedback'),
  ('moderator', 'edit_feedback'),
  ('moderator', 'delete_feedback'),
  ('moderator', 'view_feedback'),
  ('moderator', 'moderate_feedback'),
  ('moderator', 'edit_own_profile'),
  ('moderator', 'view_profiles'),
  ('moderator', 'view_analytics'),
  ('moderator', 'export_analytics'),
  
  -- User permissions
  ('user', 'create_project'),
  ('user', 'edit_project'),
  ('user', 'view_projects'),
  ('user', 'create_feedback'),
  ('user', 'edit_feedback'),
  ('user', 'view_feedback'),
  ('user', 'edit_own_profile'),
  ('user', 'view_profiles'),
  ('user', 'view_analytics'),
  
  -- Guest permissions
  ('guest', 'view_projects'),
  ('guest', 'view_profiles')
ON CONFLICT (role, permission) DO NOTHING;

-- Enable realtime for role_permissions table
ALTER PUBLICATION supabase_realtime ADD TABLE role_permissions;
