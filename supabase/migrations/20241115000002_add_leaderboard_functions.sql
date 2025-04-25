-- Create or replace the function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_timeframe TEXT DEFAULT 'all',
  p_category TEXT DEFAULT 'points',
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
) RETURNS SETOF JSONB AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_result JSONB;
BEGIN
  -- Set the start date based on timeframe
  CASE p_timeframe
    WHEN 'week' THEN
      v_start_date := date_trunc('week', now());
    WHEN 'month' THEN
      v_start_date := date_trunc('month', now());
    ELSE
      v_start_date := NULL; -- All time
  END CASE;
  
  -- Get leaderboard data based on category
  IF p_category = 'points' THEN
    -- Points leaderboard
    IF v_start_date IS NULL THEN
      -- All time
      RETURN QUERY
      SELECT jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'avatar_url', u.avatar_url,
        'level', u.level,
        'points', u.points,
        'percentile', ROUND((1 - (rank::FLOAT / total_users::FLOAT)) * 100)
      )
      FROM (
        SELECT 
          id, 
          name, 
          avatar_url, 
          level, 
          points,
          RANK() OVER (ORDER BY points DESC) as rank,
          COUNT(*) OVER() as total_users
        FROM users
        WHERE points > 0
      ) u
      ORDER BY u.points DESC
      LIMIT p_limit
      OFFSET p_offset;
    ELSE
      -- Specific timeframe
      RETURN QUERY
      SELECT jsonb_build_object(
        'id', u.user_id,
        'name', u.name,
        'avatar_url', u.avatar_url,
        'level', u.level,
        'points', u.total_points,
        'percentile', ROUND((1 - (rank::FLOAT / total_users::FLOAT)) * 100)
      )
      FROM (
        SELECT 
          pt.user_id, 
          u.name, 
          u.avatar_url, 
          u.level,
          SUM(pt.points) as total_points,
          RANK() OVER (ORDER BY SUM(pt.points) DESC) as rank,
          COUNT(DISTINCT pt.user_id) OVER() as total_users
        FROM point_transactions pt
        JOIN users u ON pt.user_id = u.id
        WHERE pt.created_at >= v_start_date
        GROUP BY pt.user_id, u.name, u.avatar_url, u.level
        HAVING SUM(pt.points) > 0
      ) u
      ORDER BY u.total_points DESC
      LIMIT p_limit
      OFFSET p_offset;
    END IF;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the function to get user rank details
CREATE OR REPLACE FUNCTION get_user_rank_details(
  p_user_id UUID,
  p_timeframe TEXT DEFAULT 'all',
  p_category TEXT DEFAULT 'points'
) RETURNS SETOF JSONB AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_result JSONB;
BEGIN
  -- Set the start date based on timeframe
  CASE p_timeframe
    WHEN 'week' THEN
      v_start_date := date_trunc('week', now());
    WHEN 'month' THEN
      v_start_date := date_trunc('month', now());
    ELSE
      v_start_date := NULL; -- All time
  END CASE;
  
  -- Get user rank details based on category
  IF p_category = 'points' THEN
    -- Points leaderboard
    IF v_start_date IS NULL THEN
      -- All time
      RETURN QUERY
      SELECT jsonb_build_object(
        'rank', u.rank,
        'total_users', u.total_users,
        'points', u.points,
        'percentile', ROUND((1 - (u.rank::FLOAT / u.total_users::FLOAT)) * 100),
        'highest_rank', COALESCE((SELECT MIN(rank) FROM user_rank_history WHERE user_id = p_user_id), u.rank),
        'highest_level', u.level
      )
      FROM (
        SELECT 
          id, 
          points,
          level,
          RANK() OVER (ORDER BY points DESC) as rank,
          COUNT(*) OVER() as total_users
        FROM users
        WHERE points > 0
      ) u
      WHERE u.id = p_user_id;
    ELSE
      -- Specific timeframe
      RETURN QUERY
      SELECT jsonb_build_object(
        'rank', u.rank,
        'total_users', u.total_users,
        'points', u.total_points,
        'percentile', ROUND((1 - (u.rank::FLOAT / u.total_users::FLOAT)) * 100),
        'highest_rank', COALESCE((SELECT MIN(rank) FROM user_rank_history WHERE user_id = p_user_id), u.rank),
        'highest_level', (SELECT level FROM users WHERE id = p_user_id)
      )
      FROM (
        SELECT 
          pt.user_id, 
          SUM(pt.points) as total_points,
          RANK() OVER (ORDER BY SUM(pt.points) DESC) as rank,
          COUNT(DISTINCT pt.user_id) OVER() as total_users
        FROM point_transactions pt
        WHERE pt.created_at >= v_start_date
        GROUP BY pt.user_id
        HAVING SUM(pt.points) > 0
      ) u
      WHERE u.user_id = p_user_id;
    END IF;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the function to refresh the leaderboard materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard_mv() RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the materialized view exists
  IF EXISTS (
    SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'user_leaderboard_mv'
  ) THEN
    REFRESH MATERIALIZED VIEW user_leaderboard_mv;
    RETURN TRUE;
  ELSE
    -- Create the materialized view if it doesn't exist
    CREATE MATERIALIZED VIEW IF NOT EXISTS user_leaderboard_mv AS
    SELECT 
      u.id,
      u.name,
      u.avatar_url,
      u.level,
      u.points,
      RANK() OVER (ORDER BY u.points DESC) as rank,
      COUNT(*) OVER() as total_users
    FROM users u
    WHERE u.points > 0
    ORDER BY u.points DESC;
    
    -- Create an index on the materialized view
    CREATE UNIQUE INDEX IF NOT EXISTS user_leaderboard_mv_id_idx ON user_leaderboard_mv (id);
    CREATE INDEX IF NOT EXISTS user_leaderboard_mv_rank_idx ON user_leaderboard_mv (rank);
    
    RETURN TRUE;
  END IF;
  
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a table to track user rank history
CREATE TABLE IF NOT EXISTS user_rank_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  total_users INTEGER NOT NULL,
  points INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  timeframe TEXT DEFAULT 'all'
);

