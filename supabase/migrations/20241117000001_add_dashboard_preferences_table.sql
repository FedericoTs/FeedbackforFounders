-- Create dashboard_preferences table for storing user dashboard layouts and widget preferences
CREATE TABLE IF NOT EXISTS public.dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets JSONB DEFAULT '[]'::jsonb,
  layout JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable row level security
ALTER TABLE public.dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard_preferences
DROP POLICY IF EXISTS "Users can view their own dashboard preferences" ON public.dashboard_preferences;
CREATE POLICY "Users can view their own dashboard preferences" 
  ON public.dashboard_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own dashboard preferences" ON public.dashboard_preferences;
CREATE POLICY "Users can update their own dashboard preferences" 
  ON public.dashboard_preferences
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own dashboard preferences" ON public.dashboard_preferences;
CREATE POLICY "Users can insert their own dashboard preferences" 
  ON public.dashboard_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own dashboard preferences" ON public.dashboard_preferences;
CREATE POLICY "Users can delete their own dashboard preferences" 
  ON public.dashboard_preferences
  FOR DELETE USING (auth.uid() = user_id);
