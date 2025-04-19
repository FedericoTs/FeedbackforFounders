-- Fix the users table to ensure updates work correctly

-- First, let's check the structure of the users table
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  -- Check if the id column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id'
  ) INTO column_exists;
  
  -- If the id column doesn't exist, create it
  IF NOT column_exists THEN
    ALTER TABLE users ADD COLUMN id UUID PRIMARY KEY;
  END IF;
  
  -- Check if the id column is the primary key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_pkey' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD PRIMARY KEY (id);
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, create it
  CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    bio TEXT DEFAULT '',
    location TEXT DEFAULT '',
    website TEXT DEFAULT '',
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    points_to_next_level INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  );
END;
$$;

-- Make sure the users table has the correct foreign key to auth.users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_id_fkey' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users 
      ADD CONSTRAINT users_id_fkey 
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist, which is fine
END;
$$;

-- Make sure RLS policies are correct
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies to ensure they're correct
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
