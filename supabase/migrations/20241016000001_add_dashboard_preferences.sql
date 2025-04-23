-- Create user_dashboard_preferences table to store user dashboard layouts
CREATE TABLE IF NOT EXISTS public.user_dashboard_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own dashboard preferences
DROP POLICY IF EXISTS "Users can read their own dashboard preferences" ON public.user_dashboard_preferences;
CREATE POLICY "Users can read their own dashboard preferences"
    ON public.user_dashboard_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own dashboard preferences
DROP POLICY IF EXISTS "Users can insert their own dashboard preferences" ON public.user_dashboard_preferences;
CREATE POLICY "Users can insert their own dashboard preferences"
    ON public.user_dashboard_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own dashboard preferences
DROP POLICY IF EXISTS "Users can update their own dashboard preferences" ON public.user_dashboard_preferences;
CREATE POLICY "Users can update their own dashboard preferences"
    ON public.user_dashboard_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy for users to delete their own dashboard preferences
DROP POLICY IF EXISTS "Users can delete their own dashboard preferences" ON public.user_dashboard_preferences;
CREATE POLICY "Users can delete their own dashboard preferences"
    ON public.user_dashboard_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add to realtime publication
alter publication supabase_realtime add table user_dashboard_preferences;
