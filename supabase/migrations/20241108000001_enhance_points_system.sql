-- Enhance the points system with better tracking and rules

-- Create point_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS point_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 0,
  max_daily INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create point_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_action_type ON point_transactions(action_type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);

-- Add daily_points_earned column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'daily_points_earned') THEN
    ALTER TABLE users ADD COLUMN daily_points_earned JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add last_point_actions column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'last_point_actions') THEN
    ALTER TABLE users ADD COLUMN last_point_actions JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Insert default point rules if table is empty
INSERT INTO point_rules (action_type, points, description, cooldown_minutes, max_daily)
SELECT * FROM (
  VALUES 
    ('feedback_given', 10, 'Points for providing feedback', 0, NULL),
    ('feedback_quality', 25, 'Bonus points for high-quality feedback', 0, NULL),
    ('feedback_received', 5, 'Points for receiving feedback', 0, 50),
    ('project_created', 20, 'Points for creating a new project', 0, 60),
    ('project_updated', 5, 'Points for updating a project', 60, 20),
    ('project_promoted', 15, 'Points for promoting a project', 1440, 15),
    ('daily_login', 5, 'Points for logging in daily', 1440, 5),
    ('login_streak', 2, 'Points per day of login streak', 1440, NULL),
    ('profile_completed', 15, 'Points for completing profile', 0, 15),
    ('questionnaire_created', 10, 'Points for creating a questionnaire', 0, 30),
    ('questionnaire_response', 5, 'Points for responding to a questionnaire', 0, 50)
) AS v(action_type, points, description, cooldown_minutes, max_daily)
WHERE NOT EXISTS (SELECT 1 FROM point_rules LIMIT 1);

