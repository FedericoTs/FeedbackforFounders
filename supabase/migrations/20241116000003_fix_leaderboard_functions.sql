-- Create or replace the get_leaderboard function
CREATE OR REPLACE FUNCTION get_leaderboard(
    p_timeframe text DEFAULT 'all',
    p_category text DEFAULT 'points',
    p_limit integer DEFAULT 10,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    name text,
    avatar_url text,
    level integer,
    points integer,
    rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- For all-time leaderboard, use the materialized view
    IF p_timeframe = 'all' AND p_category = 'points' THEN
        RETURN QUERY
        SELECT
            u.id,
            u.name,
            u.avatar_url,
            u.level,
            u.points,
            u.rank
        FROM
            user_leaderboard_mv u
        ORDER BY
            u.rank
        LIMIT p_limit
        OFFSET p_offset;
    
    -- For monthly leaderboard
    ELSIF p_timeframe = 'month' AND p_category = 'points' THEN
        -- If point_transactions table exists, use it
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions') THEN
            RETURN QUERY
            SELECT
                u.id,
                u.name,
                u.avatar_url,
                u.level,
                COALESCE(SUM(pt.points), 0)::integer AS points,
                ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pt.points), 0) DESC)::bigint AS rank
            FROM
                users u
            LEFT JOIN
                point_transactions pt ON u.id = pt.user_id
                AND pt.created_at >= date_trunc('month', now())
            GROUP BY
                u.id, u.name, u.avatar_url, u.level
            ORDER BY
                points DESC
            LIMIT p_limit
            OFFSET p_offset;
        ELSE
            -- Fallback to using the materialized view
            RETURN QUERY
            SELECT
                u.id,
                u.name,
                u.avatar_url,
                u.level,
                u.points,
                u.rank
            FROM
                user_leaderboard_mv u
            ORDER BY
                u.rank
            LIMIT p_limit
            OFFSET p_offset;
        END IF;
    
    -- For weekly leaderboard
    ELSIF p_timeframe = 'week' AND p_category = 'points' THEN
        -- If point_transactions table exists, use it
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions') THEN
            RETURN QUERY
            SELECT
                u.id,
                u.name,
                u.avatar_url,
                u.level,
                COALESCE(SUM(pt.points), 0)::integer AS points,
                ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(pt.points), 0) DESC)::bigint AS rank
            FROM
                users u
            LEFT JOIN
                point_transactions pt ON u.id = pt.user_id
                AND pt.created_at >= date_trunc('week', now())
            GROUP BY
                u.id, u.name, u.avatar_url, u.level
            ORDER BY
                points DESC
            LIMIT p_limit
            OFFSET p_offset;
        ELSE
            -- Fallback to using the materialized view
            RETURN QUERY
            SELECT
                u.id,
                u.name,
                u.avatar_url,
                u.level,
                u.points,
                u.rank
            FROM
                user_leaderboard_mv u
            ORDER BY
                u.rank
            LIMIT p_limit
            OFFSET p_offset;
        END IF;
    
    -- Default fallback
    ELSE
        RETURN QUERY
        SELECT
            u.id,
            u.name,
            u.avatar_url,
            u.level,
            u.points,
            u.rank
        FROM
            user_leaderboard_mv u
        ORDER BY
            u.rank
        LIMIT p_limit
        OFFSET p_offset;
    END IF;
END;
$$;

-- Create or replace the get_user_rank_details function
CREATE OR REPLACE FUNCTION get_user_rank_details(
    p_user_id uuid,
    p_timeframe text DEFAULT 'all',
    p_category text DEFAULT 'points'
)
RETURNS TABLE (
    rank bigint,
    total_users bigint,
    percentile numeric,
    points integer,
    highest_rank bigint,
    highest_level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_users bigint;
    v_user_rank bigint;
    v_user_points integer;
BEGIN
    -- Get total number of users with points
    SELECT COUNT(*) INTO v_total_users FROM users WHERE points > 0;
    
    -- For all-time leaderboard
    IF p_timeframe = 'all' AND p_category = 'points' THEN
        -- Get user's rank from materialized view
        SELECT rank, points INTO v_user_rank, v_user_points
        FROM user_leaderboard_mv
        WHERE id = p_user_id;
        
        -- Return user rank details
        RETURN QUERY
        SELECT
            COALESCE(v_user_rank, v_total_users)::bigint AS rank,
            v_total_users AS total_users,
            CASE
                WHEN v_total_users > 0 THEN
                    ROUND((1 - (COALESCE(v_user_rank, v_total_users)::numeric / v_total_users)) * 100, 1)
                ELSE 0
            END AS percentile,
            COALESCE(v_user_points, 0) AS points,
            COALESCE(v_user_rank, v_total_users)::bigint AS highest_rank,
            (SELECT level FROM users WHERE id = p_user_id) AS highest_level;
    
    -- For other timeframes, calculate on the fly
    ELSE
        -- Get user's points for the specified timeframe
        IF p_timeframe = 'month' AND p_category = 'points' AND 
           EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions') THEN
            SELECT COALESCE(SUM(points), 0)::integer INTO v_user_points
            FROM point_transactions
            WHERE user_id = p_user_id
            AND created_at >= date_trunc('month', now());
        ELSIF p_timeframe = 'week' AND p_category = 'points' AND
              EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions') THEN
            SELECT COALESCE(SUM(points), 0)::integer INTO v_user_points
            FROM point_transactions
            WHERE user_id = p_user_id
            AND created_at >= date_trunc('week', now());
        ELSE
            SELECT points INTO v_user_points
            FROM users
            WHERE id = p_user_id;
        END IF;
        
        -- Calculate user's rank
        IF p_timeframe = 'month' AND p_category = 'points' AND
           EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions') THEN
            SELECT COUNT(*) + 1 INTO v_user_rank
            FROM (
                SELECT user_id, SUM(points) AS total_points
                FROM point_transactions
                WHERE created_at >= date_trunc('month', now())
                GROUP BY user_id
                HAVING SUM(points) > COALESCE(v_user_points, 0)
            ) AS higher_ranked;
        ELSIF p_timeframe = 'week' AND p_category = 'points' AND
              EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'point_transactions') THEN
            SELECT COUNT(*) + 1 INTO v_user_rank
            FROM (
                SELECT user_id, SUM(points) AS total_points
                FROM point_transactions
                WHERE created_at >= date_trunc('week', now())
                GROUP BY user_id
                HAVING SUM(points) > COALESCE(v_user_points, 0)
            ) AS higher_ranked;
        ELSE
            SELECT rank INTO v_user_rank
            FROM user_leaderboard_mv
            WHERE id = p_user_id;
        END IF;
        
        -- Return user rank details
        RETURN QUERY
        SELECT
            COALESCE(v_user_rank, v_total_users)::bigint AS rank,
            v_total_users AS total_users,
            CASE
                WHEN v_total_users > 0 THEN
                    ROUND((1 - (COALESCE(v_user_rank, v_total_users)::numeric / v_total_users)) * 100, 1)
                ELSE 0
            END AS percentile,
            COALESCE(v_user_points, 0) AS points,
            COALESCE(v_user_rank, v_total_users)::bigint AS highest_rank,
            (SELECT level FROM users WHERE id = p_user_id) AS highest_level;
    END IF;
END;
$$;
