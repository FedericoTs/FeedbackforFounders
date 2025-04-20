-- Enable Row Level Security for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload to project-thumbnails bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload to project-thumbnails" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload to project-thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-thumbnails' AND
  auth.uid() = owner
);

-- Create policy to allow authenticated users to select from project-thumbnails bucket
DROP POLICY IF EXISTS "Allow authenticated users to select from project-thumbnails" ON storage.objects;
CREATE POLICY "Allow authenticated users to select from project-thumbnails"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'project-thumbnails');

-- Create policy to allow public access to project-thumbnails bucket
DROP POLICY IF EXISTS "Allow public access to project-thumbnails" ON storage.objects;
CREATE POLICY "Allow public access to project-thumbnails"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'project-thumbnails');

-- Create policy to allow authenticated users to update their own objects
DROP POLICY IF EXISTS "Allow authenticated users to update their own objects" ON storage.objects;
CREATE POLICY "Allow authenticated users to update their own objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-thumbnails' AND auth.uid() = owner);

-- Create policy to allow authenticated users to delete their own objects
DROP POLICY IF EXISTS "Allow authenticated users to delete their own objects" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete their own objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-thumbnails' AND auth.uid() = owner);
