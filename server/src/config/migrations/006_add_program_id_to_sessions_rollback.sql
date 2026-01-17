-- Migration Rollback: Remove training_program_id from training_sessions
-- BE-1 Rollback: Safely removes the program selection feature
-- Description: Drops the training_program_id column and its index
-- Author: Backend Developer
-- Date: 2026-01-04

-- Drop the index first (dependent object)
DROP INDEX IF EXISTS idx_training_sessions_program_id;

-- Drop the column (also drops the foreign key constraint)
ALTER TABLE training_sessions
DROP COLUMN IF EXISTS training_program_id;

-- Rollback Notes:
-- 1. Index is dropped first to avoid dependency issues
-- 2. Dropping the column automatically drops the foreign key constraint
-- 3. IF EXISTS clauses make rollback safe to run multiple times
-- 4. Data in other columns remains intact
-- 5. Sessions are not deleted - only the program association is removed
--
-- Data impact:
-- - All planned sessions remain intact
-- - All completed sessions remain intact
-- - Only the training_program_id associations are lost
-- - Can be re-applied later without data loss (associations need to be recreated)
