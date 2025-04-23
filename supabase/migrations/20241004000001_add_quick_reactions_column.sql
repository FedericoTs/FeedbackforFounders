-- Add quick_reactions column to the feedback table
DO $$ 
BEGIN
    -- Check if quick_reactions column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'quick_reactions') THEN
        ALTER TABLE feedback ADD COLUMN quick_reactions JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Check if screenshot_annotations column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'screenshot_annotations') THEN
        ALTER TABLE feedback ADD COLUMN screenshot_annotations JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Check if points_awarded column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'points_awarded') THEN
        ALTER TABLE feedback ADD COLUMN points_awarded INTEGER DEFAULT 0;
    END IF;
END $$;
