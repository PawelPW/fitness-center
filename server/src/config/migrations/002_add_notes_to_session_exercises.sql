-- Migration: Add notes column to session_exercises table
-- Allows users to add notes/comments for individual exercises within a training session

ALTER TABLE session_exercises
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN session_exercises.notes IS 'Optional notes or comments for this exercise within the session';
