-- Ensure user_activity table exists and has the correct structure
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    metadata JSONB,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Ensure RLS is disabled for user_activity table
ALTER TABLE public.user_activity DISABLE ROW LEVEL SECURITY;

-- Ensure the table is added to the realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.users, public.user_activity, public.projects, public.project_activity, public.project_comments, public.project_goals, public.project_questionnaires, public.questionnaire_responses;

-- Create index on user_id and activity_type for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_project_id ON public.user_activity(project_id);

-- Create a function to sync user points from activity records
CREATE OR REPLACE FUNCTION public.sync_user_points(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    total_points INTEGER;
BEGIN
    -- Calculate total points from user_activity
    SELECT COALESCE(SUM(points), 0) INTO total_points
    FROM public.user_activity
    WHERE user_id = p_user_id;
    
    -- Update user's points
    UPDATE public.users
    SET points = total_points
    WHERE id = p_user_id;
    
    -- Log the sync operation
    INSERT INTO public.user_activity (user_id, activity_type, description, points, metadata)
    VALUES (p_user_id, 'points_sync', 'Points synchronized from activity records', 0, json_build_object('total_points', total_points));
END;
$$ LANGUAGE plpgsql;
