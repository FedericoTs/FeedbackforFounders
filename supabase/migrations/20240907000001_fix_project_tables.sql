-- Create project_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_feedback_sentiment table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_feedback_sentiment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  positive INTEGER DEFAULT 0,
  negative INTEGER DEFAULT 0,
  neutral INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_promotions table if it doesn't exist
CREATE TABLE IF NOT EXISTS project_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_allocated INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  audience_type TEXT DEFAULT 'general',
  estimated_reach INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS on these tables to ensure functionality
ALTER TABLE project_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_feedback_sentiment DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_promotions DISABLE ROW LEVEL SECURITY;

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE project_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE project_feedback_sentiment;
ALTER PUBLICATION supabase_realtime ADD TABLE project_promotions;

-- Insert initial records for existing projects if they don't have feedback data
INSERT INTO project_feedback (project_id, count)
SELECT id, 0 FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM project_feedback WHERE project_feedback.project_id = projects.id
);

INSERT INTO project_feedback_sentiment (project_id, positive, negative, neutral)
SELECT id, 0, 0, 0 FROM projects
WHERE NOT EXISTS (
  SELECT 1 FROM project_feedback_sentiment WHERE project_feedback_sentiment.project_id = projects.id
);