-- Create an index on user_id and recorded_at
CREATE INDEX IF NOT EXISTS user_rank_history_user_id_idx ON user_rank_history (user_id);
CREATE INDEX IF NOT EXISTS user_rank_history_recorded_at_idx ON user_rank_history (recorded_at);

-- Create a function to record user rank history
CREATE OR REPLACE FUNCTION record_user_rank_history() RETURNS VOID AS $$
BEGIN
  -- Record all-time rank history
  INSERT INTO user_rank_history (user_id, rank, total_users, points, timeframe)
  SELECT 
    id, 
    RANK() OVER (ORDER BY points DESC),
    COUNT(*) OVER(),
    points,
    'all'
  FROM users
  WHERE points > 0;
  
  -- Record monthly rank history
  INSERT INTO user_rank_history (user_id, rank, total_users, points, timeframe)
  SELECT 
    pt.user_id, 
    RANK() OVER (ORDER BY SUM(pt.points) DESC),
    COUNT(DISTINCT pt.user_id) OVER(),
    SUM(pt.points),
    'month'
  FROM point_transactions pt
  WHERE pt.created_at >= date_trunc('month', now())
  GROUP BY pt.user_id
  HAVING SUM(pt.points) > 0;
  
  -- Record weekly rank history
  INSERT INTO user_rank_history (user_id, rank, total_users, points, timeframe)
  SELECT 
    pt.user_id, 
    RANK() OVER (ORDER BY SUM(pt.points) DESC),
    COUNT(DISTINCT pt.user_id) OVER(),
    SUM(pt.points),
    'week'
  FROM point_transactions pt
  WHERE pt.created_at >= date_trunc('week', now())
  GROUP BY pt.user_id
  HAVING SUM(pt.points) > 0;
 END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the rank history recording (this would typically be done with a cron job)
-- For this example, we'll create a trigger that runs once a day
CREATE OR REPLACE FUNCTION trigger_record_rank_history() RETURNS TRIGGER AS $$
BEGIN
  -- Check if we've already recorded rank history today
  IF NOT EXISTS (
    SELECT 1 FROM user_rank_history 
    WHERE recorded_at >= date_trunc('day', now())
    LIMIT 1
  ) THEN
    PERFORM record_user_rank_history();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on point_transactions to potentially record rank history
DROP TRIGGER IF EXISTS record_rank_history_trigger ON point_transactions;
CREATE TRIGGER record_rank_history_trigger
  AFTER INSERT ON point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_record_rank_history();

-- Initialize the leaderboard materialized view
SELECT refresh_leaderboard_mv();
