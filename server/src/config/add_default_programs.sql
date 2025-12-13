-- Add default training programs to the database
-- These are system programs (user_id = NULL)
-- Available to all users as templates
-- Programs follow evidence-based training principles for hypertrophy and strength

-- =============================================================================
-- PROGRAM 1: CHEST DAY (STRENGTH FOCUS)
-- =============================================================================
-- Progressive chest-focused program emphasizing progressive overload
-- Compound movements first, followed by accessory work
-- Volume: 16 working sets (moderate-high for hypertrophy)

DO $$
DECLARE
  chest_program_id INTEGER;
  exercise_id INTEGER;
BEGIN
  -- Insert the program
  INSERT INTO training_programs (user_id, name, training_type, description, is_active, created_at)
  VALUES (
    NULL,
    'Chest Day - Strength Focus',
    'Strength',
    'A comprehensive chest-focused training session designed to build maximum pressing strength and pectoral muscle mass. This program prioritizes heavy compound movements first when neural drive is highest, followed by accessory exercises to accumulate volume. Targets upper, middle, and lower pectorals while engaging anterior deltoids and triceps.',
    TRUE,
    NOW()
  )
  RETURNING id INTO chest_program_id;

  -- Exercise 1: Bench Press (Flat) - Primary compound movement
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bench Press (Flat)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (chest_program_id, exercise_id, 'Bench Press (Flat)', 4, 6, 180, 1);

  -- Exercise 2: Bench Press (Incline) - Upper chest emphasis
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bench Press (Incline)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (chest_program_id, exercise_id, 'Bench Press (Incline)', 4, 8, 150, 2);

  -- Exercise 3: Dumbbell Chest Press - Unilateral stability, deeper ROM
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Dumbbell Chest Press' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (chest_program_id, exercise_id, 'Dumbbell Chest Press', 3, 10, 120, 3);

  -- Exercise 4: Dips - Lower chest and triceps
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Dips' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (chest_program_id, exercise_id, 'Dips', 3, 10, 120, 4);

  -- Exercise 5: Triceps Pushdown - Isolation finisher
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Triceps Pushdown' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (chest_program_id, exercise_id, 'Triceps Pushdown', 2, 15, 90, 5);

END $$;


-- =============================================================================
-- PROGRAM 2: BACK DAY (STRENGTH FOCUS)
-- =============================================================================
-- Comprehensive back development focusing on width and thickness
-- Balanced approach to vertical and horizontal pulling
-- Volume: 18 working sets for optimal hypertrophy stimulus

DO $$
DECLARE
  back_program_id INTEGER;
  exercise_id INTEGER;
BEGIN
  INSERT INTO training_programs (user_id, name, training_type, description, is_active, created_at)
  VALUES (
    NULL,
    'Back Day - Strength Focus',
    'Strength',
    'A complete back-building program targeting all regions of the posterior chain. Combines vertical pulling (lat width), horizontal pulling (thickness), and hip-hinge movements (lower back and hamstrings). This balanced approach develops v-taper aesthetics, postural strength, and pulling power essential for overall upper body development.',
    TRUE,
    NOW()
  )
  RETURNING id INTO back_program_id;

  -- Exercise 1: Conventional Deadlift - King of back exercises, full posterior chain
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Conventional Deadlift' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (back_program_id, exercise_id, 'Conventional Deadlift', 4, 5, 240, 1);

  -- Exercise 2: Pull-ups - Vertical pull for lat width
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Pull-ups' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (back_program_id, exercise_id, 'Pull-ups', 4, 8, 150, 2);

  -- Exercise 3: Bent-Over Row - Horizontal pull for thickness
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bent-Over Row' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (back_program_id, exercise_id, 'Bent-Over Row', 4, 8, 150, 3);

  -- Exercise 4: Lat Pulldown - Additional vertical pulling volume
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Lat Pulldown' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (back_program_id, exercise_id, 'Lat Pulldown', 3, 12, 120, 4);

  -- Exercise 5: Seated Row - Machine-based horizontal pull
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Seated Row' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (back_program_id, exercise_id, 'Seated Row', 3, 12, 120, 5);

END $$;


-- =============================================================================
-- PROGRAM 3: LEG DAY (STRENGTH FOCUS)
-- =============================================================================
-- Lower body hypertrophy and strength program
-- Quad-dominant, hip-dominant, and isolation exercises
-- Volume: 17 working sets targeting all major leg muscle groups

