-- Add feedback quality metrics columns to the feedback table

-- Check if columns already exist before adding them
DO $$ 
BEGIN
    -- Add specificity_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'specificity_score') THEN
        ALTER TABLE feedback ADD COLUMN specificity_score FLOAT;
    END IF;

    -- Add actionability_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'actionability_score') THEN
        ALTER TABLE feedback ADD COLUMN actionability_score FLOAT;
    END IF;

    -- Add novelty_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'novelty_score') THEN
        ALTER TABLE feedback ADD COLUMN novelty_score FLOAT;
    END IF;

    -- Add sentiment column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'sentiment') THEN
        ALTER TABLE feedback ADD COLUMN sentiment FLOAT;
    END IF;

    -- Add quality_score column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'quality_score') THEN
        ALTER TABLE feedback ADD COLUMN quality_score FLOAT;
    END IF;

    -- Add suggested_categories column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'suggested_categories') THEN
        ALTER TABLE feedback ADD COLUMN suggested_categories JSONB;
    END IF;
END $$;

-- Create index on quality_score for efficient filtering and sorting
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'feedback_quality_score_idx') THEN
        CREATE INDEX feedback_quality_score_idx ON feedback(quality_score);
    END IF;
END $$;

-- Enable realtime for the feedback table
ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
