-- Add sample projects for testing
INSERT INTO projects (id, title, description, category, tags, visibility, status, featured, user_id)
VALUES 
  (gen_random_uuid(), 'E-commerce Website Redesign', 'A complete redesign of an e-commerce website with improved user experience and checkout flow.', 'Web Design', ARRAY['UI/UX', 'E-commerce', 'Responsive'], 'public', 'active', true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'Mobile Banking App', 'A mobile banking application with secure authentication and transaction features.', 'Mobile App', ARRAY['Finance', 'Security', 'Mobile'], 'public', 'active', true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'Portfolio Website', 'A personal portfolio website showcasing creative work and projects.', 'Portfolio', ARRAY['Personal', 'Creative', 'Showcase'], 'public', 'active', true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'Task Management Web App', 'A web application for managing tasks and projects with team collaboration features.', 'Web App', ARRAY['Productivity', 'Collaboration', 'SaaS'], 'public', 'active', true, (SELECT id FROM users LIMIT 1))
ON CONFLICT DO NOTHING;

-- Initialize feedback counters for the sample projects
INSERT INTO project_feedback (project_id, count)
SELECT id, 0 FROM projects WHERE id NOT IN (SELECT project_id FROM project_feedback)
ON CONFLICT DO NOTHING;

-- Initialize sentiment counters for the sample projects
INSERT INTO project_feedback_sentiment (project_id, positive, negative, neutral)
SELECT id, 0, 0, 0 FROM projects WHERE id NOT IN (SELECT project_id FROM project_feedback_sentiment)
ON CONFLICT DO NOTHING;

-- Make sure the projects table is included in the realtime publication
-- Only add tables if they're not already in the publication
DO $
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE projects;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_feedback') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_feedback;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_feedback_sentiment') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE project_feedback_sentiment;
  END IF;
END;
$;
