-- Add missing screenshot_url column to feedback table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'screenshot_url') THEN
    ALTER TABLE feedback ADD COLUMN screenshot_url TEXT;
  END IF;
END $$;

-- Fix infinite recursion in project_collaborators policy
DROP POLICY IF EXISTS "Users can view projects they collaborate on" ON projects;
CREATE POLICY "Users can view projects they collaborate on" 
ON projects FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM project_collaborators 
    WHERE project_collaborators.project_id = projects.id 
    AND project_collaborators.user_id = auth.uid()
  )
);

-- Fix infinite recursion in project_collaborators policy
DROP POLICY IF EXISTS "Users can view collaborations for their projects" ON project_collaborators;
CREATE POLICY "Users can view collaborations for their projects" 
ON project_collaborators FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_collaborators.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Add missing page_url column to feedback table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'page_url') THEN
    ALTER TABLE feedback ADD COLUMN page_url TEXT;
  END IF;
END $$;

-- Add missing screenshot_annotations column to feedback table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'screenshot_annotations') THEN
    ALTER TABLE feedback ADD COLUMN screenshot_annotations JSONB;
  END IF;
END $$;

-- Add missing quick_reactions column to feedback table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'quick_reactions') THEN
    ALTER TABLE feedback ADD COLUMN quick_reactions JSONB;
  END IF;
END $$;
