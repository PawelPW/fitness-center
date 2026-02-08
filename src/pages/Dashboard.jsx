import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';
import MiniCalendar from '../components/MiniCalendar';
import PlanWorkoutModal from '../components/PlanWorkoutModal';
import QuickPlanTemplates from '../components/QuickPlanTemplates';
import PlannedSessionCard from '../components/PlannedSessionCard';
import SessionStatusBadge from '../components/SessionStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { calculateCurrentStreak } from '../utils/calendarHelpers';
import '../styles/Dashboard.css';

function Dashboard({ user, onLogout, onViewSession, onManageExercises, onManageTrainings, onViewStats, onViewCalendar, onViewSettings, onViewPlanner, onStartWorkout }) {
  const { t } = useTranslation(['dashboard', 'common', 'workout']);
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Planning feature state
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showQuickPlanModal, setShowQuickPlanModal] = useState(false);
  const [editSession, setEditSession] = useState(null);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadUpcomingSessions();
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
      logger.error('Failed to load dashboard data:', error);
      setError('Failed to load your workout data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load upcoming planned workout sessions
   * Fetches next 7 days of planned sessions, limited to 5 for dashboard display
   */
  const loadUpcomingSessions = async () => {
    try {
      const { sessions } = await apiService.getUpcomingPlannedSessions(7);
      setUpcomingSessions(sessions.slice(0, 5)); // Next 5 sessions for dashboard
    } catch (error) {
      logger.error('Failed to fetch upcoming sessions:', error);
    }
  };

  const loadStats = async () => {
    try {
      const periodStats = await apiService.getSessionStats(selectedPeriod);
      setStats(periodStats);
    } catch (error) {
      logger.error('Failed to load stats:', error);
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

  // Calculate current streak using the calendar helper function
  const currentStreak = calculateCurrentStreak(sessions);

  // Calculate workouts for current calendar month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();


  const currentMonthSessions = completedSessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
  });

  const monthlyWorkouts = currentMonthSessions.length;

  /**
   * Calculate scheduled (planned, non-completed) sessions for current month
   */
  const scheduledThisMonth = useMemo(() => {
    return upcomingSessions.filter(session => {
      const sessionDate = new Date(session.date);
      return (
        sessionDate.getMonth() === currentMonth &&
        sessionDate.getFullYear() === currentYear &&
        !session.completed
      );
    }).length;
  }, [upcomingSessions, currentMonth, currentYear]);

  /**
   * Handle successful session planning
   * Refreshes upcoming sessions and closes modal
   */
  const handlePlanSuccess = async (session) => {
    logger.log('Session planned:', session);
    await loadUpcomingSessions();
    setShowPlanModal(false);
    setEditSession(null);
  };

  /**
   * Handle successful quick plan template
   * Refreshes upcoming sessions and navigates to calendar
   */
  const handleQuickPlanSuccess = async (sessions) => {
    logger.log('Quick plan created:', sessions);
    await loadUpcomingSessions();
    setShowQuickPlanModal(false);
    // Navigate to calendar with highlights
    if (onViewCalendar) {
      onViewCalendar();
    }
  };

  /**
   * Start a planned workout session
   * Uses onStartWorkout prop from App.jsx which handles FE-7 (fetching program data)
   */
  // Removed local handleStartWorkout function - now using onStartWorkout prop from App.jsx

  /**
   * Edit a planned session
   * Opens PlanWorkoutModal in edit mode with session data
   */
  const handleEditSession = (session) => {
    setEditSession(session);
    setShowPlanModal(true);
  };

  /**
   * Delete a planned session
   * Shows confirmation dialog and refreshes list after deletion
   */
  const handleDeleteSession = (sessionId) => {
    setSessionToDelete(sessionId);
    setShowDeleteDialog(true);
  };

  /**
   * Confirm and execute session deletion with optimistic UI update
   */
  const confirmDelete = async () => {
    const sessionId = sessionToDelete;

    // 1. Optimistic update: Remove from UI immediately
    const originalSessions = [...upcomingSessions];
    setUpcomingSessions(prev => prev.filter(s => s.id !== sessionId));

    // Close dialog immediately for better UX
    setShowDeleteDialog(false);
    setSessionToDelete(null);

    try {
      // 2. API call
      await apiService.deletePlannedSession(sessionId);

      // 3. Success toast
      showToast({
        type: 'success',
        message: t('dashboard:toast.workoutRemoved'),
        duration: 3000
      });
    } catch (error) {
      logger.error('Failed to delete session:', error);

      // 4. Rollback on error
      setUpcomingSessions(originalSessions);

      // 5. Parse error for retry option
      let errorMessage = t('dashboard:toast.deleteFailed');
      let errorCode = null;

      try {
        const errorData = JSON.parse(error.message);
        errorCode = errorData.code;
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Use default message
      }

      // 6. Error toast with retry action for network errors
      const isNetworkError = errorCode === 'TIMEOUT' || errorCode === 'OFFLINE' || errorCode === 'NETWORK_ERROR';

      showToast({
        type: 'error',
        message: errorMessage,
        duration: isNetworkError ? 0 : 5000,
        action: isNetworkError ? {
          label: t('dashboard:toast.retry'),
          onClick: () => {
            setSessionToDelete(sessionId);
            confirmDelete();
          }
        } : null
      });
    }
  };

  /**
   * Open the Plan Workout modal
   */
  const handleOpenPlanModal = () => {
    setEditSession(null);
    setShowPlanModal(true);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-top-bar">
          <button onClick={onViewSettings} className="btn-icon settings-button" title={t('common:settings')} aria-label={t('common:settings')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/>
              <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24m0-13.38-4.24 4.24m-5.66 5.66-4.24 4.24"/>
            </svg>
          </button>
          <div className="header-greeting">
            <h1 className="dashboard-title">
              {t('dashboard:header.greeting', { username: user?.username })}
              {currentStreak > 0 && <span className="streak-emoji">🔥</span>}
            </h1>
            <div className="dashboard-stats-subtitle">
              {currentStreak > 0 && (
                <span className="stat-badge">
                  <span className="stat-badge-value">{currentStreak}</span>
                  <span className="stat-badge-label">{t('dashboard:header.day_streak', { count: currentStreak })}</span>
                </span>
              )}
              <span className="stat-badge">
                <span className="stat-badge-value">{monthlyWorkouts}</span>
                <span className="stat-badge-label">{t('dashboard:header.workouts_this_month', { count: monthlyWorkouts })}</span>
              </span>

              {/* Scheduled Workouts Badge */}
              {scheduledThisMonth > 0 && (
                <span className="stat-badge scheduled-badge" title={t('dashboard:upcomingWorkouts.title')}>
                  <span className="stat-badge-icon">📋</span>
                  <span className="stat-badge-value">{scheduledThisMonth}</span>
                  <span className="stat-badge-label">{t('dashboard:header.scheduled')}</span>
                </span>
              )}

              {/* Compact Goal Progress Badge */}
              {user?.weight_kg && user?.target_weight_kg && user?.fitness_goal && (
                <span className="stat-badge goal-badge" title={t('dashboard:header.goalTitle', { goal: t(`dashboard:header.fitnessGoals.${user.fitness_goal}`), current: user.weight_kg, target: user.target_weight_kg })}>
                    <span className="goal-badge-icon">
                      {user.fitness_goal === 'weight_loss' && '🔥'}
                      {user.fitness_goal === 'muscle_gain' && '💪'}
                      {user.fitness_goal === 'maintenance' && '⚖️'}
                      {user.fitness_goal === 'endurance' && '🏃'}
                    </span>
                    <span className="stat-badge-value">
                      {(() => {
                        const current = parseFloat(user.weight_kg);
                        const target = parseFloat(user.target_weight_kg);
                        const remaining = Math.abs(current - target);
                        return remaining.toFixed(1);
                      })()}kg
                    </span>
                    <span className="stat-badge-label">{t('dashboard:header.toGoal')}</span>
                  </span>
              )}
            </div>
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
                {t(`dashboard:trainingSessions.sessionsCount_${selectedPeriod}`)}
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

        {/* Upcoming Workouts Section */}
        <section className="section upcoming-workouts-section">
          <div className="section-header">
            <h2 className="section-title">{t('dashboard:upcomingWorkouts.title')}</h2>
            {upcomingSessions.length > 0 && (
              <button
                className="view-all-link"
                onClick={onViewCalendar}
                aria-label={t('dashboard:upcomingWorkouts.viewAll')}
              >
                {t('dashboard:upcomingWorkouts.viewAll')}
              </button>
            )}
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="upcoming-sessions-grid">
              {upcomingSessions.map((session) => (
                <PlannedSessionCard
                  key={session.id}
                  session={session}
                  onStartWorkout={onStartWorkout}
                  onEdit={handleEditSession}
                  onDelete={handleDeleteSession}
                  showActions={true}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state upcoming-empty">
              <div className="empty-icon floating-icon">📅</div>
              <h3>{t('dashboard:upcomingWorkouts.emptyTitle')}</h3>
              <p>{t('dashboard:upcomingWorkouts.emptyMessage')}</p>
              <button onClick={handleOpenPlanModal} className="btn-primary">
                {t('dashboard:upcomingWorkouts.planButton')}
              </button>
            </div>
          )}
        </section>

        {/* Training Calendar */}
        <section className="section">
          <MiniCalendar sessions={completedSessions} onClick={onViewCalendar} />
        </section>

        {/* Last Training Session */}
        <section className="section">
          {lastSession ? (
            <>
              <div className="section-header">
                <h2 className="section-title">{t('dashboard:lastTraining.title')}</h2>
              </div>
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

        {/* Quick Actions */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">{t('dashboard:quickActions.title')}</h2>
          </div>
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
            <button className="action-card action-card-plan" onClick={onViewPlanner}>
              <div className="action-icon">🗓️</div>
              <div className="action-title">{t('dashboard:quickActions.planner')}</div>
            </button>
          </div>
        </section>
        </>
        )}
      </main>

      {/* Planning Modals */}
      <PlanWorkoutModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setEditSession(null);
        }}
        onSuccess={handlePlanSuccess}
        editSession={editSession}
      />

      <QuickPlanTemplates
        isOpen={showQuickPlanModal}
        onClose={() => setShowQuickPlanModal(false)}
        onSuccess={handleQuickPlanSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSessionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t('dashboard:deleteDialog.title')}
        message={t('dashboard:deleteDialog.message')}
        confirmText={t('dashboard:deleteDialog.confirm')}
        cancelText={t('dashboard:deleteDialog.cancel')}
        variant="danger"
      />
    </div>
  );
}

export default Dashboard;
