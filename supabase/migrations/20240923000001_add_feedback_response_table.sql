-- Create feedback_response table to track owner responses to feedback
CREATE TABLE IF NOT EXISTS feedback_response (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_official BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add realtime support
alter publication supabase_realtime add table feedback_response;

-- Add RPC function to get feedback with responses
CREATE OR REPLACE FUNCTION get_feedback_with_responses(p_project_id UUID)
RETURNS TABLE (
  feedback_id UUID,
  element_selector TEXT,
  content TEXT,
  category TEXT,
  severity INTEGER,
  implementation_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_avatar TEXT,
  responses JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as feedback_id,
    f.element_selector,
    f.content,
    f.category,
    f.severity,
    f.implementation_status,
    f.created_at,
    u.full_name as user_name,
    u.avatar_url as user_avatar,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', fr.id,
          'content', fr.content,
          'created_at', fr.created_at,
          'user_name', ru.full_name,
          'user_avatar', ru.avatar_url,
          'is_official', fr.is_official
        )
      )
      FROM feedback_response fr
      JOIN users ru ON fr.user_id = ru.id
      WHERE fr.feedback_id = f.id
      ORDER BY fr.created_at ASC), '[]'::jsonb
    ) as responses
  FROM feedback f
  JOIN users u ON f.user_id = u.id
  WHERE f.project_id = p_project_id
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql;
