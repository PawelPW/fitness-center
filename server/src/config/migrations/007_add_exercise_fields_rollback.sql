-- Rollback Migration 007: Remove exercise fields
-- WARNING: This will permanently delete data in these columns

ALTER TABLE exercises DROP COLUMN IF EXISTS description;
ALTER TABLE exercises DROP COLUMN IF EXISTS last_weight;
ALTER TABLE exercises DROP COLUMN IF EXISTS last_date;
ALTER TABLE exercises DROP COLUMN IF EXISTS last_repetitions;
ALTER TABLE exercises DROP COLUMN IF EXISTS last_series;
ALTER TABLE exercises DROP COLUMN IF EXISTS updated_at;
