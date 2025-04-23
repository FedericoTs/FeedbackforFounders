-- Create a function to handle feedback submission
CREATE OR REPLACE FUNCTION submit_feedback_v2(feedback_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  feedback_id UUID;
  result JSONB;
BEGIN
  -- Insert the feedback record
  INSERT INTO feedback (
    project_id,
    user_id,
    section_id,
    section_name,
    section_type,
    content,
    category,
    rating,
    sentiment,
    actionability_score,
    specificity_score,
    novelty_score,
    subcategory,
    page_url,
    screenshot_url,
    screenshot_annotations,
    quick_reactions
  )
  VALUES (
    (feedback_data->>'project_id')::UUID,
    (feedback_data->>'user_id')::UUID,
    (feedback_data->>'section_id'),
    (feedback_data->>'section_name'),
    (feedback_data->>'section_type'),
    (feedback_data->>'content'),
    (feedback_data->>'category'),
    COALESCE((feedback_data->>'rating')::INT, 5),
    (feedback_data->>'sentiment')::FLOAT,
    (feedback_data->>'actionability_score')::FLOAT,
    (feedback_data->>'specificity_score')::FLOAT,
    (feedback_data->>'novelty_score')::FLOAT,
    (feedback_data->>'subcategory'),
    (feedback_data->>'page_url'),
    (feedback_data->>'screenshot_url'),
    (feedback_data->>'screenshot_annotations')::JSONB,
    (feedback_data->>'quick_reactions')::JSONB
  )
  RETURNING id INTO feedback_id;

  -- Update project feedback count
  UPDATE project_feedback
  SET count = count + 1
  WHERE project_id = (feedback_data->>'project_id')::UUID;

  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO project_feedback (project_id, count)
    VALUES ((feedback_data->>'project_id')::UUID, 1);
  END IF;

  -- Return the feedback ID
  result := jsonb_build_object('id', feedback_id, 'success', true);
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object('success', false, 'error', SQLERRM);
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION submit_feedback_v2(JSONB) TO authenticated;