DO $$
DECLARE
  leg_program_id INTEGER;
  exercise_id INTEGER;
BEGIN
  INSERT INTO training_programs (user_id, name, training_type, description, is_active, created_at)
  VALUES (
    NULL,
    'Leg Day - Strength Focus',
    'Strength',
    'A comprehensive lower body program that builds powerful, balanced legs through a combination of quad-dominant squatting, hip-dominant hinging, and targeted isolation work. This session develops strength, muscle mass, and athletic performance through progressive loading of multi-joint movements and strategic isolation to address individual muscle groups.',
    TRUE,
    NOW()
  )
  RETURNING id INTO leg_program_id;

  -- Exercise 1: Back Squat - King of leg exercises, quad-dominant
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Back Squat' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (leg_program_id, exercise_id, 'Back Squat', 4, 6, 240, 1);

  -- Exercise 2: Romanian Deadlift - Hip-dominant, hamstring and glute focus
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Romanian Deadlift' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (leg_program_id, exercise_id, 'Romanian Deadlift', 4, 8, 180, 2);

  -- Exercise 3: Leg Press - Additional quad volume, reduced spinal loading
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Leg Press' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (leg_program_id, exercise_id, 'Leg Press', 3, 10, 150, 3);

  -- Exercise 4: Lunges (Dumbbell) - Unilateral leg development, balance
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Lunges (Dumbbell)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (leg_program_id, exercise_id, 'Lunges (Dumbbell)', 3, 12, 120, 4);

  -- Exercise 5: Leg Extension - Quad isolation
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Leg Extension' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (leg_program_id, exercise_id, 'Leg Extension', 2, 15, 90, 5);

  -- Exercise 6: Hamstring Curl - Hamstring isolation
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Hamstring Curl' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (leg_program_id, exercise_id, 'Hamstring Curl', 2, 15, 90, 6);

END $$;


-- =============================================================================
-- PROGRAM 4: PUSH DAY (PPL SPLIT)
-- =============================================================================
-- Push day targeting chest, shoulders, and triceps
-- Part of Push/Pull/Legs training split
-- Volume: 19 working sets across all pushing muscles

DO $$
DECLARE
  push_program_id INTEGER;
  exercise_id INTEGER;
BEGIN
  INSERT INTO training_programs (user_id, name, training_type, description, is_active, created_at)
  VALUES (
    NULL,
    'Push Day - PPL Split',
    'Strength',
    'A comprehensive pushing workout targeting all pressing muscles: chest, shoulders, and triceps. This session is designed as part of a Push/Pull/Legs split, allowing optimal frequency and recovery. Exercise order follows the principle of training larger muscle groups first, progressing from heavy compounds to isolation movements for maximum hypertrophy stimulus.',
    TRUE,
    NOW()
  )
  RETURNING id INTO push_program_id;

  -- Exercise 1: Bench Press (Flat) - Primary chest compound
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bench Press (Flat)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (push_program_id, exercise_id, 'Bench Press (Flat)', 4, 6, 180, 1);

  -- Exercise 2: Overhead Press - Primary shoulder compound
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Overhead Press' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (push_program_id, exercise_id, 'Overhead Press', 4, 8, 150, 2);

  -- Exercise 3: Bench Press (Incline) - Upper chest emphasis
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bench Press (Incline)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (push_program_id, exercise_id, 'Bench Press (Incline)', 3, 10, 120, 3);

  -- Exercise 4: Dumbbell Shoulder Press - Shoulder volume and stability
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Dumbbell Shoulder Press' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (push_program_id, exercise_id, 'Dumbbell Shoulder Press', 3, 10, 120, 4);

  -- Exercise 5: Dips - Chest/triceps compound
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Dips' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (push_program_id, exercise_id, 'Dips', 3, 10, 120, 5);

  -- Exercise 6: Overhead Triceps Extension - Long head emphasis
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Overhead Triceps Extension' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (push_program_id, exercise_id, 'Overhead Triceps Extension', 2, 12, 90, 6);

END $$;


-- =============================================================================
-- PROGRAM 5: PULL DAY (PPL SPLIT)
-- =============================================================================
-- Pull day targeting back, rear delts, and biceps
-- Part of Push/Pull/Legs training split
-- Volume: 19 working sets for complete posterior development

DO $$
DECLARE
  pull_program_id INTEGER;
  exercise_id INTEGER;
