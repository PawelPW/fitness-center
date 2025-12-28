-- Migration: Add user profile fields for fitness tracking
-- Description: Adds weight, height, fitness goals, and activity level to users table
-- Author: Claude Code
-- Date: 2025-12-28

-- Add profile columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT 'male',
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS fitness_goal VARCHAR(50) DEFAULT 'maintenance',
ADD COLUMN IF NOT EXISTS activity_level VARCHAR(20) DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS weekly_workout_target INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index on user_id for faster profile queries
CREATE INDEX IF NOT EXISTS idx_users_profile ON users(id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN users.age IS 'User age in years';
COMMENT ON COLUMN users.gender IS 'User gender (male, female, other)';
COMMENT ON COLUMN users.weight_kg IS 'Current weight in kilograms';
COMMENT ON COLUMN users.height_cm IS 'Height in centimeters';
COMMENT ON COLUMN users.target_weight_kg IS 'Target weight goal in kilograms';
COMMENT ON COLUMN users.fitness_goal IS 'Fitness goal (weight_loss, muscle_gain, maintenance, endurance)';
COMMENT ON COLUMN users.activity_level IS 'Activity level (sedentary, light, moderate, active, very_active)';
COMMENT ON COLUMN users.weekly_workout_target IS 'Target number of workouts per week';
