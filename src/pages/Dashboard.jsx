import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import '../styles/Dashboard.css';

function Dashboard({ user, onLogout, onViewSession, onManageExercises, onManageTrainings }) {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      loadStats();
    }
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const allSessions = await apiService.getAllSessions();
      setSessions(allSessions);
      await loadStats();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load your workout data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const periodStats = await apiService.getSessionStats(selectedPeriod);
      setStats(periodStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Get completed sessions only
  const completedSessions = sessions.filter(s => s.completed);

  // Get last session
  const lastSession = completedSessions.length > 0
    ? completedSessions[completedSessions.length - 1]
    : null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Use stats from API or calculate from sessions
  const getStatValue = (key, defaultValue = 0) => {
    if (stats && stats[key] !== undefined) {
      return stats[key];
    }
    return defaultValue;
  };

  return (
    <div className="dashboard-container">
      {/* Animated Background */}
      <div className="dashboard-background">
        <div className="gradient-mesh"></div>
        <div className="grid-background"></div>
        <div className="scan-line"></div>
        <div className="particles">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`}></div>
          ))}
        </div>
      </div>

      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">Hello, {user?.username}!</h1>
            <p className="dashboard-subtitle">Track your fitness journey</p>
          </div>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your training data...</p>
          </div>
        ) : (
          <>
        {/* Training Sessions Summary */}
        <section className="summary-section">
          <div className="section-header">
            <h2 className="section-title">Training Sessions</h2>
            <div className="period-selector">
              <button
                className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('week')}
              >
                Week
              </button>
              <button
                className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('month')}
              >
                Month
              </button>
              <button
                className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('year')}
              >
                Year
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="stat-icon">🏋️</div>
              <div className="stat-value">{getStatValue('totalSessions', 0)}</div>
              <div className="stat-label">
                Sessions this {selectedPeriod}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-value">{getStatValue('totalCalories', 0)}</div>
              <div className="stat-label">Calories burned</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-value">{getStatValue('totalDuration', 0)}</div>
              <div className="stat-label">Minutes trained</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💪</div>
              <div className="stat-value">{getStatValue('totalExercises', 0)}</div>
              <div className="stat-label">Exercises completed</div>
            </div>
          </div>
        </section>

        {/* Last Training Session */}
        {lastSession ? (
          <section className="session-info-section">
            <h2 className="section-title">Last Training Session</h2>
            <div
              className="session-card last-session clickable"
              onClick={() => onViewSession && onViewSession(lastSession)}
            >
              <div className="session-icon">✅</div>
              <div className="session-details">
                <h3 className="session-type">{lastSession.training_type || 'Workout'}</h3>
                <div className="session-meta">
                  <span className="session-date">
                    {formatDate(lastSession.session_date || lastSession.created_at)}
                  </span>
                  <span className="session-duration">
                    {lastSession.duration || 0} min
                  </span>
                  <span className="session-calories">
                    {lastSession.calories || 0} cal
                  </span>
                </div>
              </div>
              <div className="view-arrow">→</div>
            </div>
          </section>
        ) : (
          completedSessions.length === 0 && !loading && (
            <section className="session-info-section">
              <div className="empty-state">
                <div className="empty-icon">🏋️</div>
                <h3>No workouts yet</h3>
                <p>Start your first workout to see your progress here!</p>
                <button onClick={onManageTrainings} className="cta-button">
                  View Training Programs
                </button>
              </div>
            </section>
          )
        )}

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <button
              className="action-card"
              style={{ '--accent-color': '#667eea' }}
              onClick={onManageTrainings}
            >
              <div className="action-icon">📋</div>
              <div className="action-title">Trainings</div>
            </button>
            <button
              className="action-card"
              style={{ '--accent-color': '#764ba2' }}
              onClick={onManageExercises}
            >
              <div className="action-icon">💪</div>
              <div className="action-title">Exercises</div>
            </button>
            <button className="action-card" style={{ '--accent-color': '#f093fb' }}>
              <div className="action-icon">🍎</div>
              <div className="action-title">Track Diet</div>
            </button>
            <button className="action-card" style={{ '--accent-color': '#4facfe' }}>
              <div className="action-icon">📊</div>
              <div className="action-title">View Progress</div>
            </button>
          </div>
        </section>
        </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
