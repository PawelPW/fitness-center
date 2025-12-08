-- Add default exercises to the database
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
(NULL, 'Stair Climber Intervals', 'High intensity intervals on stair machine', 'Cardio', FALSE, NOW());
