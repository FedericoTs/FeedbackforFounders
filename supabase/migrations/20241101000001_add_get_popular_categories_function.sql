-- Function to get popular categories for a project
CREATE OR REPLACE FUNCTION get_popular_categories(p_project_id UUID, p_limit INTEGER)
RETURNS TABLE (
  category_id UUID,
  category_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH project_feedback AS (
    SELECT f.id
    FROM feedback f
    LEFT JOIN projects p ON f.project_id = p.id
    WHERE (p_project_id IS NULL OR f.project_id = p_project_id)
  )
  SELECT 
    fcm.category_id,
    COUNT(fcm.feedback_id) AS category_count
  FROM 
    feedback_category_mappings fcm
  JOIN 
    project_feedback pf ON fcm.feedback_id = pf.id
  GROUP BY 
    fcm.category_id
  ORDER BY 
    category_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add realtime for feedback_categories table
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_categories;

-- Add realtime for feedback_category_mappings table
ALTER PUBLICATION supabase_realtime ADD TABLE feedback_category_mappings;
