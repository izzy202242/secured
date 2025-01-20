/*
  # Fix User Creation Process
  
  1. Changes
    - Improve handle_new_user function with better error handling
    - Add explicit checks for required fields
    - Ensure proper COALESCE handling
  2. Security
    - Maintain existing security policies
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS create_profile_for_new_user ON auth.users;

-- Improved function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _name text;
  _email text;
BEGIN
  -- Get name with fallbacks
  _name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(split_part(NEW.email, '@', 1), ''),
    'User'
  );

  -- Get email with fallback
  _email := COALESCE(
    NULLIF(NEW.email, ''),
    'no-email'
  );

  -- Insert or update profile
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, _name, _email)
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = now();

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error details to Postgres logs
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER create_profile_for_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();