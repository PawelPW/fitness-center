-- ============================================
-- FITNESS CENTER DATABASE INITIALIZATION
-- ============================================
-- This script sets up the complete database schema
-- for production deployment
-- Run this on your cloud PostgreSQL database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  training_type VARCHAR(50) NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  description TEXT,
  last_weight DECIMAL(10, 2),
  last_date TIMESTAMP,
  last_repetitions INTEGER,
  last_series INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name, training_type)
);

-- Training programs table
CREATE TABLE IF NOT EXISTS training_programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  training_type VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Training program exercises (junction table with exercise parameters)
CREATE TABLE IF NOT EXISTS program_exercises (
  id SERIAL PRIMARY KEY,
  program_id INTEGER REFERENCES training_programs(id) ON DELETE CASCADE,
  exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL(10, 2),
  duration INTEGER,
  rest_time INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(program_id, exercise_id, order_index)
);

-- Training sessions (workout history)
CREATE TABLE IF NOT EXISTS training_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  program_id INTEGER REFERENCES training_programs(id) ON DELETE SET NULL,
  training_type VARCHAR(50) NOT NULL,
  session_date TIMESTAMP NOT NULL,
  duration INTEGER,
  calories INTEGER,
  notes TEXT,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session exercises (actual exercises performed in a session)
