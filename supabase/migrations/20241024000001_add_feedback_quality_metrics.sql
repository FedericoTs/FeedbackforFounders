-- Add quality metrics columns to the feedback table
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS specificity_score FLOAT,
ADD COLUMN IF NOT EXISTS actionability_score FLOAT,
ADD COLUMN IF NOT EXISTS novelty_score FLOAT,
ADD COLUMN IF NOT EXISTS sentiment FLOAT,
ADD COLUMN IF NOT EXISTS quality_score FLOAT;

-- Enable realtime for the feedback table
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;