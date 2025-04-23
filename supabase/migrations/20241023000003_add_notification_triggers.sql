-- Create a function to generate notifications for feedback events
CREATE OR REPLACE FUNCTION generate_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_project_title TEXT;
  v_project_owner_id UUID;
BEGIN
  -- Get project information
  SELECT title, user_id INTO v_project_title, v_project_owner_id
  FROM projects
  WHERE id = NEW.project_id;
  
  -- Create notification for project owner
  IF v_project_owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (
      v_project_owner_id,
      'feedback',
      'New feedback received',
      'You received new feedback on your project "' || v_project_title || '"',
      '/dashboard/projects/' || NEW.project_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for new feedback
DROP TRIGGER IF EXISTS feedback_notification_trigger ON feedback;
CREATE TRIGGER feedback_notification_trigger
AFTER INSERT ON feedback
FOR EACH ROW
EXECUTE FUNCTION generate_feedback_notification();

-- Create a function to generate notifications for project collaborator invitations
CREATE OR REPLACE FUNCTION generate_project_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_project_title TEXT;
BEGIN
  -- Get project title
  SELECT title INTO v_project_title
  FROM projects
  WHERE id = NEW.project_id;
  
  -- Create notification for invited user
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    NEW.user_id,
    'project',
    'Project Collaboration Invitation',
    'You have been invited to collaborate on the project "' || v_project_title || '"',
    '/dashboard/projects/' || NEW.project_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for project collaborator invitations
DROP TRIGGER IF EXISTS project_invitation_notification_trigger ON project_collaborators;
CREATE TRIGGER project_invitation_notification_trigger
AFTER INSERT ON project_collaborators
FOR EACH ROW
WHEN (NEW.status = 'invited')
EXECUTE FUNCTION generate_project_invitation_notification();

-- Create a function to generate notifications for achievement unlocks
CREATE OR REPLACE FUNCTION generate_achievement_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_achievement_name TEXT;
BEGIN
  -- Get achievement name
  SELECT name INTO v_achievement_name
  FROM achievements
  WHERE id = NEW.achievement_id;
  
  -- Create notification for user
  INSERT INTO notifications (user_id, type, title, content, link)
  VALUES (
    NEW.user_id,
    'achievement',
    'Achievement Unlocked!',
    'You have earned the "' || v_achievement_name || '" achievement',
    '/dashboard/profile'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for achievement unlocks
DROP TRIGGER IF EXISTS achievement_notification_trigger ON user_achievements;
CREATE TRIGGER achievement_notification_trigger
AFTER INSERT ON user_achievements
FOR EACH ROW
EXECUTE FUNCTION generate_achievement_notification();

-- Create a function to generate notifications for reward points
CREATE OR REPLACE FUNCTION generate_reward_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if points were added
  IF NEW.points > OLD.points THEN
    -- Create notification for user
    INSERT INTO notifications (user_id, type, title, content, link)
    VALUES (
      NEW.user_id,
      'reward',
      'Points Earned!',
      'You have earned ' || (NEW.points - OLD.points) || ' new points',
      '/dashboard/profile'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for reward points
DROP TRIGGER IF EXISTS reward_notification_trigger ON user_profiles;
CREATE TRIGGER reward_notification_trigger
AFTER UPDATE OF points ON user_profiles
FOR EACH ROW
WHEN (NEW.points > OLD.points)
EXECUTE FUNCTION generate_reward_notification();
