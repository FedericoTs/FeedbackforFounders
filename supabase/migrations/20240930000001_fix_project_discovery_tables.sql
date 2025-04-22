-- Ensure projects table exists with correct structure
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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  thumbnail_url TEXT
);

-- Ensure project_feedback table exists for tracking feedback counts
CREATE TABLE IF NOT EXISTS project_feedback (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0
);

-- Ensure project_feedback_sentiment table exists for tracking sentiment
CREATE TABLE IF NOT EXISTS project_feedback_sentiment (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  positive INTEGER NOT NULL DEFAULT 0,
  negative INTEGER NOT NULL DEFAULT 0,
  neutral INTEGER NOT NULL DEFAULT 0
);

-- Enable row-level security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_feedback_sentiment ENABLE ROW LEVEL SECURITY;

-- Create policies for projects table
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON projects;
CREATE POLICY "Public projects are viewable by everyone"
  ON projects FOR SELECT
  USING (visibility = 'public' AND status = 'active');

DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (user_id = auth.uid());

-- Create policies for project_feedback table
DROP POLICY IF EXISTS "Project feedback is viewable by everyone" ON project_feedback;
CREATE POLICY "Project feedback is viewable by everyone"
  ON project_feedback FOR SELECT
  USING (true);

-- Create policies for project_feedback_sentiment table
DROP POLICY IF EXISTS "Project feedback sentiment is viewable by everyone" ON project_feedback_sentiment;
CREATE POLICY "Project feedback sentiment is viewable by everyone"
  ON project_feedback_sentiment FOR SELECT
  USING (true);

-- Add to realtime publication
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table project_feedback;
alter publication supabase_realtime add table project_feedback_sentiment;
