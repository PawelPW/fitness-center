import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import MiniCalendar from '../components/MiniCalendar';
import '../styles/Dashboard.css';

function Dashboard({ user, onLogout, onViewSession, onManageExercises, onManageTrainings, onViewStats, onViewCalendar, onViewSettings }) {
  const { t } = useTranslation(['dashboard', 'common', 'workout']);
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

  // Get last session (sessions are already sorted by date DESC, so first is most recent)
  const lastSession = completedSessions.length > 0
    ? completedSessions[0]
    : null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('common:date_relative.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('common:date_relative.tomorrow');
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
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="dashboard-title">{t('dashboard:header.greeting', { username: user?.username })}</h1>
            <p className="dashboard-subtitle">{t('dashboard:header.subtitle')}</p>
          </div>
          <div className="header-actions">
            <button onClick={onViewSettings} className="btn-icon" title={t('common:settings')} aria-label={t('common:settings')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/>
                <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24m0-13.38-4.24 4.24m-5.66 5.66-4.24 4.24"/>
              </svg>
            </button>
            <button onClick={onLogout} className="btn-secondary">
              {t('common:logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('dashboard:loading.trainingData')}</p>
          </div>
        ) : (
          <>
        {/* Training Sessions Summary */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t('dashboard:trainingSessions.title')}</h2>
            <div className="period-selector">
              <button
                className={`period-btn ${selectedPeriod === 'week' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('week')}
              >
                {t('common:period.week')}
              </button>
              <button
                className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('month')}
              >
                {t('common:period.month')}
              </button>
              <button
                className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('year')}
              >
                {t('common:period.year')}
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon">🏋️</div>
              <div className="stat-card-value">{getStatValue('totalSessions', 0)}</div>
              <div className="stat-card-label">
                {t('dashboard:trainingSessions.sessionsCount', { period: selectedPeriod })}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon">🔥</div>
              <div className="stat-card-value">{getStatValue('totalCalories', 0)}</div>
              <div className="stat-card-label">{t('dashboard:trainingSessions.caloriesBurned')}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon">⏱️</div>
              <div className="stat-card-value">{getStatValue('totalDuration', 0)}</div>
              <div className="stat-card-label">{t('dashboard:trainingSessions.minutesTrained')}</div>
            </div>

            <div className="stat-card">
              <div className="stat-card-icon">💪</div>
              <div className="stat-card-value">{getStatValue('totalExercises', 0)}</div>
              <div className="stat-card-label">{t('dashboard:trainingSessions.exercisesCompleted')}</div>
            </div>
          </div>
        </section>

        {/* Last Training Session */}
        <section className="section">
          {lastSession ? (
            <>
              <h2 className="section-title">{t('dashboard:lastTraining.title')}</h2>
              <div
                className="card card-clickable session-card"
                onClick={() => onViewSession && onViewSession(lastSession)}
              >
                <div className="session-icon">✅</div>
                <div className="session-details">
                  <h3 className="session-type">{lastSession.type || t('workout:session.defaultType')}</h3>
                  <div className="session-meta">
                    <span>
                      {formatDate(lastSession.date)}
                    </span>
                    <span>{lastSession.duration || 0} {t('common:units.minutes_short')}</span>
                    <span>{lastSession.calories || 0} {t('common:units.calories_short')}</span>
                  </div>
                </div>
                <div className="view-arrow">→</div>
              </div>
            </>
          ) : (
            completedSessions.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🏋️</div>
                <h3>{t('dashboard:emptyState.title')}</h3>
                <p>{t('dashboard:emptyState.message')}</p>
                <button onClick={onManageTrainings} className="btn-primary">
                  {t('dashboard:emptyState.action')}
                </button>
              </div>
            )
          )}
        </section>

        {/* Training Calendar */}
        <section className="section">
          <MiniCalendar sessions={completedSessions} onClick={onViewCalendar} />
        </section>

        {/* Quick Actions */}
        <section className="section">
          <h2 className="section-title">{t('dashboard:quickActions.title')}</h2>
          <div className="quick-actions-grid">
            <button className="action-card" onClick={onManageTrainings}>
              <div className="action-icon">📋</div>
              <div className="action-title">{t('dashboard:quickActions.trainings')}</div>
            </button>
            <button className="action-card" onClick={onManageExercises}>
              <div className="action-icon">💪</div>
              <div className="action-title">{t('dashboard:quickActions.exercises')}</div>
            </button>
            <button className="action-card" onClick={onViewStats}>
              <div className="action-icon">📊</div>
              <div className="action-title">{t('dashboard:quickActions.statistics')}</div>
            </button>
            <button className="action-card" onClick={onViewSettings}>
              <div className="action-icon">⚙️</div>
              <div className="action-title">{t('dashboard:quickActions.settings')}</div>
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
