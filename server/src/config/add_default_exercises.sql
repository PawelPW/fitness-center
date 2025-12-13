-- Add default exercises to the database
-- These are system exercises (user_id = NULL, is_custom = FALSE)
-- Available to all users as templates

-- STRENGTH TRAINING - Upper Body
INSERT INTO exercises (user_id, name, training_type, is_custom, created_at) VALUES
(NULL, 'Bench Press (Flat)', 'Strength', FALSE, NOW()),
(NULL, 'Bench Press (Incline)', 'Strength', FALSE, NOW()),
(NULL, 'Overhead Press', 'Strength', FALSE, NOW()),
(NULL, 'Lat Pulldown', 'Strength', FALSE, NOW()),
(NULL, 'Seated Row', 'Strength', FALSE, NOW()),
(NULL, 'Bent-Over Row', 'Strength', FALSE, NOW()),
(NULL, 'Dumbbell Chest Press', 'Strength', FALSE, NOW()),
(NULL, 'Dumbbell Shoulder Press', 'Strength', FALSE, NOW()),
(NULL, 'Biceps Curls (Dumbbell)', 'Strength', FALSE, NOW()),
(NULL, 'Biceps Curls (Barbell)', 'Strength', FALSE, NOW()),
(NULL, 'Triceps Pushdown', 'Strength', FALSE, NOW()),
(NULL, 'Overhead Triceps Extension', 'Strength', FALSE, NOW()),

-- STRENGTH TRAINING - Lower Body
(NULL, 'Back Squat', 'Strength', FALSE, NOW()),
(NULL, 'Leg Press', 'Strength', FALSE, NOW()),
(NULL, 'Romanian Deadlift', 'Strength', FALSE, NOW()),
(NULL, 'Conventional Deadlift', 'Strength', FALSE, NOW()),
(NULL, 'Lunges (Dumbbell)', 'Strength', FALSE, NOW()),
(NULL, 'Lunges (Barbell)', 'Strength', FALSE, NOW()),
(NULL, 'Leg Extension', 'Strength', FALSE, NOW()),
(NULL, 'Hamstring Curl', 'Strength', FALSE, NOW()),

-- STRENGTH TRAINING - Core
(NULL, 'Cable Woodchoppers', 'Strength', FALSE, NOW()),
(NULL, 'Cable Crunch', 'Strength', FALSE, NOW()),
(NULL, 'Weighted Planks', 'Strength', FALSE, NOW()),

-- CALISTHENICS - Upper Body
(NULL, 'Push-ups (Standard)', 'Calisthenics', FALSE, NOW()),
(NULL, 'Push-ups (Incline)', 'Calisthenics', FALSE, NOW()),
(NULL, 'Push-ups (Decline)', 'Calisthenics', FALSE, NOW()),
(NULL, 'Dips', 'Calisthenics', FALSE, NOW()),
(NULL, 'Pull-ups', 'Calisthenics', FALSE, NOW()),
(NULL, 'Chin-ups', 'Calisthenics', FALSE, NOW()),
(NULL, 'Bodyweight Rows (Australian Rows)', 'Calisthenics', FALSE, NOW()),
(NULL, 'Pike Push-ups', 'Calisthenics', FALSE, NOW()),

-- CALISTHENICS - Lower Body
(NULL, 'Bodyweight Squats', 'Calisthenics', FALSE, NOW()),
(NULL, 'Split Squats', 'Calisthenics', FALSE, NOW()),
(NULL, 'Bulgarian Split Squats', 'Calisthenics', FALSE, NOW()),
(NULL, 'Glute Bridges', 'Calisthenics', FALSE, NOW()),
(NULL, 'Hip Thrusts', 'Calisthenics', FALSE, NOW()),

-- CALISTHENICS - Core
(NULL, 'Plank', 'Calisthenics', FALSE, NOW()),
(NULL, 'Side Plank', 'Calisthenics', FALSE, NOW()),
(NULL, 'Hanging Leg Raises', 'Calisthenics', FALSE, NOW()),
(NULL, 'V-Ups', 'Calisthenics', FALSE, NOW()),
(NULL, 'Mountain Climbers', 'Calisthenics', FALSE, NOW()),

-- CARDIO - Low/Moderate Intensity
(NULL, 'Treadmill Walking', 'Cardio', FALSE, NOW()),
(NULL, 'Treadmill Incline Walking', 'Cardio', FALSE, NOW()),
(NULL, 'Light Jogging', 'Cardio', FALSE, NOW()),
(NULL, 'Cycling (Stationary)', 'Cardio', FALSE, NOW()),
(NULL, 'Cycling (Outdoor)', 'Cardio', FALSE, NOW()),
(NULL, 'Elliptical', 'Cardio', FALSE, NOW()),
(NULL, 'Rowing Machine', 'Cardio', FALSE, NOW()),

-- CARDIO - High Intensity
(NULL, 'Sprint Intervals', 'Cardio', FALSE, NOW()),
(NULL, 'Jump Rope', 'Cardio', FALSE, NOW()),
(NULL, 'Burpees', 'Cardio', FALSE, NOW()),
(NULL, 'Assault Bike', 'Cardio', FALSE, NOW()),
(NULL, 'Stair Climber Intervals', 'Cardio', FALSE, NOW())
ON CONFLICT (user_id, name, training_type) DO NOTHING;
