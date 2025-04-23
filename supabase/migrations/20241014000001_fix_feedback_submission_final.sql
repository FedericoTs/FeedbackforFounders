-- Fix the feedback table schema to make element_selector nullable
ALTER TABLE feedback ALTER COLUMN element_selector DROP NOT NULL;

-- Create a new version of the submit_feedback function that handles nullable element_selector
CREATE OR REPLACE FUNCTION submit_feedback_v2(feedback_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_id uuid;
  result jsonb;
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
    subcategory,
    sentiment,
    actionability_score,
    specificity_score,
    novelty_score,
    rating,
    screenshot_url,
    screenshot_annotations,
    quick_reactions,
    page_url,
    element_selector
  )
  VALUES (
    (feedback_data->>'project_id')::uuid,
    (feedback_data->>'user_id')::uuid,
    feedback_data->>'section_id',
    feedback_data->>'section_name',
    feedback_data->>'section_type',
    feedback_data->>'content',
    feedback_data->>'category',
    feedback_data->>'subcategory',
    (feedback_data->>'sentiment')::float,
    (feedback_data->>'actionability_score')::float,
    (feedback_data->>'specificity_score')::float,
    (feedback_data->>'novelty_score')::float,
    (feedback_data->>'rating')::integer,
    feedback_data->>'screenshot_url',
    feedback_data->>'screenshot_annotations',
    feedback_data->>'quick_reactions',
    feedback_data->>'page_url',
    feedback_data->>'element_selector'
  )
  RETURNING id INTO inserted_id;

  -- Return success response
  result := jsonb_build_object(
    'success', true,
    'id', inserted_id,
    'message', 'Feedback submitted successfully'
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  -- Return error response
  result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );

  RETURN result;
END;
$$;