-- Create function to award points with rules
CREATE OR REPLACE FUNCTION award_points_with_rules(
  p_user_id UUID,
  p_action_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
  v_points INTEGER;
  v_user RECORD;
  v_last_action TIMESTAMP WITH TIME ZONE;
  v_today TEXT;
  v_daily_count INTEGER;
  v_daily_points JSONB;
  v_last_actions JSONB;
  v_result JSONB;
  v_level_up BOOLEAN := false;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_points_to_next_level INTEGER;
BEGIN
  -- Get the rule for this action type
  SELECT * INTO v_rule FROM point_rules WHERE action_type = p_action_type AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'No active rule found for this action');
  END IF;
  
  -- Get user data
  SELECT points, level, points_to_next_level, daily_points_earned, last_point_actions 
  INTO v_user 
  FROM users 
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not found');
  END IF;
  
  -- Initialize variables
  v_points := v_rule.points;
  v_today := to_char(now(), 'YYYY-MM-DD');
  v_daily_points := COALESCE(v_user.daily_points_earned, '{}'::jsonb);
  v_last_actions := COALESCE(v_user.last_point_actions, '{}'::jsonb);
  
  -- Check cooldown if applicable
  IF v_rule.cooldown_minutes > 0 AND v_last_actions ? p_action_type THEN
    v_last_action := (v_last_actions ->> p_action_type)::TIMESTAMP WITH TIME ZONE;
    
    IF v_last_action + (v_rule.cooldown_minutes * interval '1 minute') > now() THEN
      RETURN jsonb_build_object(
        'success', false, 
        'message', 'Action on cooldown', 
        'cooldown_remaining_minutes', 
        EXTRACT(EPOCH FROM (v_last_action + (v_rule.cooldown_minutes * interval '1 minute') - now())) / 60
      );
    END IF;
  END IF;
  
  -- Check daily limit if applicable
  IF v_rule.max_daily IS NOT NULL THEN
    IF v_daily_points ? v_today AND (v_daily_points -> v_today) ? p_action_type THEN
      v_daily_count := ((v_daily_points -> v_today) ->> p_action_type)::INTEGER;
      
      IF v_daily_count >= v_rule.max_daily THEN
        RETURN jsonb_build_object('success', false, 'message', 'Daily limit reached for this action');
      END IF;
    END IF;
  END IF;
  
  -- All checks passed, award the points
  
  -- Update last action time
  v_last_actions := jsonb_set(v_last_actions, ARRAY[p_action_type], to_jsonb(now()::TEXT));
  
  -- Update daily points count
  IF NOT (v_daily_points ? v_today) THEN
    v_daily_points := jsonb_set(v_daily_points, ARRAY[v_today], '{}'::jsonb);
  END IF;
  
  IF (v_daily_points -> v_today) ? p_action_type THEN
    v_daily_count := ((v_daily_points -> v_today) ->> p_action_type)::INTEGER + 1;
    v_daily_points := jsonb_set(v_daily_points, ARRAY[v_today, p_action_type], to_jsonb(v_daily_count));
  ELSE
    v_daily_points := jsonb_set(v_daily_points, ARRAY[v_today, p_action_type], '1');
  END IF;
  
  -- Store old level for comparison
  v_old_level := v_user.level;
  
  -- Calculate new points and check for level up
  v_user.points := v_user.points + v_points;
  
  IF v_user.points >= v_user.points_to_next_level THEN
    v_user.level := v_user.level + 1;
    v_user.points_to_next_level := ROUND(v_user.points_to_next_level * 1.5);
    v_level_up := true;
    v_new_level := v_user.level;
  END IF;
  
  -- Update user record
  UPDATE users
  SET 
    points = v_user.points,
    level = v_user.level,
    points_to_next_level = v_user.points_to_next_level,
    daily_points_earned = v_daily_points,
    last_point_actions = v_last_actions
  WHERE id = p_user_id;
  
  -- Record the transaction
  INSERT INTO point_transactions (user_id, action_type, points, description, metadata)
  VALUES (p_user_id, p_action_type, v_points, COALESCE(p_description, v_rule.description), p_metadata);
  
  -- If user leveled up, record that as a separate activity
  IF v_level_up THEN
    INSERT INTO user_activity (user_id, activity_type, description, points, metadata)
    VALUES (
      p_user_id, 
      'level_up', 
      'Congratulations! You''ve reached level ' || v_new_level || '!',
      0,
      jsonb_build_object('oldLevel', v_old_level, 'newLevel', v_new_level)
    );
  END IF;
  
  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'points', v_points,
    'total_points', v_user.points,
    'level', v_user.level,
    'points_to_next_level', v_user.points_to_next_level,
    'leveled_up', v_level_up
  );
  
  IF v_level_up THEN
    v_result := v_result || jsonb_build_object(
      'old_level', v_old_level,
      'new_level', v_new_level
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user point statistics
CREATE OR REPLACE FUNCTION get_user_point_statistics(p_user_id UUID) 
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_today TEXT := to_char(now(), 'YYYY-MM-DD');
  v_yesterday TEXT := to_char(now() - interval '1 day', 'YYYY-MM-DD');
  v_this_week_start TEXT := to_char(date_trunc('week', now()), 'YYYY-MM-DD');
  v_this_month_start TEXT := to_char(date_trunc('month', now()), 'YYYY-MM-DD');
BEGIN
  SELECT jsonb_build_object(
    'total_points', u.points,
    'level', u.level,
    'points_to_next_level', u.points_to_next_level,
    'progress_percentage', ROUND((u.points::NUMERIC / u.points_to_next_level::NUMERIC) * 100),
    'points_today', COALESCE((SELECT SUM(points) FROM point_transactions 
                            WHERE user_id = p_user_id 
                            AND created_at >= (v_today::DATE)), 0),
    'points_yesterday', COALESCE((SELECT SUM(points) FROM point_transactions 
                                WHERE user_id = p_user_id 
                                AND created_at >= (v_yesterday::DATE) 
                                AND created_at < (v_today::DATE)), 0),
    'points_this_week', COALESCE((SELECT SUM(points) FROM point_transactions 
                                WHERE user_id = p_user_id 
                                AND created_at >= (v_this_week_start::DATE)), 0),
    'points_this_month', COALESCE((SELECT SUM(points) FROM point_transactions 
                                 WHERE user_id = p_user_id 
                                 AND created_at >= (v_this_month_start::DATE)), 0),
    'top_point_sources', (SELECT jsonb_object_agg(action_type, total_points) FROM (
                          SELECT action_type, SUM(points) as total_points 
                          FROM point_transactions 
                          WHERE user_id = p_user_id 
                          GROUP BY action_type 
                          ORDER BY total_points DESC 
                          LIMIT 5
                        ) as top_sources)
  ) INTO v_result
  FROM users u
  WHERE u.id = p_user_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for point_transactions table
ALTER PUBLICATION supabase_realtime ADD TABLE point_transactions;
