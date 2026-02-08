import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { logger } from '../utils/logger';
import {
  generateCalendarGrid,
  getMonthName,
  getDayNames,
  getPreviousMonth,
  getNextMonth,
  calculateCurrentStreak,
  calculateMonthlyStats,
  getPlannedSessionsForDate,
  getCompletedSessionsForDate,
  isOverdue,
  formatDateKey,
} from '../utils/calendarHelpers';
import apiService from '../services/api';
import { useToast } from '../hooks/useToast';
import PlanWorkoutModal from '../components/PlanWorkoutModal';
import PlannedSessionCard from '../components/PlannedSessionCard';
import SessionStatusBadge from '../components/SessionStatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/TrainingCalendar.css';

function TrainingCalendar({ onBack, onStartWorkout }) {
  const { t, i18n } = useTranslation('calendar');
  const swipeHandlers = useSwipeNavigation(onBack);
  const { showToast } = useToast();

  // Data state
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  // Modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editSession, setEditSession] = useState(null);
  const [initialDate, setInitialDate] = useState('');

  // Section collapse state
  const [showPlannedSection, setShowPlannedSection] = useState(true);
  const [showCompletedSection, setShowCompletedSection] = useState(true);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get current locale from i18n
  const locale = i18n.language === 'pl' ? 'pl-PL' : 'en-US';

  // Fetch all sessions on mount
  useEffect(() => {
    fetchAllSessions();
  }, []);

  const fetchAllSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getAllSessions();
      setSessions(data || []);
    } catch (err) {
      logger.error('Failed to fetch sessions:', err);
      setError(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Calendar navigation
  const handlePreviousMonth = () => {
    const { year: newYear, month: newMonth } = getPreviousMonth(year, month);
    setCurrentDate(new Date(newYear, newMonth, 1));
  };

  const handleNextMonth = () => {
    const { year: newYear, month: newMonth } = getNextMonth(year, month);
    setCurrentDate(new Date(newYear, newMonth, 1));
  };

  // Get day indicators (completed, planned, overdue counts)
  const getDayIndicators = (date, daySessions) => {
    const planned = getPlannedSessionsForDate(date, daySessions);
    const completed = getCompletedSessionsForDate(date, daySessions);
    const overdueSessions = planned.filter(s => isOverdue(s));

    return {
      hasCompleted: completed.length > 0,
      completedCount: completed.length,
      hasPlanned: planned.length > 0,
      plannedCount: planned.length,
      hasOverdue: overdueSessions.length > 0,
      overdueCount: overdueSessions.length,
    };
  };

  // Handle day click - open modal with sessions
  const handleDayClick = (dayData) => {
    const indicators = getDayIndicators(dayData.date, sessions);

    // Only open modal if there are sessions (planned or completed)
    if (indicators.hasCompleted || indicators.hasPlanned) {
      setSelectedDay(dayData);
      setShowDayModal(true);
    } else {
      // No sessions - open plan modal directly with date pre-filled
      const dateKey = formatDateKey(dayData.date);
      setInitialDate(dateKey);
      setShowPlanModal(true);
    }
  };

  // Handle start workout from planned session
  const handleStartWorkout = (session) => {
    // Close day modal
    setShowDayModal(false);

    // Call the parent handler if provided
    if (onStartWorkout) {
      onStartWorkout(session);
    } else {
      // Fallback: log a warning if no handler provided
      logger.warn('TrainingCalendar: onStartWorkout prop not provided');
    }
  };

  // Handle edit planned session
  const handleEditSession = (session) => {
    setEditSession(session);
    const dateKey = formatDateKey(new Date(session.date || session.session_date));
    setInitialDate(dateKey);
    setShowPlanModal(true);
  };

  // Handle delete planned session
  const handleDeleteSession = (sessionId) => {
    setSessionToDelete(sessionId);
    setShowDeleteDialog(true);
  };

  // Confirm and execute session deletion with optimistic UI update
  const confirmDelete = async () => {
    const sessionId = sessionToDelete;

    // 1. Optimistic update: Remove from UI immediately
    const originalSessions = [...sessions];
    setSessions(prev => prev.filter(s => s.id !== sessionId));

    // Close dialog immediately for better UX
    setShowDeleteDialog(false);
    setSessionToDelete(null);

    // Close day modal if no more sessions for that day
    if (selectedDay) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      const indicators = getDayIndicators(selectedDay.date, remainingSessions);
      if (!indicators.hasCompleted && !indicators.hasPlanned) {
        setShowDayModal(false);
      }
    }

    try {
      // 2. API call
      await apiService.deletePlannedSession(sessionId);

      // 3. Success toast
      showToast({
        type: 'success',
        message: 'Workout removed',
        duration: 3000
      });
    } catch (error) {
      logger.error('Failed to delete session:', error);

      // 4. Rollback on error
      setSessions(originalSessions);

      // Re-open day modal if it was closed
      if (selectedDay) {
        const indicators = getDayIndicators(selectedDay.date, originalSessions);
        if (indicators.hasCompleted || indicators.hasPlanned) {
          setShowDayModal(true);
        }
      }

      // 5. Parse error for retry option
      let errorMessage = 'Failed to delete workout';
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
          label: 'Retry',
          onClick: () => {
            setSessionToDelete(sessionId);
            confirmDelete();
          }
        } : null
      });
    }
  };

  // Handle plan new workout (from FAB or day modal)
  const handlePlanNewWorkout = (date = null) => {
    setEditSession(null);

    if (date) {
      const dateKey = formatDateKey(date);
      setInitialDate(dateKey);
    } else {
      setInitialDate('');
    }

    setShowPlanModal(true);
  };

  // Handle plan success callback
  const handlePlanSuccess = async (newSession) => {
    // Refresh all sessions
    await fetchAllSessions();

    // Close plan modal
    setShowPlanModal(false);
    setEditSession(null);
    setInitialDate('');
  };

  // Handle view completed session details
  const handleViewSessionDetails = (session) => {
    // This could navigate to a detailed session view
    // For now, just close the modal
    logger.log('View session details:', session);
  };

  // Generate calendar grid and stats
  const calendarGrid = useMemo(
    () => generateCalendarGrid(year, month, sessions),
    [year, month, sessions]
  );

  const dayNames = useMemo(() => getDayNames(locale), [locale]);
  const currentStreak = useMemo(() => calculateCurrentStreak(sessions), [sessions]);
  const monthlyStats = useMemo(
    () => calculateMonthlyStats(year, month, sessions),
    [year, month, sessions]
  );

  // Get sessions for selected day
  const selectedDayPlanned = selectedDay
    ? getPlannedSessionsForDate(selectedDay.date, sessions)
    : [];
  const selectedDayCompleted = selectedDay
    ? getCompletedSessionsForDate(selectedDay.date, sessions)
    : [];

  if (loading) {
    return (
      <div className="training-calendar-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div {...swipeHandlers} className="training-calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <button onClick={onBack} className="back-btn">
          ← {t('back')}
        </button>
        <h1 className="calendar-page-title">{t('title')}</h1>
      </div>

      {/* Month Navigation */}
      <div className="month-navigation">
        <button
          onClick={handlePreviousMonth}
          className="month-nav-btn"
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="current-month">
          <span className="month-name">{getMonthName(month, locale)}</span>
          <span className="year-name">{year}</span>
        </div>
        <button
          onClick={handleNextMonth}
          className="month-nav-btn"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Streak and Stats */}
      <div className="calendar-stats-section">
        {currentStreak > 0 && (
          <div className="streak-card">
            <span className="streak-icon">🔥</span>
            <div className="streak-info">
              <span className="streak-number">{currentStreak}</span>
              <span className="streak-label">{t('streak.label')}</span>
            </div>
          </div>
        )}

        <div className="monthly-stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🏋️</span>
            <span className="stat-value">{monthlyStats.totalSessions}</span>
            <span className="stat-label">{t('stats.sessions')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔥</span>
            <span className="stat-value">{monthlyStats.totalCalories}</span>
            <span className="stat-label">{t('stats.calories')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <span className="stat-value">{monthlyStats.totalMinutes}</span>
            <span className="stat-label">{t('stats.minutes')}</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-content">
        {/* Day names header */}
        <div className="calendar-days-header">
          {dayNames.map(day => (
            <div key={day} className="day-name">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid with indicators */}
        <div className="calendar-grid">
          {calendarGrid.map((dayData, index) => {
            const indicators = getDayIndicators(dayData.date, sessions);
            const isToday = dayData.isToday;
            const isCurrentMonth = dayData.isCurrentMonth;
            const hasAnySession = indicators.hasCompleted || indicators.hasPlanned;

            return (
              <div
                key={index}
                className={`calendar-day
                  ${!isCurrentMonth ? 'other-month' : ''}
                  ${hasAnySession ? 'has-session' : ''}
                  ${isToday ? 'today' : ''}
                  ${indicators.hasOverdue ? 'has-overdue' : ''}
                `}
                onClick={() => handleDayClick(dayData)}
                role="gridcell"
                tabIndex={0}
                aria-label={`${dayData.day} ${getMonthName(month, locale)}, ${
                  indicators.completedCount
                } completed, ${indicators.plannedCount} planned`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDayClick(dayData);
                  }
                }}
              >
                <span className="day-number">{dayData.day}</span>

                {/* Session indicators */}
                {hasAnySession && (
                  <div className="session-indicators">
                    {/* Completed indicator */}
                    {indicators.hasCompleted && (
                      <div className="indicator-group">
                        <span
                          className="indicator-dot completed"
                          aria-label={`${indicators.completedCount} completed`}
                        />
                        {indicators.completedCount > 1 && (
                          <span className="indicator-count completed">
                            {indicators.completedCount}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Planned/Overdue indicator */}
                    {indicators.hasPlanned && (
                      <div className="indicator-group">
                        <span
                          className={`indicator-dot ${
                            indicators.hasOverdue ? 'overdue' : 'planned'
                          }`}
                          aria-label={`${indicators.plannedCount} ${
                            indicators.hasOverdue ? 'overdue' : 'planned'
                          }`}
                        />
                        {indicators.plannedCount > 1 && (
                          <span
                            className={`indicator-count ${
                              indicators.hasOverdue ? 'overdue' : 'planned'
                            }`}
                          >
                            {indicators.plannedCount}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Floating Action Button */}
      <button
        className="calendar-fab"
        onClick={() => handlePlanNewWorkout()}
        aria-label="Plan new workout"
        title="Plan new workout"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Day Details Modal */}
      {showDayModal && selectedDay && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="day-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="day-modal-header">
              <h2 className="day-modal-title">
                {selectedDay.date.toLocaleDateString(locale, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <button
                className="day-modal-close"
                onClick={() => setShowDayModal(false)}
                aria-label="Close"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="day-modal-body">
              {/* Planned Sessions Section */}
              {selectedDayPlanned.length > 0 && (
                <div className="day-modal-section">
                  <button
                    className="section-header"
                    onClick={() => setShowPlannedSection(!showPlannedSection)}
                    aria-expanded={showPlannedSection}
                  >
                    <span className="section-icon">📅</span>
                    <span className="section-title">Planned Workouts</span>
                    <span className="section-count">({selectedDayPlanned.length})</span>
                    <span className={`section-chevron ${showPlannedSection ? 'expanded' : ''}`}>
                      ›
                    </span>
                  </button>

                  {showPlannedSection && (
                    <div className="section-content">
                      {selectedDayPlanned.map((session) => (
                        <PlannedSessionCard
                          key={session.id}
                          session={session}
                          onStartWorkout={handleStartWorkout}
                          onEdit={handleEditSession}
                          onDelete={handleDeleteSession}
                          showActions={true}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Completed Sessions Section */}
              {selectedDayCompleted.length > 0 && (
                <div className="day-modal-section">
                  <button
                    className="section-header"
                    onClick={() => setShowCompletedSection(!showCompletedSection)}
                    aria-expanded={showCompletedSection}
                  >
                    <span className="section-icon">✓</span>
                    <span className="section-title">Completed Workouts</span>
                    <span className="section-count">({selectedDayCompleted.length})</span>
                    <span className={`section-chevron ${showCompletedSection ? 'expanded' : ''}`}>
                      ›
                    </span>
                  </button>

                  {showCompletedSection && (
                    <div className="section-content">
                      {selectedDayCompleted.map((session, idx) => (
                        <div key={session.id || idx} className="completed-session-card">
                          <div className="completed-session-header">
                            <div className="completed-session-type-wrapper">
                              <span className="completed-session-type">
                                {session.type || 'Workout'}
                              </span>
                              <SessionStatusBadge
                                session={session}
                                size="small"
                                showIcon={true}
                                showLabel={false}
                              />
                            </div>
                            <span className="completed-session-time">
                              {session.duration || 0} {t('units.min')}
                            </span>
                          </div>

                          <div className="completed-session-stats">
                            <span className="completed-session-stat">
                              <span className="stat-icon">🔥</span>
                              {session.calories || 0} {t('units.cal')}
                            </span>
                            {session.exerciseCount && (
                              <span className="completed-session-stat">
                                <span className="stat-icon">💪</span>
                                {session.exerciseCount} exercises
                              </span>
                            )}
                          </div>

                          {session.notes && (
                            <p className="completed-session-notes">{session.notes}</p>
                          )}

                          <button
                            className="completed-session-view-btn"
                            onClick={() => handleViewSessionDetails(session)}
                          >
                            View Details
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Empty states */}
              {selectedDayPlanned.length === 0 && selectedDayCompleted.length === 0 && (
                <div className="day-modal-empty">
                  <p className="empty-message">No workouts scheduled for this day</p>
                </div>
              )}

              {/* Plan Another Workout Button */}
              <button
                className="day-modal-plan-btn"
                onClick={() => {
                  setShowDayModal(false);
                  handlePlanNewWorkout(selectedDay.date);
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Plan Another Workout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Workout Modal */}
      <PlanWorkoutModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setEditSession(null);
          setInitialDate('');
        }}
        onSuccess={handlePlanSuccess}
        editSession={editSession}
        initialDate={initialDate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSessionToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Workout?"
        message="Are you sure you want to delete this planned workout?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default TrainingCalendar;