BEGIN
  INSERT INTO training_programs (user_id, name, training_type, description, is_active, created_at)
  VALUES (
    NULL,
    'Pull Day - PPL Split',
    'Strength',
    'A complete pulling workout hitting all aspects of back development plus biceps. Designed as part of a Push/Pull/Legs split for optimal training frequency. This session balances vertical pulling (lat width), horizontal pulling (back thickness), and arm flexion work. The combination builds a strong, wide back while developing powerful biceps and grip strength.',
    TRUE,
    NOW()
  )
  RETURNING id INTO pull_program_id;

  -- Exercise 1: Conventional Deadlift - Foundation posterior chain movement
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Conventional Deadlift' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (pull_program_id, exercise_id, 'Conventional Deadlift', 3, 5, 240, 1);

  -- Exercise 2: Pull-ups - Vertical pull, lat width
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Pull-ups' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (pull_program_id, exercise_id, 'Pull-ups', 4, 8, 150, 2);

  -- Exercise 3: Bent-Over Row - Horizontal pull, thickness
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bent-Over Row' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (pull_program_id, exercise_id, 'Bent-Over Row', 4, 8, 150, 3);

  -- Exercise 4: Lat Pulldown - Additional vertical volume
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Lat Pulldown' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (pull_program_id, exercise_id, 'Lat Pulldown', 3, 12, 120, 4);

  -- Exercise 5: Seated Row - Additional horizontal volume
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Seated Row' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (pull_program_id, exercise_id, 'Seated Row', 3, 12, 120, 5);

  -- Exercise 6: Biceps Curls (Barbell) - Primary biceps mass builder
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Biceps Curls (Barbell)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (pull_program_id, exercise_id, 'Biceps Curls (Barbell)', 2, 12, 90, 6);

END $$;


-- =============================================================================
-- PROGRAM 6: FULL BODY CALISTHENICS
-- =============================================================================
-- Bodyweight-only full body workout
-- Functional strength and muscle endurance
-- Volume: 19 sets total, no equipment required

DO $$
DECLARE
  calisthenics_program_id INTEGER;
  exercise_id INTEGER;
BEGIN
  INSERT INTO training_programs (user_id, name, training_type, description, is_active, created_at)
  VALUES (
    NULL,
    'Full Body Calisthenics',
    'Calisthenics',
    'A complete bodyweight training program requiring zero equipment. This workout builds functional strength, muscular endurance, and body control through fundamental movement patterns. Ideal for home training, travel, or as a deload from heavy weights. The session targets all major muscle groups while improving relative strength and movement quality.',
    TRUE,
    NOW()
  )
  RETURNING id INTO calisthenics_program_id;

  -- Exercise 1: Pull-ups - Primary vertical pull
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Pull-ups' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (calisthenics_program_id, exercise_id, 'Pull-ups', 4, 8, 120, 1);

  -- Exercise 2: Push-ups (Standard) - Primary horizontal push
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Push-ups (Standard)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (calisthenics_program_id, exercise_id, 'Push-ups (Standard)', 4, 15, 90, 2);

  -- Exercise 3: Bulgarian Split Squats - Unilateral leg strength
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bulgarian Split Squats' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (calisthenics_program_id, exercise_id, 'Bulgarian Split Squats', 3, 12, 90, 3);

  -- Exercise 4: Pike Push-ups - Shoulder emphasis
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Pike Push-ups' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (calisthenics_program_id, exercise_id, 'Pike Push-ups', 3, 12, 90, 4);

  -- Exercise 5: Bodyweight Rows - Horizontal pull
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bodyweight Rows (Australian Rows)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (calisthenics_program_id, exercise_id, 'Bodyweight Rows (Australian Rows)', 3, 15, 90, 5);

  -- Exercise 6: Dips - Triceps and lower chest
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Dips' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (calisthenics_program_id, exercise_id, 'Dips', 2, 12, 90, 6);

  -- Exercise 7: Hip Thrusts - Glute activation
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Hip Thrusts' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (calisthenics_program_id, exercise_id, 'Hip Thrusts', 3, 20, 60, 7);

END $$;


-- =============================================================================
-- PROGRAM 7: CORE & CARDIO HIIT
-- =============================================================================
-- High-intensity interval training with core focus
-- Cardiovascular conditioning and core strength
-- Volume: Timed intervals with active recovery

