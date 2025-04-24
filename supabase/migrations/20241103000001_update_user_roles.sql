-- Add role column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create role_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL,
    permission TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission)
);

-- Enable row level security
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for role_permissions table
DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions"
    ON public.role_permissions
    USING (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'));

DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;
CREATE POLICY "Users can view role permissions"
    ON public.role_permissions FOR SELECT
    USING (true);

-- Add default role permissions
INSERT INTO public.role_permissions (role, permission)
VALUES
    -- Admin permissions
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

-- Add realtime publication for role_permissions table
alter publication supabase_realtime add table role_permissions;
