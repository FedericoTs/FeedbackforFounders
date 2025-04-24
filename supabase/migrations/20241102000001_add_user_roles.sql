-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles relationship table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Add default roles if they don't exist
INSERT INTO roles (name, description)
VALUES 
  ('admin', 'Administrator with full system access'),
  ('moderator', 'Moderator with content moderation privileges'),
  ('user', 'Standard user with basic privileges'),
  ('guest', 'Guest with limited access')
ON CONFLICT (name) DO NOTHING;

-- Add RLS policies for roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Only admins can modify roles
DROP POLICY IF EXISTS "Admins can modify roles" ON roles;
CREATE POLICY "Admins can modify roles"
  ON roles
  USING (auth.jwt() ->> 'role' = 'admin');

-- Everyone can view roles
DROP POLICY IF EXISTS "Everyone can view roles" ON roles;
CREATE POLICY "Everyone can view roles"
  ON roles
  FOR SELECT
  USING (true);

-- Add RLS policies for user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can modify user_roles
DROP POLICY IF EXISTS "Admins can modify user_roles" ON user_roles;
CREATE POLICY "Admins can modify user_roles"
  ON user_roles
  USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all user_roles
DROP POLICY IF EXISTS "Admins can view all user_roles" ON user_roles;
CREATE POLICY "Admins can view all user_roles"
  ON user_roles
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- First check if role is in auth.users.raw_user_meta_data
  SELECT raw_user_meta_data->>'role' INTO user_role
  FROM auth.users
  WHERE id = user_id;
  
  -- If not found in metadata, check user_roles table
  IF user_role IS NULL THEN
    SELECT r.name INTO user_role
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id
    ORDER BY r.id DESC
    LIMIT 1;
  END IF;
  
  -- Default to 'user' if no role found
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user role
  user_role := get_user_role(user_id);
  
  -- Check permission based on role
  RETURN CASE
    WHEN user_role = 'admin' THEN true
    WHEN user_role = 'moderator' AND permission NOT IN ('manage_users', 'manage_system', 'view_system_logs', 'edit_any_profile', 'delete_project') THEN true
    WHEN user_role = 'user' AND permission IN ('create_project', 'edit_project', 'view_projects', 'create_feedback', 'edit_feedback', 'view_feedback', 'edit_own_profile', 'view_profiles', 'view_analytics') THEN true
    WHEN user_role = 'guest' AND permission IN ('view_projects', 'view_profiles') THEN true
    ELSE false
  END;
END;
$$;

-- Add realtime publication for roles and user_roles
ALTER PUBLICATION supabase_realtime ADD TABLE roles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_roles;
