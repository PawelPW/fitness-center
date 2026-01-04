import secureStorage from '../utils/secureStorage.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'auth-token';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    this._tokenLoaded = false;
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await secureStorage.set(TOKEN_KEY, token);
    } else {
      await secureStorage.remove(TOKEN_KEY);
    }
  }

  async getToken() {
    // Lazy load token from secure storage if not already loaded
    if (!this._tokenLoaded) {
      this.token = await secureStorage.get(TOKEN_KEY);
      this._tokenLoaded = true;
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = await this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const config = {
      ...options,
      headers,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        // If validation errors exist, include them in the error message
        if (data.errors && Array.isArray(data.errors)) {
          const error = new Error(JSON.stringify(data));
          throw error;
        }
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout errors
      if (error.name === 'AbortError') {
        throw new Error(JSON.stringify({
          error: 'Request timeout. Please check your connection.',
          code: 'TIMEOUT'
        }));
      }

      // Handle offline/network errors
      if (!navigator.onLine) {
        throw new Error(JSON.stringify({
          error: 'No internet connection. Please check your network.',
          code: 'OFFLINE'
        }));
      }

      // Handle generic network errors
      if (error.message === 'Failed to fetch' || error instanceof TypeError) {
        throw new Error(JSON.stringify({
          error: 'Network error. Please check your connection and try again.',
          code: 'NETWORK_ERROR'
        }));
      }

      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(username, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    await this.setToken(data.token);
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    await this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.setToken(null);
    this._tokenLoaded = false;
  }

  // User profile endpoints
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Exercise endpoints
  async getAllExercises() {
    return this.request('/exercises');
  }

  async getExercisesByType(type) {
    return this.request(`/exercises/type/${type}`);
  }

  async createExercise(exerciseData) {
    return this.request('/exercises', {
      method: 'POST',
      body: JSON.stringify(exerciseData),
    });
  }

  async updateExercise(id, exerciseData) {
    return this.request(`/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exerciseData),
    });
  }

  async deleteExercise(id) {
    return this.request(`/exercises/${id}`, {
      method: 'DELETE',
    });
  }

  // Training program endpoints
  async getAllTrainingPrograms() {
    return this.request('/trainings');
  }

  async getTrainingProgramById(id) {
    return this.request(`/trainings/${id}`);
  }

  async createTrainingProgram(programData) {
    return this.request('/trainings', {
      method: 'POST',
      body: JSON.stringify(programData),
    });
  }

  async updateTrainingProgram(id, programData) {
    return this.request(`/trainings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(programData),
    });
  }

  async deleteTrainingProgram(id) {
    return this.request(`/trainings/${id}`, {
      method: 'DELETE',
    });
  }

  // Training session endpoints
  async getAllSessions(options = {}) {
    // BE-1: Support query params for filtering planned/completed sessions
    const queryParams = new URLSearchParams();

    if (options.completed !== undefined) {
      queryParams.append('completed', options.completed);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/sessions?${queryString}` : '/sessions';

    return this.request(endpoint);
  }

  async getSessionStats(period = 'week') {
    return this.request(`/sessions/stats?period=${period}`);
  }

  async getSessionById(id) {
    return this.request(`/sessions/${id}`);
  }

  async createSession(sessionData) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  /**
   * Create a planned workout session
   * FE-5: Enhanced with JSDoc types and error handling documentation
   *
   * @param {Object} sessionData - Session data
   * @param {string} sessionData.type - Training type (Cardio, Strength, Calisthenics, Boxing, Swimming)
   * @param {string} sessionData.date - Session date in ISO 8601 format (YYYY-MM-DD)
   * @param {string} [sessionData.scheduled_time] - Optional scheduled time (HH:MM)
   * @param {string} [sessionData.notes] - Optional notes
   *
   * @returns {Promise<Object>} Created session object
   * @returns {string} return.id - Session ID
   * @returns {string} return.type - Training type
   * @returns {string} return.date - Session date
   * @returns {string|null} return.scheduled_time - Scheduled time or null
   * @returns {number|null} return.duration - Duration (null for planned)
   * @returns {number|null} return.calories - Calories (null for planned)
   * @returns {string|null} return.notes - Session notes
   * @returns {boolean} return.completed - Always false for planned sessions
   * @returns {Array} return.exercises - Empty array for planned sessions
   * @returns {number} return.exerciseCount - Always 0 for planned sessions
   *
   * @throws {Error} Validation errors (400)
   * @throws {Error} Missing required fields: type or date
   * @throws {Error} Invalid date format (must be YYYY-MM-DD)
   * @throws {Error} Invalid training type
   * @throws {Error} Date cannot be more than 1 day in the past
   * @throws {Error} Unauthorized (401) - Missing or invalid token
   * @throws {Error} Server error (500)
   *
   * @example
   * // Create a planned session for tomorrow
   * const session = await apiService.createPlannedSession({
   *   type: 'Strength',
   *   date: '2026-01-15',
   *   scheduled_time: '07:00',
   *   notes: 'Focus on compound movements'
   * });
   * console.log(session.id); // "123"
   *
   * @example
   * // Handle validation errors
   * try {
   *   await apiService.createPlannedSession({
   *     type: 'InvalidType',
   *     date: '2025-12-01' // Too far in past
   *   });
   * } catch (error) {
   *   console.error(error.message); // "Invalid training type" or "Date cannot be more than 1 day in the past"
   * }
   */
  async createPlannedSession(sessionData) {
    return this.request('/sessions/planned', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  /**
   * Update an existing planned workout session
   * FE-5: Enhanced with JSDoc types and error handling documentation
   *
   * @param {string|number} id - Session ID to update
   * @param {Object} sessionData - Updated session data (partial update supported)
   * @param {string} [sessionData.type] - Training type (Cardio, Strength, Calisthenics, Boxing, Swimming)
   * @param {string} [sessionData.date] - Session date in ISO 8601 format (YYYY-MM-DD)
   * @param {string} [sessionData.scheduled_time] - Scheduled time (HH:MM)
   * @param {string} [sessionData.notes] - Session notes
   *
   * @returns {Promise<Object>} Updated session object
   * @returns {string} return.id - Session ID
   * @returns {string} return.type - Training type
   * @returns {string} return.date - Session date
   * @returns {string|null} return.scheduled_time - Scheduled time or null
   * @returns {number|null} return.duration - Duration (null for planned)
   * @returns {number|null} return.calories - Calories (null for planned)
   * @returns {string|null} return.notes - Session notes
   * @returns {boolean} return.completed - Always false for planned sessions
   * @returns {Array} return.exercises - Empty array for planned sessions
   * @returns {number} return.exerciseCount - Always 0 for planned sessions
   *
   * @throws {Error} Validation errors (400)
   * @throws {Error} Cannot update completed session
   * @throws {Error} Invalid date format (must be YYYY-MM-DD)
   * @throws {Error} Invalid training type
   * @throws {Error} Date cannot be more than 1 day in the past
   * @throws {Error} No fields to update
   * @throws {Error} Session not found (404)
   * @throws {Error} Unauthorized (401)
   * @throws {Error} Server error (500)
   *
   * @example
   * // Update session date
   * const updated = await apiService.updatePlannedSession('123', {
   *   date: '2026-01-20'
   * });
   *
   * @example
   * // Update multiple fields
   * const updated = await apiService.updatePlannedSession('123', {
   *   type: 'Cardio',
   *   date: '2026-01-20',
   *   scheduled_time: '08:00',
   *   notes: 'Morning run - 5km'
   * });
   */
  async updatePlannedSession(id, sessionData) {
    return this.request(`/sessions/planned/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });
  }

  /**
   * Delete a planned workout session
   * FE-5: Enhanced with JSDoc types and error handling documentation
   *
   * @param {string|number} id - Session ID to delete
   *
   * @returns {Promise<Object>} Deletion confirmation
   * @returns {string} return.message - Success message
   * @returns {string} return.id - Deleted session ID
   *
   * @throws {Error} Validation errors (400)
   * @throws {Error} Cannot delete completed session
   * @throws {Error} Session not found (404)
   * @throws {Error} Unauthorized (401)
   * @throws {Error} Server error (500)
   *
   * @example
   * // Delete a planned session
   * const result = await apiService.deletePlannedSession('123');
   * console.log(result.message); // "Planned session deleted successfully"
   *
   * @example
   * // Handle errors
   * try {
   *   await apiService.deletePlannedSession('999');
   * } catch (error) {
   *   if (error.message.includes('not found')) {
   *     console.error('Session does not exist');
   *   }
   * }
   */
  async deletePlannedSession(id) {
    return this.request(`/sessions/planned/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get upcoming planned workout sessions
   * FE-5: Enhanced with JSDoc types and error handling documentation
   *
   * @param {number} [days=7] - Number of days to look ahead (1-365)
   *
   * @returns {Promise<Object>} Upcoming sessions response
   * @returns {Array<Object>} return.sessions - Array of planned sessions
   * @returns {string} return.sessions[].id - Session ID
   * @returns {string} return.sessions[].type - Training type
   * @returns {string} return.sessions[].date - Session date (YYYY-MM-DD)
   * @returns {string|null} return.sessions[].scheduled_time - Scheduled time or null
   * @returns {string|null} return.sessions[].notes - Session notes
   * @returns {boolean} return.sessions[].completed - Always false
   * @returns {Array} return.sessions[].exercises - Empty array for planned
   * @returns {number} return.sessions[].exerciseCount - Always 0 for planned
   * @returns {number} return.count - Total number of upcoming sessions
   * @returns {number} return.days - Number of days looked ahead
   *
   * @throws {Error} Validation errors (400)
   * @throws {Error} Invalid days parameter (must be 1-365)
   * @throws {Error} Unauthorized (401)
   * @throws {Error} Server error (500)
   *
   * @example
   * // Get next 7 days of planned sessions
   * const { sessions, count } = await apiService.getUpcomingPlannedSessions();
   * console.log(`${count} sessions planned in the next 7 days`);
   *
   * @example
   * // Get next 30 days
   * const { sessions } = await apiService.getUpcomingPlannedSessions(30);
   * sessions.forEach(s => {
   *   console.log(`${s.type} on ${s.date}`);
   * });
   */
  async getUpcomingPlannedSessions(days = 7) {
    return this.request(`/sessions/upcoming?days=${days}`);
  }

  /**
   * Bulk create multiple planned workout sessions (atomic transaction)
   * FE-5: Enhanced with JSDoc types and error handling documentation
   *
   * @param {Array<Object>} sessions - Array of session objects to create (max 100)
   * @param {string} sessions[].type - Training type (Cardio, Strength, Calisthenics, Boxing, Swimming)
   * @param {string} sessions[].date - Session date in ISO 8601 format (YYYY-MM-DD)
   * @param {string} [sessions[].scheduled_time] - Optional scheduled time (HH:MM)
   * @param {string} [sessions[].notes] - Optional notes
   *
   * @returns {Promise<Object>} Bulk creation response
   * @returns {Array<Object>} return.sessions - Array of created sessions
   * @returns {string} return.sessions[].id - Session ID
   * @returns {string} return.sessions[].type - Training type
   * @returns {string} return.sessions[].date - Session date
   * @returns {string|null} return.sessions[].scheduled_time - Scheduled time or null
   * @returns {string|null} return.sessions[].notes - Session notes
   * @returns {boolean} return.sessions[].completed - Always false
   * @returns {Array} return.sessions[].exercises - Empty array
   * @returns {number} return.sessions[].exerciseCount - Always 0
   * @returns {number} return.count - Number of sessions created
   * @returns {string} return.message - Success message
   *
   * @throws {Error} Validation errors (400)
   * @throws {Error} Sessions must be an array
   * @throws {Error} Sessions array cannot be empty
   * @throws {Error} Maximum 100 sessions can be created at once
   * @throws {Error} Session N: Missing required fields (type, date)
   * @throws {Error} Session N: Invalid date format
   * @throws {Error} Session N: Invalid training type
   * @throws {Error} Session N: Date cannot be more than 1 day in the past
   * @throws {Error} Unauthorized (401)
   * @throws {Error} Server error (500)
   *
   * @example
   * // Create a week of planned sessions
   * const sessions = [
   *   { type: 'Strength', date: '2026-01-13', notes: 'Upper body' },
   *   { type: 'Cardio', date: '2026-01-14', notes: 'Running' },
   *   { type: 'Strength', date: '2026-01-15', notes: 'Lower body' },
   *   { type: 'Boxing', date: '2026-01-16', notes: 'Sparring' },
   *   { type: 'Cardio', date: '2026-01-17', notes: 'Cycling' }
   * ];
   *
   * const result = await apiService.bulkCreatePlannedSessions(sessions);
   * console.log(result.message); // "Successfully created 5 planned sessions"
   *
   * @example
   * // Handle validation error (all-or-nothing transaction)
   * try {
   *   await apiService.bulkCreatePlannedSessions([
   *     { type: 'Strength', date: '2026-01-13' },
   *     { type: 'InvalidType', date: '2026-01-14' }, // Error here
   *     { type: 'Cardio', date: '2026-01-15' }
   *   ]);
   * } catch (error) {
   *   console.error(error.message); // "Session 2: Invalid training type"
   *   // No sessions were created (transaction rolled back)
   * }
   */
  async bulkCreatePlannedSessions(sessions) {
    return this.request('/sessions/planned/bulk', {
      method: 'POST',
      body: JSON.stringify({ sessions }),
    });
  }

  async updateSession(id, sessionData) {
    return this.request(`/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(sessionData),
    });
  }

  async deleteSession(id) {
    return this.request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async createSessionExercise(sessionId, exerciseData) {
    return this.request(`/sessions/${sessionId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(exerciseData),
    });
  }

  // Statistics endpoints
  async getAllExerciseStats() {
    return this.request('/stats/exercises');
  }

  async getExerciseHistory(exerciseName, limit = 50) {
    return this.request(`/stats/exercises/${encodeURIComponent(exerciseName)}/history?limit=${limit}`);
  }

  async getExercisePRs(exerciseName) {
    return this.request(`/stats/exercises/${encodeURIComponent(exerciseName)}/prs`);
  }

  async getVolumeStats(exerciseName, period = 'month', groupBy = 'week') {
    return this.request(`/stats/exercises/${encodeURIComponent(exerciseName)}/volume?period=${period}&groupBy=${groupBy}`);
  }
}

const apiService = new ApiService();
export default apiService;
