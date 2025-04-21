-- Create a function to get enum values
CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
RETURNS TABLE (enum_value text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT enumlabel::text FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = %L)',
    enum_name
  );
END;
$$;
