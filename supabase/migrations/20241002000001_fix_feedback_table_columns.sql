-- Add columns to feedback table if they don't exist
DO $$ 
BEGIN
    -- Check if rating column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'rating') THEN
        ALTER TABLE feedback ADD COLUMN rating INTEGER DEFAULT 5;
    END IF;

    -- Check if page_url column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'page_url') THEN
        ALTER TABLE feedback ADD COLUMN page_url TEXT;
    END IF;
END $$;
