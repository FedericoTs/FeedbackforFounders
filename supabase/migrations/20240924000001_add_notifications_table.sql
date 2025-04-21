-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feedback', 'response', 'achievement', 'system')),
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Only the system can insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create function to create a notification when feedback is submitted
CREATE OR REPLACE FUNCTION create_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_owner_id UUID;
  project_title TEXT;
BEGIN
  -- Get project owner and title
  SELECT p.user_id, p.title INTO project_owner_id, project_title
  FROM projects p
  WHERE p.id = NEW.project_id;
  
  -- Only create notification if project owner is not the feedback author
  IF project_owner_id IS NOT NULL AND project_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      project_owner_id,
      'New Feedback Received',
      'You received new feedback in the ' || NEW.category || ' category for your project "' || project_title || '".',
      'feedback',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for feedback notifications
DROP TRIGGER IF EXISTS on_feedback_inserted ON feedback;
CREATE TRIGGER on_feedback_inserted
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION create_feedback_notification();

-- Create function to create a notification when a response is added
CREATE OR REPLACE FUNCTION create_response_notification()
RETURNS TRIGGER AS $$
DECLARE
  feedback_author_id UUID;
  project_title TEXT;
  project_id UUID;
BEGIN
  -- Get feedback author and project info
  SELECT f.user_id, p.title, f.project_id INTO feedback_author_id, project_title, project_id
  FROM feedback f
  JOIN projects p ON f.project_id = p.id
  WHERE f.id = NEW.feedback_id;
  
  -- Only create notification if feedback author is not the response author
  IF feedback_author_id IS NOT NULL AND feedback_author_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      feedback_author_id,
      'Response to Your Feedback',
      CASE WHEN NEW.is_official THEN 'The project owner' ELSE 'Someone' END || ' responded to your feedback on "' || project_title || '".',
      'response',
      NEW.feedback_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for response notifications
DROP TRIGGER IF EXISTS on_response_inserted ON feedback_response;
CREATE TRIGGER on_response_inserted
  AFTER INSERT ON feedback_response
  FOR EACH ROW
  EXECUTE FUNCTION create_response_notification();
