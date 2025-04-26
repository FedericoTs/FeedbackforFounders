-- Create user_preferences table for storing user-specific preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL,
  preference_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, preference_type)
);

-- Add comment to the table
COMMENT ON TABLE public.user_preferences IS 'Stores user preferences like sound settings, theme preferences, etc.';

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create index for faster lookups by preference_type
CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON public.user_preferences(preference_type);

-- Enable row-level security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences table
-- Users can read their own preferences
CREATE POLICY user_preferences_select ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY user_preferences_insert ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY user_preferences_update ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY user_preferences_delete ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Note: We're not adding to realtime publication because it's already defined as FOR ALL TABLES