-- Fix the feedback table by adding missing columns for quality metrics

-- Add novelty_score column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'novelty_score') THEN
    ALTER TABLE feedback ADD COLUMN novelty_score FLOAT;
  END IF;
END $$;

-- Add specificity_score column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'specificity_score') THEN
    ALTER TABLE feedback ADD COLUMN specificity_score FLOAT;
  END IF;
END $$;

-- Add actionability_score column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'actionability_score') THEN
    ALTER TABLE feedback ADD COLUMN actionability_score FLOAT;
  END IF;
END $$;

-- Add sentiment column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'sentiment') THEN
    ALTER TABLE feedback ADD COLUMN sentiment FLOAT;
  END IF;
END $$;

-- Fix the infinite recursion in project_collaborators policy
DO $$ 
BEGIN
  -- Drop problematic policies if they exist
  DROP POLICY IF EXISTS "Collaborators can view projects they have access to" ON project_collaborators;
  
  -- Create a simplified policy that avoids recursion
  CREATE POLICY "Collaborators can view projects they have access to"
    ON project_collaborators FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
      SELECT 1 FROM projects WHERE projects.id = project_collaborators.project_id AND projects.user_id = auth.uid()
    ));
    
  -- Ensure feedback table has proper policies
  DROP POLICY IF EXISTS "Users can insert their own feedback" ON feedback;
  CREATE POLICY "Users can insert their own feedback"
    ON feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id);
    
  DROP POLICY IF EXISTS "Users can view feedback" ON feedback;
  CREATE POLICY "Users can view feedback"
    ON feedback FOR SELECT
    USING (true);
    
  -- Enable RLS on feedback table if not already enabled
  ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
  
  -- Add feedback table to realtime publication
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
END $$;
