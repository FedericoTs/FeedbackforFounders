-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('feedback', 'project', 'reward', 'achievement', 'system')),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  link VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS "Users can only see their own notifications" ON notifications;
CREATE POLICY "Users can only see their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update their own notifications
DROP POLICY IF EXISTS "Users can only update their own notifications" ON notifications;
CREATE POLICY "Users can only update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create a function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS SETOF notifications AS $$
BEGIN
  RETURN QUERY
  UPDATE notifications
  SET is_read = true, updated_at = now()
  WHERE user_id = auth.uid() AND is_read = false
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_content TEXT DEFAULT NULL,
  p_link VARCHAR(255) DEFAULT NULL
) RETURNS notifications AS $$
DECLARE
  v_notification notifications;
BEGIN
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (auth.uid(), p_type, p_title, p_content, p_link)
  RETURNING * INTO v_notification;
  
  RETURN v_notification;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;