DO $$
DECLARE
  hiit_program_id INTEGER;
  exercise_id INTEGER;
BEGIN
  INSERT INTO training_programs (user_id, name, training_type, description, is_active, created_at)
  VALUES (
    NULL,
    'Core & Cardio HIIT',
    'Cardio',
    'A high-intensity interval training session combining explosive cardio movements with core-strengthening exercises. This metabolically demanding workout improves cardiovascular capacity, burns calories, and builds core stability and endurance. The alternating work-rest structure maximizes caloric expenditure while developing power and muscular endurance.',
    TRUE,
    NOW()
  )
  RETURNING id INTO hiit_program_id;

  -- Exercise 1: Jump Rope - Cardio warm-up and coordination
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Jump Rope' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (hiit_program_id, exercise_id, 'Jump Rope', 3, 60, 30, 1);

  -- Exercise 2: Burpees - Full body cardio power
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Burpees' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (hiit_program_id, exercise_id, 'Burpees', 4, 15, 45, 2);

  -- Exercise 3: Mountain Climbers - Core and cardio
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Mountain Climbers' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (hiit_program_id, exercise_id, 'Mountain Climbers', 4, 30, 30, 3);

  -- Exercise 4: Plank - Core isometric hold
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Plank' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (hiit_program_id, exercise_id, 'Plank', 3, 45, 30, 4);

  -- Exercise 5: V-Ups - Core dynamic movement
  SELECT id INTO exercise_id FROM exercises WHERE name = 'V-Ups' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (hiit_program_id, exercise_id, 'V-Ups', 3, 15, 30, 5);

  -- Exercise 6: Sprint Intervals - Maximum cardio output
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Sprint Intervals' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (hiit_program_id, exercise_id, 'Sprint Intervals', 5, 30, 90, 6);

END $$;


-- =============================================================================
-- PROGRAM 8: UPPER BODY CALISTHENICS
-- =============================================================================
-- Advanced upper body bodyweight training
-- Progressive push/pull development
-- Volume: 20 sets focusing on upper body strength and hypertrophy

DO $$
DECLARE
  upper_calisthenics_program_id INTEGER;
  exercise_id INTEGER;
BEGIN
  INSERT INTO training_programs (user_id, name, training_type, description, is_active, created_at)
  VALUES (
    NULL,
    'Upper Body Calisthenics',
    'Calisthenics',
    'An advanced bodyweight upper body program that builds impressive pushing and pulling strength using progressive variations. This session systematically develops chest, back, shoulders, and arms through strategic exercise selection and rep ranges. Perfect for building functional strength and muscle mass without weights, emphasizing movement quality and time under tension.',
    TRUE,
    NOW()
  )
  RETURNING id INTO upper_calisthenics_program_id;

  -- Exercise 1: Pull-ups - Primary vertical pull
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Pull-ups' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (upper_calisthenics_program_id, exercise_id, 'Pull-ups', 4, 8, 120, 1);

  -- Exercise 2: Push-ups (Decline) - Harder push variation, upper chest
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Push-ups (Decline)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (upper_calisthenics_program_id, exercise_id, 'Push-ups (Decline)', 4, 12, 90, 2);

  -- Exercise 3: Chin-ups - Biceps emphasis
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Chin-ups' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (upper_calisthenics_program_id, exercise_id, 'Chin-ups', 3, 10, 120, 3);

  -- Exercise 4: Dips - Lower chest and triceps
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Dips' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (upper_calisthenics_program_id, exercise_id, 'Dips', 4, 10, 120, 4);

  -- Exercise 5: Pike Push-ups - Shoulder development
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Pike Push-ups' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (upper_calisthenics_program_id, exercise_id, 'Pike Push-ups', 3, 12, 90, 5);

  -- Exercise 6: Bodyweight Rows - Horizontal pull
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Bodyweight Rows (Australian Rows)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (upper_calisthenics_program_id, exercise_id, 'Bodyweight Rows (Australian Rows)', 3, 15, 90, 6);

  -- Exercise 7: Push-ups (Standard) - Volume finisher
  SELECT id INTO exercise_id FROM exercises WHERE name = 'Push-ups (Standard)' AND is_custom = FALSE LIMIT 1;
  INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, rest_time, order_index)
  VALUES (upper_calisthenics_program_id, exercise_id, 'Push-ups (Standard)', 2, 20, 60, 7);

END $$;
