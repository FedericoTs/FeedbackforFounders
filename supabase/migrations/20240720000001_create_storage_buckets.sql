-- Create storage buckets for profile images

-- Create avatars bucket if it doesn't exist
BEGIN;
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

  -- Set RLS policy for avatars bucket
  CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

  CREATE POLICY "Users can upload avatar images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

  CREATE POLICY "Users can update their own avatar images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'avatars' AND auth.uid() = owner);

  CREATE POLICY "Users can delete their own avatar images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'avatars' AND auth.uid() = owner);
COMMIT;

-- Create banners bucket if it doesn't exist
BEGIN;
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('banners', 'banners', true)
  ON CONFLICT (id) DO NOTHING;

  -- Set RLS policy for banners bucket
  CREATE POLICY "Banner images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'banners');

  CREATE POLICY "Users can upload banner images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'banners' AND auth.uid() IS NOT NULL);

  CREATE POLICY "Users can update their own banner images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'banners' AND auth.uid() = owner);

  CREATE POLICY "Users can delete their own banner images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'banners' AND auth.uid() = owner);
COMMIT;
