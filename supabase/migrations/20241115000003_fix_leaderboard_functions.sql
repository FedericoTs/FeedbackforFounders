-- Fix for leaderboard functions

-- Create or replace the get_leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard(
  p_timeframe TEXT DEFAULT 'all',
  p_category TEXT DEFAULT 'points',
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
) RETURNS SETOF JSONB AS $$
DECLARE
  query_text TEXT;
  result JSONB;
BEGIN
  -- Different queries based on timeframe
  IF p_timeframe = 'all' THEN
    -- All time leaderboard
    RETURN QUERY 
    SELECT jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'level', u.level,
      'points', u.points,
      'percentile', 
        CASE 
          WHEN COUNT(*) OVER() > 0 THEN 
            ROUND((100 - (RANK() OVER(ORDER BY u.points DESC)::FLOAT / COUNT(*) OVER() * 100))::NUMERIC, 1)
          ELSE 0
        END
    )
    FROM users u
    ORDER BY u.points DESC
    LIMIT p_limit
    OFFSET p_offset;
  ELSIF p_timeframe = 'month' THEN
    -- Monthly leaderboard
    RETURN QUERY 
    SELECT jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'level', u.level,
      'points', COALESCE(SUM(pt.points), 0),
      'percentile', 0 -- Placeholder, calculate if needed
    )
    FROM users u
    LEFT JOIN point_transactions pt ON u.id = pt.user_id
      AND pt.created_at >= date_trunc('month', CURRENT_DATE)
    GROUP BY u.id, u.name, u.avatar_url, u.level
    ORDER BY COALESCE(SUM(pt.points), 0) DESC
    LIMIT p_limit
    OFFSET p_offset;
  ELSIF p_timeframe = 'week' THEN
    -- Weekly leaderboard
    RETURN QUERY 
    SELECT jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'level', u.level,
      'points', COALESCE(SUM(pt.points), 0),
      'percentile', 0 -- Placeholder, calculate if needed
    )
    FROM users u
    LEFT JOIN point_transactions pt ON u.id = pt.user_id
      AND pt.created_at >= date_trunc('week', CURRENT_DATE)
    GROUP BY u.id, u.name, u.avatar_url, u.level
    ORDER BY COALESCE(SUM(pt.points), 0) DESC
    LIMIT p_limit
    OFFSET p_offset;
  ELSE
    -- Default to all time if invalid timeframe
    RETURN QUERY 
    SELECT jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'level', u.level,
      'points', u.points,
      'percentile', 0
    )
    FROM users u
    ORDER BY u.points DESC
    LIMIT p_limit
    OFFSET p_offset;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the get_user_rank_details function
CREATE OR REPLACE FUNCTION get_user_rank_details(
  p_user_id UUID,
  p_timeframe TEXT DEFAULT 'all',
  p_category TEXT DEFAULT 'points'
) RETURNS SETOF JSONB AS $$
DECLARE
  user_rank INTEGER;
  total_users INTEGER;
  user_points INTEGER;
  user_percentile NUMERIC;
  highest_rank INTEGER;
  highest_level INTEGER;
