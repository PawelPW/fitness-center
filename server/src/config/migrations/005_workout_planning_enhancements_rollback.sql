-- Rollback Migration: Remove Workout Planning Enhancements
-- BE-8: Rollback script to remove optional columns and indexes
-- WARNING: This will permanently delete scheduled_time data!

-- Drop performance indexes
DROP INDEX IF EXISTS idx_training_sessions_completed;
DROP INDEX IF EXISTS idx_training_sessions_session_date;
DROP INDEX IF EXISTS idx_training_sessions_user_completed_date;
DROP INDEX IF EXISTS idx_training_sessions_completed_date;

-- Remove column comments
COMMENT ON COLUMN training_sessions.scheduled_time IS NULL;
COMMENT ON COLUMN training_sessions.completed IS NULL;
COMMENT ON COLUMN training_sessions.duration IS NULL;
COMMENT ON COLUMN training_sessions.calories IS NULL;

-- Remove table comment
COMMENT ON TABLE training_sessions IS NULL;

-- Remove scheduled_time column
-- WARNING: This will permanently delete all scheduled time data!
ALTER TABLE training_sessions
  DROP COLUMN IF EXISTS scheduled_time;

-- Note: This rollback removes the scheduled_time column and all performance indexes
-- The system will continue to work but queries may be slower without indexes
-- Planned/completed functionality remains intact (uses existing completed column)
