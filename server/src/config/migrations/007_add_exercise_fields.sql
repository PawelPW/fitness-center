-- Migration 007: Add missing fields to exercises table
-- This adds description, last tracking fields, and updated_at column

-- Add description column
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add last training tracking fields
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS last_weight DECIMAL(10, 2);

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS last_date TIMESTAMP;

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS last_repetitions INTEGER;

ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS last_series INTEGER;

-- Add updated_at column for tracking updates
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN exercises.description IS 'Exercise description and instructions';
COMMENT ON COLUMN exercises.last_weight IS 'Last weight used in training (kg)';
COMMENT ON COLUMN exercises.last_date IS 'Last date training was performed';
COMMENT ON COLUMN exercises.last_repetitions IS 'Number of repetitions from last training';
COMMENT ON COLUMN exercises.last_series IS 'Number of series/sets from last training';
COMMENT ON COLUMN exercises.updated_at IS 'Timestamp of last update';