CREATE TABLE IF NOT EXISTS session_exercises (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES training_sessions(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DECIMAL(10, 2),
  duration INTEGER,
  distance DECIMAL(10, 2),
  calories INTEGER,
  avg_heart_rate INTEGER,
  rounds INTEGER,
  round_duration INTEGER,
  rest_between_rounds INTEGER,
  laps INTEGER,
  rest_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_training_type ON exercises(training_type);
CREATE INDEX IF NOT EXISTS idx_training_programs_user_id ON training_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_program_exercises_program_id ON program_exercises(program_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session_id ON session_exercises(session_id);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON COLUMN exercises.description IS 'Exercise description and instructions';
COMMENT ON COLUMN exercises.last_weight IS 'Last weight used in training (kg)';
COMMENT ON COLUMN exercises.last_date IS 'Last date training was performed';
COMMENT ON COLUMN exercises.last_repetitions IS 'Number of repetitions from last training';
COMMENT ON COLUMN exercises.last_series IS 'Number of series/sets from last training';

-- ============================================
-- DEFAULT EXERCISES
-- ============================================
-- These are system exercises (user_id = NULL, is_custom = FALSE)
-- Available to all users as templates

-- STRENGTH TRAINING - Upper Body
INSERT INTO exercises (user_id, name, description, training_type, is_custom, created_at) VALUES
(NULL, 'Bench Press (Flat)', 'Chest compound exercise using barbell on flat bench', 'Strength', FALSE, NOW()),
(NULL, 'Bench Press (Incline)', 'Upper chest focus using incline bench', 'Strength', FALSE, NOW()),
(NULL, 'Overhead Press', 'Shoulder compound exercise, standing or seated barbell press', 'Strength', FALSE, NOW()),
(NULL, 'Lat Pulldown', 'Back exercise targeting latissimus dorsi muscles', 'Strength', FALSE, NOW()),
(NULL, 'Seated Row', 'Cable back exercise for thickness and width', 'Strength', FALSE, NOW()),
(NULL, 'Bent-Over Row', 'Barbell back exercise for overall back development', 'Strength', FALSE, NOW()),
(NULL, 'Dumbbell Chest Press', 'Chest exercise with dumbbells for greater range of motion', 'Strength', FALSE, NOW()),
(NULL, 'Dumbbell Shoulder Press', 'Shoulder exercise with dumbbells, seated or standing', 'Strength', FALSE, NOW()),
(NULL, 'Biceps Curls (Dumbbell)', 'Isolation exercise for biceps using dumbbells', 'Strength', FALSE, NOW()),
(NULL, 'Biceps Curls (Barbell)', 'Isolation exercise for biceps using barbell', 'Strength', FALSE, NOW()),
(NULL, 'Triceps Pushdown', 'Cable isolation exercise for triceps', 'Strength', FALSE, NOW()),
(NULL, 'Overhead Triceps Extension', 'Triceps isolation exercise, standing or seated', 'Strength', FALSE, NOW()),

-- STRENGTH TRAINING - Lower Body
(NULL, 'Back Squat', 'Compound leg exercise with barbell on back', 'Strength', FALSE, NOW()),
(NULL, 'Leg Press', 'Machine-based compound leg exercise', 'Strength', FALSE, NOW()),
(NULL, 'Romanian Deadlift', 'Hip hinge exercise targeting hamstrings and glutes', 'Strength', FALSE, NOW()),
(NULL, 'Conventional Deadlift', 'Full body compound exercise, king of lifts', 'Strength', FALSE, NOW()),
(NULL, 'Lunges (Dumbbell)', 'Unilateral leg exercise with dumbbells', 'Strength', FALSE, NOW()),
(NULL, 'Lunges (Barbell)', 'Unilateral leg exercise with barbell', 'Strength', FALSE, NOW()),
(NULL, 'Leg Extension', 'Isolation exercise for quadriceps', 'Strength', FALSE, NOW()),
(NULL, 'Hamstring Curl', 'Isolation exercise for hamstrings', 'Strength', FALSE, NOW()),

-- STRENGTH TRAINING - Core
(NULL, 'Cable Woodchoppers', 'Rotational core exercise using cable machine', 'Strength', FALSE, NOW()),
(NULL, 'Cable Crunch', 'Abdominal exercise using cable machine', 'Strength', FALSE, NOW()),
(NULL, 'Weighted Planks', 'Isometric core exercise with added weight', 'Strength', FALSE, NOW()),

-- CALISTHENICS - Upper Body
(NULL, 'Push-ups (Standard)', 'Bodyweight chest and triceps exercise', 'Calisthenics', FALSE, NOW()),
(NULL, 'Push-ups (Incline)', 'Easier push-up variation with hands elevated', 'Calisthenics', FALSE, NOW()),
(NULL, 'Push-ups (Decline)', 'Harder push-up variation with feet elevated', 'Calisthenics', FALSE, NOW()),
(NULL, 'Dips', 'Bodyweight triceps and chest exercise on parallel bars', 'Calisthenics', FALSE, NOW()),
(NULL, 'Pull-ups', 'Bodyweight back exercise with overhand grip', 'Calisthenics', FALSE, NOW()),
(NULL, 'Chin-ups', 'Bodyweight back and biceps exercise with underhand grip', 'Calisthenics', FALSE, NOW()),
(NULL, 'Bodyweight Rows (Australian Rows)', 'Horizontal pulling exercise using bar or rings', 'Calisthenics', FALSE, NOW()),
(NULL, 'Pike Push-ups', 'Shoulder-focused push-up variation', 'Calisthenics', FALSE, NOW()),

-- CALISTHENICS - Lower Body
(NULL, 'Bodyweight Squats', 'Basic squat movement without added weight', 'Calisthenics', FALSE, NOW()),
(NULL, 'Split Squats', 'Unilateral leg exercise in split stance', 'Calisthenics', FALSE, NOW()),
(NULL, 'Bulgarian Split Squats', 'Advanced unilateral leg exercise with rear foot elevated', 'Calisthenics', FALSE, NOW()),
(NULL, 'Glute Bridges', 'Hip extension exercise targeting glutes', 'Calisthenics', FALSE, NOW()),
(NULL, 'Hip Thrusts', 'Advanced glute exercise with shoulders elevated', 'Calisthenics', FALSE, NOW()),

-- CALISTHENICS - Core
(NULL, 'Plank', 'Isometric core exercise in prone position', 'Calisthenics', FALSE, NOW()),
(NULL, 'Side Plank', 'Isometric core exercise targeting obliques', 'Calisthenics', FALSE, NOW()),
(NULL, 'Hanging Leg Raises', 'Advanced core exercise hanging from pull-up bar', 'Calisthenics', FALSE, NOW()),
(NULL, 'V-Ups', 'Dynamic core exercise targeting entire abdominal wall', 'Calisthenics', FALSE, NOW()),
(NULL, 'Mountain Climbers', 'Dynamic core exercise with cardio component', 'Calisthenics', FALSE, NOW()),

-- CARDIO - Low/Moderate Intensity
(NULL, 'Treadmill Walking', 'Low-impact cardio exercise', 'Cardio', FALSE, NOW()),
(NULL, 'Treadmill Incline Walking', 'Moderate cardio with increased difficulty', 'Cardio', FALSE, NOW()),
(NULL, 'Light Jogging', 'Moderate intensity running', 'Cardio', FALSE, NOW()),
(NULL, 'Cycling (Stationary)', 'Low-impact cardio on stationary bike', 'Cardio', FALSE, NOW()),
(NULL, 'Cycling (Outdoor)', 'Low-impact cardio on regular bicycle', 'Cardio', FALSE, NOW()),
(NULL, 'Elliptical', 'Low-impact full body cardio machine', 'Cardio', FALSE, NOW()),
(NULL, 'Rowing Machine', 'Full body cardio and strength exercise', 'Cardio', FALSE, NOW()),

-- CARDIO - High Intensity
(NULL, 'Sprint Intervals', 'High intensity running intervals', 'Cardio', FALSE, NOW()),
(NULL, 'Jump Rope', 'High intensity cardio using rope', 'Cardio', FALSE, NOW()),
(NULL, 'Burpees', 'Full body high intensity exercise', 'Cardio', FALSE, NOW()),
(NULL, 'Assault Bike', 'High intensity cardio on air resistance bike', 'Cardio', FALSE, NOW()),
(NULL, 'Stair Climber Intervals', 'High intensity intervals on stair machine', 'Cardio', FALSE, NOW())
ON CONFLICT (user_id, name, training_type) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Database initialization complete!' as status;
SELECT COUNT(*) as total_default_exercises FROM exercises WHERE is_custom = FALSE;
