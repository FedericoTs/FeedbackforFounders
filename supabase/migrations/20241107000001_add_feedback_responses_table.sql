-- Create feedback_responses table for storing responses to feedback
CREATE TABLE IF NOT EXISTS feedback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_official BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES feedback_responses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS feedback_responses_feedback_id_idx ON feedback_responses(feedback_id);
CREATE INDEX IF NOT EXISTS feedback_responses_user_id_idx ON feedback_responses(user_id);
CREATE INDEX IF NOT EXISTS feedback_responses_parent_id_idx ON feedback_responses(parent_id);

-- Enable RLS
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all feedback responses" ON feedback_responses;
CREATE POLICY "Users can view all feedback responses"
  ON feedback_responses
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own feedback responses" ON feedback_responses;
CREATE POLICY "Users can insert their own feedback responses"
  ON feedback_responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own feedback responses" ON feedback_responses;
CREATE POLICY "Users can update their own feedback responses"
  ON feedback_responses
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own feedback responses" ON feedback_responses;
CREATE POLICY "Users can delete their own feedback responses"
  ON feedback_responses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table feedback_responses;

-- Create a function to get responses for a specific feedback item
CREATE OR REPLACE FUNCTION get_feedback_responses(feedback_id_param UUID)
RETURNS TABLE (
  id UUID,
  feedback_id UUID,
  user_id UUID,
  content TEXT,
  is_official BOOLEAN,
  parent_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_name TEXT,
  user_avatar_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id,
    fr.feedback_id,
    fr.user_id,
    fr.content,
    fr.is_official,
    fr.parent_id,
    fr.created_at,
    fr.updated_at,
    u.name AS user_name,
    u.avatar_url AS user_avatar_url
  FROM 
    feedback_responses fr
  LEFT JOIN 
    users u ON fr.user_id = u.id
  WHERE 
    fr.feedback_id = feedback_id_param
  ORDER BY 
    fr.created_at ASC;
  
  RETURN;
END;
$$;