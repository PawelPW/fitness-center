-- Migration: Workout Planning Enhancements
-- BE-8: Add optional columns and performance indexes for workout planning feature
-- This migration adds scheduled_time for precise workout scheduling and performance indexes

-- Add scheduled_time column for time-specific workout scheduling
-- This allows users to plan workouts at specific times (e.g., 9:00 AM, 6:30 PM)
-- NULL means no specific time scheduled (all-day event)
ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Add column comment for documentation
COMMENT ON COLUMN training_sessions.scheduled_time IS
  'Optional time for scheduled workouts. NULL indicates all-day event. Used for workout planning and reminders.';

-- Add comment to completed column for clarity
COMMENT ON COLUMN training_sessions.completed IS
  'Boolean flag: false = planned/scheduled workout, true = completed workout with actual data';

-- Add comment to duration column
COMMENT ON COLUMN training_sessions.duration IS
  'Actual workout duration in minutes. NULL for planned sessions, populated when completed.';

-- Add comment to calories column
COMMENT ON COLUMN training_sessions.calories IS
  'Actual calories burned. NULL for planned sessions, populated when completed.';

-- Performance: Create index on completed column
-- This speeds up queries filtering by planned vs completed sessions
-- Used extensively in: getAllSessions, getUpcomingPlannedSessions, calendar views
CREATE INDEX IF NOT EXISTS idx_training_sessions_completed
  ON training_sessions(completed);

-- Performance: Create index on session_date
-- This speeds up date range queries and ordering
-- Used in: upcoming sessions, calendar views, monthly stats
CREATE INDEX IF NOT EXISTS idx_training_sessions_session_date
  ON training_sessions(session_date);

-- Performance: Create composite index on (user_id, completed, session_date)
-- This is optimal for the most common query pattern:
-- "Get all planned/completed sessions for user X in date range Y"
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_completed_date
  ON training_sessions(user_id, completed, session_date);

-- Performance: Create index on (completed, session_date) for global queries
-- This supports queries like "all upcoming planned sessions"
CREATE INDEX IF NOT EXISTS idx_training_sessions_completed_date
  ON training_sessions(completed, session_date)
  WHERE completed = false; -- Partial index: only index planned sessions

-- Add table comment for overall documentation
COMMENT ON TABLE training_sessions IS
  'Training sessions table. Supports both planned (completed=false) and completed (completed=true) workouts. Used for workout planning, tracking, and history.';

-- Query performance examples enabled by these indexes:
--
-- 1. Get upcoming planned sessions (uses idx_training_sessions_completed_date):
--    SELECT * FROM training_sessions
--    WHERE completed = false AND session_date >= CURRENT_DATE
--    ORDER BY session_date ASC;
--
-- 2. Get user sessions in date range (uses idx_training_sessions_user_completed_date):
--    SELECT * FROM training_sessions
--    WHERE user_id = 1 AND completed = true
--    AND session_date >= '2026-01-01' AND session_date < '2026-02-01'
--    ORDER BY session_date DESC;
--
-- 3. Filter by completion status (uses idx_training_sessions_completed):
--    SELECT * FROM training_sessions WHERE user_id = 1 AND completed = false;
--
-- 4. Calendar month view (uses idx_training_sessions_user_completed_date):
--    SELECT * FROM training_sessions
--    WHERE user_id = 1
--    AND session_date >= DATE_TRUNC('month', CURRENT_DATE)
--    AND session_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
--    ORDER BY session_date ASC;