BEGIN
  -- Different queries based on timeframe
  IF p_timeframe = 'all' THEN
    -- Get user rank for all time
    SELECT 
      rank, 
      total,
      points,
      percentile,
      1, -- placeholder for highest_rank
      level
    INTO 
      user_rank, 
      total_users,
      user_points,
      user_percentile,
      highest_rank,
      highest_level
    FROM (
      SELECT 
        u.id,
        u.points,
        u.level,
        RANK() OVER(ORDER BY u.points DESC) as rank,
        COUNT(*) OVER() as total,
        CASE 
          WHEN COUNT(*) OVER() > 0 THEN 
            ROUND((100 - (RANK() OVER(ORDER BY u.points DESC)::FLOAT / COUNT(*) OVER() * 100))::NUMERIC, 1)
          ELSE 0
        END as percentile
      FROM users u
    ) as ranked
    WHERE id = p_user_id;
  ELSIF p_timeframe = 'month' THEN
    -- Get user rank for current month
    SELECT 
      rank, 
      total,
      points,
      percentile,
      1, -- placeholder for highest_rank
      level
    INTO 
      user_rank, 
      total_users,
      user_points,
      user_percentile,
      highest_rank,
      highest_level
    FROM (
      SELECT 
        u.id,
        u.level,
        COALESCE(SUM(pt.points), 0) as points,
        RANK() OVER(ORDER BY COALESCE(SUM(pt.points), 0) DESC) as rank,
        COUNT(*) OVER() as total,
        CASE 
          WHEN COUNT(*) OVER() > 0 THEN 
            ROUND((100 - (RANK() OVER(ORDER BY COALESCE(SUM(pt.points), 0) DESC)::FLOAT / COUNT(*) OVER() * 100))::NUMERIC, 1)
          ELSE 0
        END as percentile
      FROM users u
      LEFT JOIN point_transactions pt ON u.id = pt.user_id
        AND pt.created_at >= date_trunc('month', CURRENT_DATE)
      GROUP BY u.id, u.level
    ) as ranked
    WHERE id = p_user_id;
  ELSIF p_timeframe = 'week' THEN
    -- Get user rank for current week
    SELECT 
      rank, 
      total,
      points,
      percentile,
      1, -- placeholder for highest_rank
      level
    INTO 
      user_rank, 
      total_users,
      user_points,
      user_percentile,
      highest_rank,
      highest_level
    FROM (
      SELECT 
        u.id,
        u.level,
        COALESCE(SUM(pt.points), 0) as points,
        RANK() OVER(ORDER BY COALESCE(SUM(pt.points), 0) DESC) as rank,
        COUNT(*) OVER() as total,
        CASE 
          WHEN COUNT(*) OVER() > 0 THEN 
            ROUND((100 - (RANK() OVER(ORDER BY COALESCE(SUM(pt.points), 0) DESC)::FLOAT / COUNT(*) OVER() * 100))::NUMERIC, 1)
          ELSE 0
        END as percentile
      FROM users u
      LEFT JOIN point_transactions pt ON u.id = pt.user_id
        AND pt.created_at >= date_trunc('week', CURRENT_DATE)
      GROUP BY u.id, u.level
    ) as ranked
    WHERE id = p_user_id;
  ELSE
    -- Default to all time if invalid timeframe
    SELECT 
      rank, 
      total,
      points,
      percentile,
      1, -- placeholder for highest_rank
      level
    INTO 
      user_rank, 
      total_users,
      user_points,
      user_percentile,
      highest_rank,
      highest_level
    FROM (
      SELECT 
        u.id,
        u.points,
        u.level,
        RANK() OVER(ORDER BY u.points DESC) as rank,
        COUNT(*) OVER() as total,
        CASE 
          WHEN COUNT(*) OVER() > 0 THEN 
            ROUND((100 - (RANK() OVER(ORDER BY u.points DESC)::FLOAT / COUNT(*) OVER() * 100))::NUMERIC, 1)
          ELSE 0
        END as percentile
      FROM users u
    ) as ranked
    WHERE id = p_user_id;
  END IF;
  
  -- Return the result as JSONB
  RETURN QUERY 
  SELECT jsonb_build_object(
    'rank', COALESCE(user_rank, 0),
    'total_users', COALESCE(total_users, 0),
    'points', COALESCE(user_points, 0),
    'percentile', COALESCE(user_percentile, 0),
    'highest_rank', COALESCE(highest_rank, 0),
    'highest_level', COALESCE(highest_level, 0)
  );
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the refresh_leaderboard_mv function
CREATE OR REPLACE FUNCTION refresh_leaderboard_mv() RETURNS BOOLEAN AS $$
BEGIN
  -- This function would normally refresh a materialized view
  -- But since we're using functions directly, we'll just return true
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
