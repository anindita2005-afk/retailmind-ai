-- Ensure the users table has display_id and the trigger to auto-generate it
-- Tables already created in 001_create_tables.sql

-- Add display_id sequence function for auto-generating RIQ-YYYY-NNNN
CREATE OR REPLACE FUNCTION generate_display_id() RETURNS TEXT AS $$
DECLARE
  year_str TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
  seq_num  INT;
  display  TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO seq_num FROM public.users;
  display := 'RIQ-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN display;
END;
$$ LANGUAGE plpgsql;

-- Back-fill any users missing display_id
UPDATE public.users
SET display_id = 'RIQ-' || EXTRACT(YEAR FROM created_at)::TEXT || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0')
WHERE display_id IS NULL OR display_id = '';
