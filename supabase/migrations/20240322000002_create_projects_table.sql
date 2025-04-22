-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  visibility TEXT DEFAULT 'public',
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  thumbnail_url TEXT,
  feedback_count INTEGER DEFAULT 0,
  positive_feedback INTEGER DEFAULT 0,
  negative_feedback INTEGER DEFAULT 0,
  neutral_feedback INTEGER DEFAULT 0
);

-- Add some sample projects if the table is empty
INSERT INTO projects (title, description, category, tags, visibility, status, featured, user_id, thumbnail_url)
SELECT 
  'E-commerce Website Redesign',
  'A complete redesign of an e-commerce platform with improved user experience and checkout flow.',
  'Web Design',
  ARRAY['UI/UX', 'E-commerce', 'Responsive'],
  'public',
  'active',
  true,
  auth.uid(),
  'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=800&q=80'
WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);

INSERT INTO projects (title, description, category, tags, visibility, status, featured, user_id, thumbnail_url)
SELECT 
  'Mobile App for Fitness Tracking',
  'A fitness tracking app with workout plans, progress tracking, and social features.',
  'Mobile App',
  ARRAY['Fitness', 'Health', 'Mobile'],
  'public',
  'active',
  true,
  auth.uid(),
  'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?w=800&q=80'
WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);

-- Enable realtime for the projects table
alter publication supabase_realtime add table projects;
