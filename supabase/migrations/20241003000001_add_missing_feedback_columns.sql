-- Add missing columns to the feedback table
DO $$ 
BEGIN
    -- Check if section_id column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'section_id') THEN
        ALTER TABLE feedback ADD COLUMN section_id TEXT;
    END IF;

    -- Check if section_name column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'section_name') THEN
        ALTER TABLE feedback ADD COLUMN section_name TEXT;
    END IF;

    -- Check if section_type column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'feedback' AND column_name = 'section_type') THEN
        ALTER TABLE feedback ADD COLUMN section_type TEXT;
    END IF;

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
