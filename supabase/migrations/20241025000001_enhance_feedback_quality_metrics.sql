-- Add more detailed feedback quality metrics and analysis capabilities

-- Ensure the feedback table has all necessary quality metrics columns
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS specificity_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS actionability_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS novelty_score FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sentiment FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS quality_score FLOAT DEFAULT 0;

-- Create a function to calculate the overall quality score
CREATE OR REPLACE FUNCTION calculate_feedback_quality_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate weighted average of the individual scores
  NEW.quality_score := (
    NEW.specificity_score * 0.4 +
    NEW.actionability_score * 0.4 +
    NEW.novelty_score * 0.2 +
    ((NEW.sentiment + 1) / 2) * 0.1
  ) / 1.1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically calculate the quality score
DROP TRIGGER IF EXISTS calculate_feedback_quality_score_trigger ON feedback;
CREATE TRIGGER calculate_feedback_quality_score_trigger
BEFORE INSERT OR UPDATE OF specificity_score, actionability_score, novelty_score, sentiment
ON feedback
FOR EACH ROW
EXECUTE FUNCTION calculate_feedback_quality_score();

-- Add a view for feedback quality analytics
CREATE OR REPLACE VIEW feedback_quality_analytics AS
SELECT 
  project_id,
  COUNT(*) as total_feedback,
  AVG(quality_score) as avg_quality_score,
  AVG(specificity_score) as avg_specificity_score,
  AVG(actionability_score) as avg_actionability_score,
  AVG(novelty_score) as avg_novelty_score,
  AVG(sentiment) as avg_sentiment,
  COUNT(*) FILTER (WHERE quality_score >= 0.8) as excellent_feedback_count,
  COUNT(*) FILTER (WHERE quality_score >= 0.6 AND quality_score < 0.8) as good_feedback_count,
  COUNT(*) FILTER (WHERE quality_score >= 0.4 AND quality_score < 0.6) as average_feedback_count,
  COUNT(*) FILTER (WHERE quality_score < 0.4) as basic_feedback_count
FROM feedback
GROUP BY project_id;

-- Add a function to get feedback quality suggestions
CREATE OR REPLACE FUNCTION get_feedback_quality_suggestions(p_specificity FLOAT, p_actionability FLOAT, p_novelty FLOAT, p_sentiment FLOAT)
RETURNS JSONB AS $$
DECLARE
  suggestions JSONB := '[]'::JSONB;
BEGIN
  -- Add specificity suggestions if score is low
  IF p_specificity < 0.4 THEN
    suggestions := suggestions || jsonb_build_object(
      'metric', 'specificity',
      'suggestion', 'Add more specific details about what you observed',
      'examples', jsonb_build_array(
        'Mention specific elements or features you\'re providing feedback on',
        'Include exact steps to reproduce an issue',
        'Reference specific sections or pages'
      )
    );
  END IF;
  
  -- Add actionability suggestions if score is low
  IF p_actionability < 0.4 THEN
    suggestions := suggestions || jsonb_build_object(
      'metric', 'actionability',
      'suggestion', 'Include clear suggestions for improvement',
      'examples', jsonb_build_array(
        'Suggest specific changes that would address your concerns',
        'Provide alternative approaches or solutions',
        'Explain how your suggestions would improve the experience'
      )
    );
  END IF;
  
  -- Add novelty suggestions if score is low
  IF p_novelty < 0.4 THEN
    suggestions := suggestions || jsonb_build_object(
      'metric', 'novelty',
      'suggestion', 'Try to provide unique insights not mentioned before',
      'examples', jsonb_build_array(
        'Review existing feedback to avoid duplication',
        'Consider different use cases or perspectives',
        'Share personal experiences that provide new context'
      )
    );
  END IF;
  
  -- Add sentiment suggestions if score is very negative
  IF p_sentiment < -0.3 THEN
    suggestions := suggestions || jsonb_build_object(
      'metric', 'sentiment',
      'suggestion', 'Consider using more constructive language',
      'examples', jsonb_build_array(
        'Focus on the issue rather than assigning blame',
        'Balance criticism with positive observations',
        'Use neutral language to describe problems'
      )
    );
  END IF;
  
  RETURN suggestions;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the feedback table if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;