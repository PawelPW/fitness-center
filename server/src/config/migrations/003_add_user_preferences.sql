-- Migration: Add user preferences column to users table
-- This enables server-side storage of user preferences with multi-device sync capability
-- Preferences are stored as JSONB for efficient querying and indexing

-- Add preferences column with default empty JSON object
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN users.preferences IS 'User preferences stored as JSONB including language, units, notifications, etc. Enables multi-device sync and server-side preference management';

-- Create GIN index for efficient JSON queries
-- GIN (Generalized Inverted Index) is optimal for JSONB queries
CREATE INDEX IF NOT EXISTS idx_users_preferences
  ON users USING gin(preferences);

-- Create index on updated_at for cache invalidation strategies
CREATE INDEX IF NOT EXISTS idx_users_updated_at
  ON users(updated_at);

-- Update the trigger function to update updated_at timestamp
-- This ensures updated_at changes whenever preferences are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Example preference structure (documented for reference):
-- {
--   "language": "en",           -- User interface language (ISO 639-1 code)
--   "weightUnit": "kg",          -- Weight unit preference (kg or lbs)
--   "distanceUnit": "km",        -- Distance unit preference (km or mi)
--   "dateFormat": "MM/DD/YYYY",  -- Date format preference
--   "timeFormat": "12h",         -- Time format (12h or 24h)
--   "restTimer": 90,             -- Default rest timer in seconds
--   "notifications": {
--     "workoutReminders": true,  -- Enable workout reminder notifications
--     "achievementAlerts": true, -- Enable achievement notifications
--     "weeklyReports": true      -- Enable weekly progress reports
--   },
--   "theme": "dark",             -- UI theme preference (light, dark, auto)
--   "workoutDefaults": {
--     "warmupTime": 300,         -- Default warmup duration in seconds
--     "cooldownTime": 300        -- Default cooldown duration in seconds
--   }
-- }

-- Validate that existing users have the default empty object
-- This ensures consistency for users created before this migration
UPDATE users
  SET preferences = '{}'::jsonb
  WHERE preferences IS NULL;

-- Add NOT NULL constraint now that all rows have a value
ALTER TABLE users
  ALTER COLUMN preferences SET NOT NULL;

-- Add constraint to ensure preferences is always a valid JSON object
ALTER TABLE users
  ADD CONSTRAINT preferences_is_object CHECK (jsonb_typeof(preferences) = 'object');

-- Performance note: GIN index allows efficient queries like:
-- SELECT * FROM users WHERE preferences @> '{"language": "es"}';
-- SELECT * FROM users WHERE preferences ? 'language';
-- SELECT * FROM users WHERE preferences->'notifications'->>'workoutReminders' = 'true';
