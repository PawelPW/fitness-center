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

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
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
  async getAllSessions() {
    return this.request('/sessions');
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
}

const apiService = new ApiService();
export default apiService;
