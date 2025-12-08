import apiService from '../services/api.js';
import { TRAINING_TYPES } from './trainingData';

// Get all training programs
export const getAllTrainingPrograms = async () => {
  try {
    return await apiService.getAllTrainingPrograms();
  } catch (error) {
    console.error('Failed to fetch training programs:', error);
    return [];
  }
};

// Get training program by ID
export const getTrainingProgramById = async (id) => {
  try {
    return await apiService.getTrainingProgramById(id);
  } catch (error) {
    console.error('Failed to fetch training program:', error);
    return null;
  }
};

// Get training programs by type
export const getTrainingProgramsByType = async (type) => {
  try {
    const programs = await getAllTrainingPrograms();
    return programs.filter(p => p.type === type);
  } catch (error) {
    return [];
  }
};

// Create new training program
export const createTrainingProgram = async (programData) => {
  try {
    return await apiService.createTrainingProgram(programData);
  } catch (error) {
    throw new Error(error.message || 'Failed to create training program');
  }
};

// Update training program
export const updateTrainingProgram = async (id, updates) => {
  try {
    return await apiService.updateTrainingProgram(id, updates);
  } catch (error) {
    throw new Error(error.message || 'Failed to update training program');
  }
};

// Delete training program
export const deleteTrainingProgram = async (id) => {
  try {
    await apiService.deleteTrainingProgram(id);
    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete training program');
  }
};

// Duplicate training program
export const duplicateTrainingProgram = async (id) => {
  try {
    const original = await getTrainingProgramById(id);
    if (!original) {
      throw new Error('Training program not found');
    }

    const duplicate = {
      name: `${original.name} (Copy)`,
      type: original.type,
      description: original.description,
      exercises: original.exercises,
    };

    return await createTrainingProgram(duplicate);
  } catch (error) {
    throw new Error(error.message || 'Failed to duplicate training program');
  }
};

// Get program statistics
export const getProgramStatistics = async () => {
  try {
    const programs = await getAllTrainingPrograms();

    return {
      total: programs.length,
      byType: Object.values(TRAINING_TYPES).reduce((acc, type) => {
        acc[type] = programs.filter(p => p.type === type).length;
        return acc;
      }, {}),
      totalExercises: programs.reduce((sum, p) => sum + (p.exercises?.length || 0), 0),
    };
  } catch (error) {
    return { total: 0, byType: {}, totalExercises: 0 };
  }
};

// Initialize - kept for compatibility
export const initializeTrainingDatabase = async () => {
  return await getAllTrainingPrograms();
};
