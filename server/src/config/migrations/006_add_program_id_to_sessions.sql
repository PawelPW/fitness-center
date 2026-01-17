-- Migration: Add training_program_id to training_sessions
-- BE-1: Database Migration for Program Selection Feature
-- Description: Adds training_program_id foreign key column to training_sessions table
--              This allows planned sessions to reference specific training programs
-- Author: Backend Developer
-- Date: 2026-01-04

-- Add training_program_id column with foreign key constraint
-- This column enables users to select a workout program when planning sessions
-- The program's exercises will be pre-loaded when the workout starts
ALTER TABLE training_sessions
ADD COLUMN IF NOT EXISTS training_program_id INTEGER
REFERENCES training_programs(id) ON DELETE SET NULL;

-- Create index for improved JOIN query performance
-- This index optimizes queries that fetch program details with sessions
-- Particularly important for getAllSessions with program name/exercise count
CREATE INDEX IF NOT EXISTS idx_training_sessions_program_id
ON training_sessions(training_program_id);

-- Add column documentation
-- Explains purpose and nullable behavior for developers
COMMENT ON COLUMN training_sessions.training_program_id IS
'Optional reference to the training program selected when planning. NULL for ad-hoc sessions or sessions created before this feature. Foreign key to training_programs(id) with ON DELETE SET NULL for graceful degradation.';

-- Migration Notes:
-- 1. Column is nullable - supports existing sessions and ad-hoc workouts
-- 2. ON DELETE SET NULL ensures sessions survive program deletion
-- 3. Index improves performance of program name JOINs in getAllSessions
-- 4. IF NOT EXISTS makes migration idempotent (safe to run multiple times)
-- 5. Existing sessions automatically get NULL (no data migration needed)
--
-- Expected behavior:
-- - New planned sessions can include training_program_id
-- - Existing sessions remain unaffected (training_program_id = NULL)
-- - If a program is deleted, sessions keep all data but training_program_id becomes NULL
-- - Sessions function correctly with or without a program association
--
-- Query performance impact:
-- - Before: SELECT * FROM training_sessions (simple scan)
-- - After: SELECT ts.*, tp.name FROM training_sessions ts
--          LEFT JOIN training_programs tp ON ts.training_program_id = tp.id
--          (uses idx_training_sessions_program_id for efficient JOIN)
