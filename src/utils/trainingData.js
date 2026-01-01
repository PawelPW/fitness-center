import apiService from '../services/api.js';

// Training session types
export const TRAINING_TYPES = {
  CARDIO: 'Cardio',
  STRENGTH: 'Strength',
  CALISTHENICS: 'Calisthenics',
  BOXING: 'Boxing',
  SWIMMING: 'Swimming',
};

// Get all training sessions
export const initializeTrainingData = async () => {
  try {
    return await apiService.getAllSessions();
  } catch (error) {
    console.error('Failed to fetch training sessions:', error);
    return [];
  }
};

// Get sessions for a specific time period
export const getSessionsInPeriod = (sessions, period = 'week') => {
  const now = new Date();
  const filtered = sessions.filter(session => {
    const sessionDate = new Date(session.date);

    if (period === 'week') {
      // Use calendar week (Monday-Sunday) - ISO 8601
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, others to days from Monday
      startOfWeek.setDate(now.getDate() - daysFromMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      return sessionDate >= startOfWeek && sessionDate <= now && session.completed;
    }

    if (period === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return sessionDate >= monthAgo && sessionDate <= now && session.completed;
    }

    if (period === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return sessionDate >= yearAgo && sessionDate <= now && session.completed;
    }

    return false;
  });

  return filtered;
};

// Get the last completed training session
export const getLastSession = (sessions) => {
  const completed = sessions
    .filter(s => s.completed)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return completed[0] || null;
};

// Get the next upcoming training session
export const getNextSession = (sessions) => {
  const now = new Date();
  const upcoming = sessions
    .filter(s => !s.completed && new Date(s.date) > now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return upcoming[0] || null;
};

// Get session by ID
export const getSessionById = (sessions, id) => {
  return sessions.find(s => s.id === id) || null;
};

// Create new training session
export const createTrainingSession = async (sessionData) => {
  try {
    return await apiService.createSession(sessionData);
  } catch (error) {
    throw new Error(error.message || 'Failed to create training session');
  }
};

// Delete training session
export const deleteTrainingSession = async (id) => {
  try {
    await apiService.deleteSession(id);
    return true;
  } catch (error) {
    throw new Error(error.message || 'Failed to delete training session');
  }
};

// Save training data - no longer needed with API
export const saveTrainingData = async (sessions) => {
  console.log('saveTrainingData is deprecated with API backend');
  return sessions;
};
