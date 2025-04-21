-- Create element_feedback_summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS element_feedback_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  element_selector TEXT NOT NULL,
  feedback_count INTEGER DEFAULT 0,
  average_sentiment FLOAT,
  average_severity FLOAT,
  category_distribution JSONB,
  summary_text TEXT,
  pros TEXT[],
  cons TEXT[],
  action_recommendations JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, element_selector)
);