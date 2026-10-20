-- Add address column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;
