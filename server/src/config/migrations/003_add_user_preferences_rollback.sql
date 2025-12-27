-- Rollback Migration: Remove user preferences column from users table
-- This rollback script safely removes the preferences feature if needed
-- WARNING: This will permanently delete all user preference data!

-- Drop the trigger first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_users_preferences;
DROP INDEX IF EXISTS idx_users_updated_at;

-- Remove the CHECK constraint
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS preferences_is_object;

-- Remove the preferences column
ALTER TABLE users
  DROP COLUMN IF EXISTS preferences;

-- Note: This rollback does NOT remove the updated_at column
-- as it was part of the original schema and may be used elsewhere
-- If you need to rollback updated_at as well, ensure it's safe to do so

COMMENT ON TABLE users IS 'Users table - preferences column removed by rollback migration';
