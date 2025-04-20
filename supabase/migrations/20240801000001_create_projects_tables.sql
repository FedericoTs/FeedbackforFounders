-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  category TEXT,
  tags TEXT[],
  visibility TEXT NOT NULL DEFAULT 'public',
  status TEXT NOT NULL DEFAULT 'active',
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thumbnail_url TEXT
);

-- Create project_feedback table to track feedback counts
CREATE TABLE IF NOT EXISTS project_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0
);

-- Create project_feedback_sentiment table to track sentiment
CREATE TABLE IF NOT EXISTS project_feedback_sentiment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  positive INTEGER NOT NULL DEFAULT 0,
  negative INTEGER NOT NULL DEFAULT 0,
  neutral INTEGER NOT NULL DEFAULT 0
);

-- Create project_feedback_categories table to track feedback by category
CREATE TABLE IF NOT EXISTS project_feedback_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

-- Create storage bucket for project thumbnails
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-thumbnails', 'project-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to insert their own projects
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own projects
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for users to delete their own projects
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Policy for users to view public projects
DROP POLICY IF EXISTS "Users can view public projects" ON projects;
CREATE POLICY "Users can view public projects"
  ON projects FOR SELECT
  USING (visibility = 'public');

-- Enable realtime for projects table
alter publication supabase_realtime add table projects;
