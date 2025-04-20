-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_activity table
CREATE TABLE IF NOT EXISTS project_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_versions table for version history
CREATE TABLE IF NOT EXISTS project_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  version_number INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create project_promotions table
CREATE TABLE IF NOT EXISTS project_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_allocated INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  audience_type TEXT NOT NULL,
  estimated_reach INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_feedback table
CREATE TABLE IF NOT EXISTS project_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0
);

-- Create project_feedback_sentiment table
CREATE TABLE IF NOT EXISTS project_feedback_sentiment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  positive INTEGER DEFAULT 0,
  negative INTEGER DEFAULT 0,
  neutral INTEGER DEFAULT 0
);

-- Enable row level security
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_feedback_sentiment ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Project collaborators policies
CREATE POLICY "Collaborators are viewable by project members" 
  ON project_collaborators FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM project_collaborators WHERE project_id = project_collaborators.project_id
  ));

CREATE POLICY "Owners can insert collaborators" 
  ON project_collaborators FOR INSERT 
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM project_collaborators 
    WHERE project_id = project_collaborators.project_id AND role = 'owner'
  ));

CREATE POLICY "Owners can update collaborators" 
  ON project_collaborators FOR UPDATE 
  USING (auth.uid() IN (
    SELECT user_id FROM project_collaborators 
    WHERE project_id = project_collaborators.project_id AND role = 'owner'
  ));

CREATE POLICY "Owners can delete collaborators" 
  ON project_collaborators FOR DELETE 
  USING (auth.uid() IN (
    SELECT user_id FROM project_collaborators 
    WHERE project_id = project_collaborators.project_id AND role = 'owner'
  ));

-- Project comments policies
CREATE POLICY "Comments are viewable by project members" 
  ON project_comments FOR SELECT 
  USING (auth.uid() IN (
    SELECT user_id FROM project_collaborators WHERE project_id = project_comments.project_id
  ));

CREATE POLICY "Project members can insert comments" 
  ON project_comments FOR INSERT 
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM project_collaborators WHERE project_id = project_comments.project_id
  ));

CREATE POLICY "Users can update their own comments" 
  ON project_comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
  ON project_comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable realtime for collaboration tables
alter publication supabase_realtime add table project_collaborators;
alter publication supabase_realtime add table project_comments;
alter publication supabase_realtime add table project_activity;
