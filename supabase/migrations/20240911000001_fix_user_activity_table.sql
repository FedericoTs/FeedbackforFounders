-- Check if user_activity table exists, if not create it
CREATE TABLE IF NOT EXISTS public.user_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Ensure RLS is disabled (it's disabled by default, but let's be explicit)
ALTER TABLE public.user_activity DISABLE ROW LEVEL SECURITY;

-- Check if the table is already in the realtime publication
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_activity'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Add to realtime publication if not already added
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity';
        RAISE NOTICE 'Added user_activity table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'user_activity table is already in supabase_realtime publication';
    END IF;
END
$$;

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);

-- Create an index on activity_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_user_activity_activity_type ON public.user_activity(activity_type);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at);
