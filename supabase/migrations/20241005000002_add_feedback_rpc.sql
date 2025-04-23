-- Create a function to submit feedback that bypasses RLS policies
CREATE OR REPLACE FUNCTION submit_feedback(feedback_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_id UUID;
  result JSONB;
BEGIN
  -- Insert the feedback
  INSERT INTO feedback (
    project_id,
    user_id,
    section_id,
    section_name,
    section_type,
    content,
    category,
    subcategory,
    sentiment,
    actionability_score,
    specificity_score,
    novelty_score,
    rating,
    page_url,
    screenshot_url,
    points_awarded,
    created_at
  )
  VALUES (
    (feedback_data->>'project_id')::UUID,
    (feedback_data->>'user_id')::UUID,
    feedback_data->>'section_id',
    feedback_data->>'section_name',
    feedback_data->>'section_type',
    feedback_data->>'content',
    feedback_data->>'category',
    feedback_data->>'subcategory',
    (feedback_data->>'sentiment')::FLOAT,
    (feedback_data->>'actionability_score')::FLOAT,
    (feedback_data->>'specificity_score')::FLOAT,
    (feedback_data->>'novelty_score')::FLOAT,
    (feedback_data->>'rating')::INTEGER,
    feedback_data->>'page_url',
    feedback_data->>'screenshot_url',
    0,
    NOW()
  )
  RETURNING id INTO inserted_id;
  
  -- Return the inserted ID
  result := jsonb_build_object('id', inserted_id);
  RETURN result;
END;
$$;
