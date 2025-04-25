-- Drop the existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS user_leaderboard_mv;

-- Create the materialized view with corrected columns
CREATE MATERIALIZED VIEW user_leaderboard_mv AS
SELECT
    u.id,
    u.name,
    u.avatar_url,
    u.level,
    u.points,
    COALESCE(u.login_streak, 0) AS login_streak,
    COALESCE(u.max_login_streak, 0) AS max_login_streak,
    ROW_NUMBER() OVER (ORDER BY u.points DESC) AS rank
FROM
    users u
WHERE
    u.points > 0;

-- Create an index on the materialized view for faster lookups
CREATE UNIQUE INDEX ON user_leaderboard_mv (id);
CREATE INDEX ON user_leaderboard_mv (points DESC);
CREATE INDEX ON user_leaderboard_mv (rank);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard_mv()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_leaderboard_mv;
    RETURN true;
END;
$$;
