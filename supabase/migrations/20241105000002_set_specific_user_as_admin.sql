-- Set specific user as admin
-- This migration sets the user with ID 5437b1fa-4b1d-4d89-90ca-77799b3d59f6 as an admin

-- Update the user's role in the users table
UPDATE users
SET role = 'ADMIN'
WHERE id = '5437b1fa-4b1d-4d89-90ca-77799b3d59f6';

-- Update the user's metadata in auth.users table
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN jsonb_build_object('role', 'ADMIN')
    ELSE jsonb_set(raw_user_meta_data, '{role}', '"ADMIN"')
  END
WHERE id = '5437b1fa-4b1d-4d89-90ca-77799b3d59f6';
