import apiService from '../services/api.js';

// Get all exercises (already grouped by type from API)
export const getAllExercises = async () => {
  try {
    return await apiService.getAllExercises();
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    return {};
  }
};

// Get exercises by type
export const getExercisesByType = async (type) => {
  try {
    return await apiService.getExercisesByType(type);
  } catch (error) {
    console.error('Failed to fetch exercises by type:', error);
    return [];
  }
};

// Add custom exercise
export const addCustomExercise = async (type, name) => {
  try {
    return await apiService.createExercise(name, type);
  } catch (error) {
    throw new Error(error.message || 'Failed to create exercise');
  }
};

// Delete custom exercise
export const deleteCustomExercise = async (type, exerciseId) => {
  try {
    await apiService.deleteExercise(exerciseId);
    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete exercise');
  }
};

// Get exercise count by type (calculated from API data)
export const getExerciseCount = async (type) => {
  try {
    const exercises = await getExercisesByType(type);
    return {
      total: exercises.length,
      custom: exercises.filter(ex => ex.isCustom).length,
      default: exercises.filter(ex => !ex.isCustom).length,
    };
  } catch (error) {
    return { total: 0, custom: 0, default: 0 };
  }
};

// Initialize - no longer needed with API, but kept for compatibility
export const initializeExerciseDatabase = async () => {
  return await getAllExercises();
};
