-- Enhance the points system with more comprehensive tables and functions

-- Create point_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS point_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL UNIQUE,
  points INTEGER NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
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
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_action_type ON point_transactions(action_type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);

-- Enable row-level security
ALTER TABLE point_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for point_rules
DROP POLICY IF EXISTS "Admins can manage point rules" ON point_rules;
CREATE POLICY "Admins can manage point rules"
  ON point_rules
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

DROP POLICY IF EXISTS "Everyone can view point rules" ON point_rules;
CREATE POLICY "Everyone can view point rules"
  ON point_rules FOR SELECT
  USING (true);

-- Create policies for point_transactions
DROP POLICY IF EXISTS "Users can view their own point transactions" ON point_transactions;
CREATE POLICY "Users can view their own point transactions"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all point transactions" ON point_transactions;
CREATE POLICY "Admins can view all point transactions"
  ON point_transactions FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Function to award points with rule checking
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
  v_description TEXT;
  v_today_count INTEGER;
  v_cooldown_remaining INTEGER;
  v_result JSONB;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_leveled_up BOOLEAN;
  v_points_to_next_level INTEGER;
  v_total_points INTEGER;
BEGIN
  -- Get the rule for this action type
  SELECT * INTO v_rule FROM point_rules WHERE action_type = p_action_type AND is_active = true;
  
  -- If no rule exists or it's not active, return error
  IF v_rule IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No active rule found for this action type'
    );
  END IF;
  
  -- Use provided description or default from rule
  v_description := COALESCE(p_description, v_rule.description);
  
  -- Check cooldown if applicable
  IF v_rule.cooldown_minutes > 0 THEN
    SELECT 
      EXTRACT(EPOCH FROM (now() - MAX(created_at)))/60 AS minutes_since_last
    INTO v_cooldown_remaining
    FROM point_transactions 
    WHERE user_id = p_user_id AND action_type = p_action_type;
    
    IF v_cooldown_remaining IS NOT NULL AND v_cooldown_remaining < v_rule.cooldown_minutes THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Action on cooldown',
        'cooldown_remaining_minutes', v_rule.cooldown_minutes - v_cooldown_remaining
      );
    END IF;
  END IF;
  
  -- Check daily limit if applicable
  IF v_rule.max_daily IS NOT NULL THEN
    SELECT COUNT(*) INTO v_today_count
    FROM point_transactions
    WHERE 
      user_id = p_user_id AND 
      action_type = p_action_type AND
      created_at >= date_trunc('day', now());
      
    IF v_today_count >= v_rule.max_daily THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Daily limit reached for this action'
      );
    END IF;
  END IF;
  
  -- Get current user data
  SELECT level, points, points_to_next_level INTO v_user
  FROM users WHERE id = p_user_id;
  
  -- If user not found, return error
  IF v_user IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;
  
  -- Store old level for comparison
  v_old_level := v_user.level;
  
  -- Calculate new total points
  v_total_points := v_user.points + v_rule.points;
  
  -- Check if user leveled up
  v_leveled_up := false;
  v_new_level := v_user.level;
  v_points_to_next_level := v_user.points_to_next_level;
  
  IF v_rule.points > 0 AND v_total_points >= v_user.points_to_next_level THEN
    -- Level up!
    v_new_level := v_user.level + 1;
    v_points_to_next_level := ROUND(v_user.points_to_next_level * 1.5); -- Increase points needed for next level
    v_leveled_up := true;
  END IF;
  
  -- Record the transaction
  INSERT INTO point_transactions (user_id, action_type, points, description, metadata)
  VALUES (p_user_id, p_action_type, v_rule.points, v_description, p_metadata);
  
  -- Update user's points and level
  UPDATE users
  SET 
    points = v_total_points,
    level = v_new_level,
    points_to_next_level = v_points_to_next_level,
    updated_at = now()
  WHERE id = p_user_id;
  
  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'points', v_rule.points,
    'total_points', v_total_points,
    'level', v_new_level,
    'points_to_next_level', v_points_to_next_level,
    'leveled_up', v_leveled_up,
    'old_level', CASE WHEN v_leveled_up THEN v_old_level ELSE NULL END,
    'new_level', CASE WHEN v_leveled_up THEN v_new_level ELSE NULL END
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user point statistics
CREATE OR REPLACE FUNCTION get_user_point_statistics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_top_sources JSONB;
BEGIN
  -- Get top point sources
  SELECT 
    jsonb_object_agg(action_type, total_points) INTO v_top_sources
  FROM (
    SELECT 
      action_type, 
      SUM(points) as total_points
    FROM 
      point_transactions
    WHERE 
      user_id = p_user_id
    GROUP BY 
      action_type
    ORDER BY 
      total_points DESC
    LIMIT 5
  ) AS top_sources;
  
  -- Build the complete statistics object
  SELECT jsonb_build_object(
    'total_points', COALESCE((SELECT points FROM users WHERE id = p_user_id), 0),
    'level', COALESCE((SELECT level FROM users WHERE id = p_user_id), 1),
    'points_to_next_level', COALESCE((SELECT points_to_next_level FROM users WHERE id = p_user_id), 100),
    'progress_percentage', COALESCE(
      ROUND(
        (SELECT points::float / NULLIF(points_to_next_level, 0) * 100 FROM users WHERE id = p_user_id)
      ), 0),
    'points_today', COALESCE(
      (SELECT SUM(points) FROM point_transactions 
       WHERE user_id = p_user_id AND created_at >= date_trunc('day', now())),
      0),
    'points_yesterday', COALESCE(
      (SELECT SUM(points) FROM point_transactions 
       WHERE user_id = p_user_id 
       AND created_at >= date_trunc('day', now()) - interval '1 day'
       AND created_at < date_trunc('day', now())),
      0),
    'points_this_week', COALESCE(
      (SELECT SUM(points) FROM point_transactions 
       WHERE user_id = p_user_id AND created_at >= date_trunc('week', now())),
      0),
    'points_this_month', COALESCE(
      (SELECT SUM(points) FROM point_transactions 
       WHERE user_id = p_user_id AND created_at >= date_trunc('month', now())),
      0),
    'top_point_sources', COALESCE(v_top_sources, '{}'::jsonb)
  ) INTO v_result;
  
  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default point rules if they don't exist
INSERT INTO point_rules (action_type, points, description, cooldown_minutes, max_daily)
VALUES
  ('feedback_given', 10, 'Provided feedback on a project', 0, NULL),
  ('feedback_quality', 25, 'Provided high-quality feedback', 0, NULL),
  ('project_created', 20, 'Created a new project', 0, 3),
  ('project_updated', 5, 'Updated a project', 1440, NULL), -- 24 hours cooldown
  ('daily_login', 5, 'Logged in for the day', 1440, 1), -- 24 hours cooldown, max 1 per day
  ('profile_completed', 10, 'Completed your profile', 0, 1), -- One-time reward
  ('feedback_received', 5, 'Received feedback on your project', 0, NULL),
  ('goal_created', 5, 'Created a project goal', 0, NULL),
  ('goal_completed', 15, 'Completed a project goal', 0, NULL),
  ('questionnaire_created', 10, 'Created a questionnaire', 0, NULL),
  ('questionnaire_response', 5, 'Received a questionnaire response', 0, NULL),
  ('streak_milestone', 20, 'Reached a login streak milestone', 0, NULL),
  ('feedback_response', 10, 'Responded to feedback', 0, NULL)
ON CONFLICT (action_type) DO NOTHING;

-- Add realtime publication for point_transactions
alter publication supabase_realtime add table point_transactions;
