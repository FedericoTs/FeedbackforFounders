-- Fix storage permissions for project thumbnails

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create policies with proper permissions

-- Public read access for all files
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-thumbnails');

-- Allow authenticated users to upload files to project-thumbnails bucket
-- Using WITH CHECK instead of USING for INSERT operations
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-thumbnails' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-thumbnails' AND
  auth.uid()::text = owner
);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-thumbnails' AND
  auth.uid()::text = owner
);

-- Ensure the project-thumbnails bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-thumbnails', 'project-thumbnails', true)
ON CONFLICT (id) DO NOTHING;
