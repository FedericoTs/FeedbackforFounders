-- Create feedback_categories table
CREATE TABLE IF NOT EXISTS feedback_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(50),
  icon VARCHAR(50),
  parent_id UUID REFERENCES feedback_categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Add some default categories
INSERT INTO feedback_categories (name, description, color, icon) VALUES
('UI Design', 'Feedback related to visual design, layout, and aesthetics', 'blue', 'palette'),
('User Experience', 'Feedback related to usability, flow, and overall experience', 'purple', 'user'),
('Content', 'Feedback related to text, images, and other content', 'amber', 'file-text'),
('Functionality', 'Feedback related to features and how they work', 'green', 'settings'),
('Performance', 'Feedback related to speed, responsiveness, and efficiency', 'rose', 'activity'),
('Accessibility', 'Feedback related to accessibility for all users', 'indigo', 'accessibility'),
('Other', 'Miscellaneous feedback that doesn''t fit other categories', 'gray', 'help-circle');

-- Enable RLS
ALTER TABLE feedback_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public read access" ON feedback_categories;
CREATE POLICY "Public read access"
  ON feedback_categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin insert/update/delete" ON feedback_categories;
CREATE POLICY "Admin insert/update/delete"
  ON feedback_categories FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- Add to realtime publication
alter publication supabase_realtime add table feedback_categories;
