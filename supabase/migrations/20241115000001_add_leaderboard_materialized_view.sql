-- Create a materialized view for efficient leaderboard queries

-- Drop the materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS user_leaderboard_mv;

-- Create the materialized view
CREATE MATERIALIZED VIEW user_leaderboard_mv AS
SELECT 
    u.id,
    u.name,
    u.avatar_url,
    u.level,
    u.points,
    u.login_streak,
    u.max_login_streak,
    u.created_at,
    u.updated_at,
    ROW_NUMBER() OVER (ORDER BY u.points DESC) as rank,
    COUNT(*) OVER () as total_users,
    ROUND((ROW_NUMBER() OVER (ORDER BY u.points DESC) * 100.0 / COUNT(*) OVER ()), 1) as percentile
FROM 
    users u
WHERE 
    u.points > 0;

-- Create an index on the materialized view for faster lookups
CREATE UNIQUE INDEX user_leaderboard_mv_id_idx ON user_leaderboard_mv (id);
CREATE INDEX user_leaderboard_mv_rank_idx ON user_leaderboard_mv (rank);
CREATE INDEX user_leaderboard_mv_points_idx ON user_leaderboard_mv (points DESC);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard_mv()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_leaderboard_mv;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get the leaderboard with pagination
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_timeframe TEXT DEFAULT 'all',
    p_category TEXT DEFAULT 'points',
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    avatar_url TEXT,
    level INTEGER,
    points INTEGER,
    rank BIGINT,
    percentile NUMERIC
) AS $$
BEGIN
    -- Return data based on timeframe
    IF p_timeframe = 'all' THEN
        RETURN QUERY
        SELECT 
            l.id,
            l.name,
            l.avatar_url,
            l.level,
            l.points,
            l.rank,
            l.percentile
        FROM 
            user_leaderboard_mv l
        ORDER BY 
            l.rank ASC
        LIMIT p_limit
        OFFSET p_offset;
    ELSIF p_timeframe = 'month' THEN
        RETURN QUERY
        SELECT 
            u.id,
            u.name,
            u.avatar_url,
            u.level,
            COALESCE(SUM(pt.points), 0)::INTEGER as points,
            ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pt.points), 0) DESC)::BIGINT as rank,
            0::NUMERIC as percentile
        FROM 
            users u
        LEFT JOIN 
            point_transactions pt ON u.id = pt.user_id AND pt.created_at >= date_trunc('month', CURRENT_DATE)
        GROUP BY 
            u.id, u.name, u.avatar_url, u.level
        HAVING 
            COALESCE(SUM(pt.points), 0) > 0
        ORDER BY 
            points DESC
        LIMIT p_limit
        OFFSET p_offset;
    ELSIF p_timeframe = 'week' THEN
        RETURN QUERY
        SELECT 
            u.id,
            u.name,
            u.avatar_url,
            u.level,
            COALESCE(SUM(pt.points), 0)::INTEGER as points,
            ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pt.points), 0) DESC)::BIGINT as rank,
            0::NUMERIC as percentile
        FROM 
            users u
        LEFT JOIN 
            point_transactions pt ON u.id = pt.user_id AND pt.created_at >= date_trunc('week', CURRENT_DATE)
        GROUP BY 
            u.id, u.name, u.avatar_url, u.level
        HAVING 
            COALESCE(SUM(pt.points), 0) > 0
        ORDER BY 
            points DESC
        LIMIT p_limit
        OFFSET p_offset;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get a user's rank details
CREATE OR REPLACE FUNCTION get_user_rank_details(
    p_user_id UUID,
    p_timeframe TEXT DEFAULT 'all',
    p_category TEXT DEFAULT 'points'
)
RETURNS TABLE (
    rank BIGINT,
    total_users BIGINT,
    percentile NUMERIC,
    points INTEGER,
    highest_rank BIGINT,
    highest_level INTEGER
) AS $$
BEGIN
    IF p_timeframe = 'all' THEN
        RETURN QUERY
        SELECT 
            l.rank,
            l.total_users,
            l.percentile,
            l.points,
            l.rank as highest_rank,
            l.level as highest_level
        FROM 
            user_leaderboard_mv l
        WHERE 
            l.id = p_user_id;
    ELSIF p_timeframe = 'month' THEN
        RETURN QUERY
        WITH month_ranks AS (
            SELECT 
                u.id,
                COALESCE(SUM(pt.points), 0)::INTEGER as points,
                ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pt.points), 0) DESC)::BIGINT as rank,
                COUNT(*) OVER () as total_users
            FROM 
                users u
            LEFT JOIN 
                point_transactions pt ON u.id = pt.user_id AND pt.created_at >= date_trunc('month', CURRENT_DATE)
            GROUP BY 
                u.id
            HAVING 
                COALESCE(SUM(pt.points), 0) > 0
        )
        SELECT 
            mr.rank,
            mr.total_users,
            ROUND((mr.rank * 100.0 / NULLIF(mr.total_users, 0)), 1) as percentile,
            mr.points,
            l.rank as highest_rank,
            u.level as highest_level
        FROM 
            month_ranks mr
        JOIN 
            users u ON mr.id = u.id
        LEFT JOIN 
            user_leaderboard_mv l ON mr.id = l.id
        WHERE 
            mr.id = p_user_id;
    ELSIF p_timeframe = 'week' THEN
        RETURN QUERY
        WITH week_ranks AS (
            SELECT 
                u.id,
                COALESCE(SUM(pt.points), 0)::INTEGER as points,
                ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pt.points), 0) DESC)::BIGINT as rank,
                COUNT(*) OVER () as total_users
            FROM 
                users u
            LEFT JOIN 
                point_transactions pt ON u.id = pt.user_id AND pt.created_at >= date_trunc('week', CURRENT_DATE)
            GROUP BY 
                u.id
            HAVING 
                COALESCE(SUM(pt.points), 0) > 0
        )
        SELECT 
            wr.rank,
            wr.total_users,
            ROUND((wr.rank * 100.0 / NULLIF(wr.total_users, 0)), 1) as percentile,
            wr.points,
            l.rank as highest_rank,
            u.level as highest_level
        FROM 
            week_ranks wr
        JOIN 
            users u ON wr.id = u.id
        LEFT JOIN 
            user_leaderboard_mv l ON wr.id = l.id
        WHERE 
            wr.id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable realtime for the materialized view
alter publication supabase_realtime add table user_leaderboard_mv;