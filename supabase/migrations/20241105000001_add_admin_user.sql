-- This migration adds an admin user to the system
-- Note: This should be run manually in the Supabase dashboard
-- or using the Supabase CLI with proper credentials

-- Example of how to update a user to admin role:
-- UPDATE auth.users
-- SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"admin"')
-- WHERE email = 'your-admin-email@example.com';

-- Example of how to insert a role permission:
-- INSERT INTO role_permissions (role, permission)
-- VALUES ('admin', 'manage_users');
