-- Migration: Create session_exercise_sets table for individual set tracking
-- This table stores detailed data for each set within an exercise during a workout session

CREATE TABLE IF NOT EXISTS session_exercise_sets (
  id SERIAL PRIMARY KEY,
  session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  rest_time INTEGER DEFAULT 0,  -- seconds of rest before this set
  timestamp BIGINT NOT NULL,     -- Unix timestamp when set was completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints to ensure data integrity
  CONSTRAINT valid_set_number CHECK (set_number > 0),
  CONSTRAINT valid_reps CHECK (reps > 0),
  CONSTRAINT valid_weight CHECK (weight >= 0)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_session_exercise_sets_session_exercise_id
  ON session_exercise_sets(session_exercise_id);

CREATE INDEX IF NOT EXISTS idx_session_exercise_sets_timestamp
  ON session_exercise_sets(timestamp);

-- Composite index for querying sets by exercise and session
CREATE INDEX IF NOT EXISTS idx_sets_exercise_timestamp
  ON session_exercise_sets(session_exercise_id, timestamp DESC);

-- Add comment for documentation
COMMENT ON TABLE session_exercise_sets IS 'Stores individual set data for workout exercises with detailed metrics including weight, reps, rest time, and timestamp';
COMMENT ON COLUMN session_exercise_sets.set_number IS 'Sequential number of the set within the exercise (1, 2, 3, etc.)';
COMMENT ON COLUMN session_exercise_sets.rest_time IS 'Rest time in seconds between this set and the previous one';
COMMENT ON COLUMN session_exercise_sets.timestamp IS 'Unix timestamp (milliseconds) when the set was completed';
