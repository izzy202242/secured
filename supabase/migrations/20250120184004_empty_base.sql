/*
  # Fix profile creation trigger

  1. Changes
    - Update handle_new_user() function to better handle missing metadata
    - Add fallback for name when metadata is not available
    - Ensure email is properly handled

  2. Security
    - No changes to existing security policies
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'name'),
      (NEW.raw_user_meta_data->>'full_name'),
      split_part(NEW.email, '@', 1),
      'User'
    ),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;