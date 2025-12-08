-- Add new fields to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS last_weight DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_repetitions INTEGER,
ADD COLUMN IF NOT EXISTS last_series INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN exercises.description IS 'Exercise description and instructions';
COMMENT ON COLUMN exercises.last_weight IS 'Last weight used in training (kg)';
COMMENT ON COLUMN exercises.last_date IS 'Last date training was performed';
COMMENT ON COLUMN exercises.last_repetitions IS 'Number of repetitions from last training';
COMMENT ON COLUMN exercises.last_series IS 'Number of series/sets from last training';
