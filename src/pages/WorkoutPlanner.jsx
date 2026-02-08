import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { useToast } from '../hooks/useToast';
import { logger } from '../utils/logger';
import MiniCalendar from '../components/MiniCalendar';
import PlannedSessionCard from '../components/PlannedSessionCard';
import PlanWorkoutModal from '../components/PlanWorkoutModal';
import QuickPlanTemplates from '../components/QuickPlanTemplates';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  formatDateKey,
  getPreviousMonth,
  getNextMonth,
  getMonthName,
  isOverdue,
} from '../utils/calendarHelpers';
import './WorkoutPlanner.css';

/**
 * WorkoutPlanner Component
 *
 * Dedicated page for planning and managing future workout sessions.
 * Features futuristic glassmorphism design with comprehensive workout planning tools.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onBack - Callback for navigation back
 * @param {Function} props.onStartWorkout - Callback to start a workout from a planned session
 */
function WorkoutPlanner({ onBack, onStartWorkout }) {
  const { t } = useTranslation(['workoutPlanner', 'common']);
  const { showToast } = useToast();

  // State management
  const [plannedSessions, setPlannedSessions] = useState([]);
  const [allSessions, setAllSessions] = useState([]); // For calendar display (planned + completed)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showQuickPlanModal, setShowQuickPlanModal] = useState(false);
  const [showBulkActionsMenu, setShowBulkActionsMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editSession, setEditSession] = useState(null);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

  // Touch gesture state for swipe navigation
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const calendarRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadPlannedSessions();
    loadAllSessions();
  }, []);

  /**
   * Load all planned (non-completed) sessions
   */
  const loadPlannedSessions = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await apiService.getAllSessions({ completed: false });
      // API returns sessions array directly, not wrapped in { sessions: [...] }
      const sessions = Array.isArray(response) ? response : (response.sessions || []);
      setPlannedSessions(sessions);
      setError('');
    } catch (err) {
      logger.error('Failed to load planned sessions:', err);
      setError(t('errors.loadFailed'));
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Load all sessions (planned + completed) for calendar display
   */
  const loadAllSessions = async () => {
    try {
      const response = await apiService.getAllSessions();
      // API returns sessions array directly, not wrapped in { sessions: [...] }
      const sessions = Array.isArray(response) ? response : (response.sessions || []);
      setAllSessions(sessions);
    } catch (err) {
      logger.error('Failed to load all sessions:', err);
    }
  };

  /**
   * Pull-to-refresh handler
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    // Haptic feedback if available
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
    await loadPlannedSessions(false);
    await loadAllSessions();
  };

  /**
   * Handle successful session planning
   */
  const handlePlanSuccess = async (session) => {
    logger.log('Session planned:', session);
    await loadPlannedSessions(false);
    await loadAllSessions();
    setShowPlanModal(false);
    setEditSession(null);

    // Haptic success feedback
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.notification({ type: 'success' });
    }
  };

  /**
   * Handle successful quick plan
   */
  const handleQuickPlanSuccess = async (sessions) => {
    logger.log('Quick plan created:', sessions);
    await loadPlannedSessions(false);
    await loadAllSessions();
    setShowQuickPlanModal(false);

    // Haptic success feedback
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.notification({ type: 'success' });
    }
  };

  /**
   * Start a planned workout session
   */
  const handleStartWorkout = (session) => {
    logger.log('Starting workout from planned session:', session);
    if (onStartWorkout) {
      onStartWorkout(session);
    } else {
      logger.warn('WorkoutPlanner: onStartWorkout prop not provided');
    }
  };

  /**
   * Edit a planned session
   */
  const handleEditSession = (session) => {
    setEditSession(session);
    setShowPlanModal(true);
  };

  /**
   * Delete a single planned session
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
    const originalPlannedSessions = [...plannedSessions];
    const originalAllSessions = [...allSessions];

    setPlannedSessions(prev => prev.filter(s => s.id !== sessionId));
    setAllSessions(prev => prev.filter(s => s.id !== sessionId));

    // Close dialog immediately for better UX
    setShowDeleteDialog(false);
    setSessionToDelete(null);

    try {
      // 2. API call
      await apiService.deletePlannedSession(sessionId);

      // 3. Success toast
      showToast({
        type: 'success',
        message: t('toast.workoutRemoved'),
        duration: 3000
      });

      // Haptic feedback
      if (window.Capacitor?.Plugins?.Haptics) {
        window.Capacitor.Plugins.Haptics.notification({ type: 'success' });
      }
    } catch (error) {
      logger.error('Failed to delete session:', error);

      // 4. Rollback on error
      setPlannedSessions(originalPlannedSessions);
      setAllSessions(originalAllSessions);

      // 5. Parse error for retry option
      let errorMessage = t('errors.deleteFailed');
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
          label: t('toast.retry'),
          onClick: () => {
            setSessionToDelete(sessionId);
            confirmDelete();
          }
        } : null
      });
    }
  };

  /**
   * Delete all planned sessions
   */
  const handleDeleteAllPlanned = async () => {
    if (plannedSessions.length === 0) {
      alert(t('bulkActions.noSessionsWeek'));
      return;
    }

    // Double confirmation for safety
    if (!confirm(t('bulkActions.confirmAll', { count: plannedSessions.length }))) {
      return;
    }

    if (!confirm(t('bulkActions.confirmAllFinal'))) {
      return;
    }

    try {
      setLoading(true);
      // Delete each session individually (since bulk delete API may not exist)
      const deletePromises = plannedSessions.map((session) =>
        apiService.deletePlannedSession(session.id)
      );
      await Promise.all(deletePromises);

      await loadPlannedSessions(false);
      await loadAllSessions();
      setShowBulkActionsMenu(false);

      // Success haptic feedback
      if (window.Capacitor?.Plugins?.Haptics) {
        window.Capacitor.Plugins.Haptics.notification({ type: 'success' });
      }
    } catch (error) {
      logger.error('Failed to delete all sessions:', error);
      alert(t('errors.deletePartial'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear planned sessions for current week (Monday-Sunday)
   */
  const handleClearThisWeek = async () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate Monday of current week
    const monday = new Date(today);
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // If Sunday, go back 6 days
    monday.setDate(today.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);

    // Calculate Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Filter sessions in current week
    const weekSessions = plannedSessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return sessionDate >= monday && sessionDate <= sunday;
    });

    if (weekSessions.length === 0) {
      alert(t('bulkActions.noSessionsWeek'));
      return;
    }

    if (!confirm(t('bulkActions.confirmWeek', { count: weekSessions.length }))) {
      return;
    }

    try {
      setLoading(true);
      const deletePromises = weekSessions.map((session) =>
        apiService.deletePlannedSession(session.id)
      );
      await Promise.all(deletePromises);

      await loadPlannedSessions(false);
      await loadAllSessions();
      setShowBulkActionsMenu(false);

      // Success haptic feedback
      if (window.Capacitor?.Plugins?.Haptics) {
        window.Capacitor.Plugins.Haptics.notification({ type: 'success' });
      }
    } catch (error) {
      logger.error('Failed to clear week:', error);
      alert(t('errors.deletePartial'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear planned sessions for currently displayed month
   */
  const handleClearThisMonth = async () => {
    // Filter sessions in current displayed month
    const monthSessions = plannedSessions.filter((session) => {
      const sessionDate = new Date(session.date);
      return (
        sessionDate.getMonth() === currentMonth &&
        sessionDate.getFullYear() === currentYear
      );
    });

    if (monthSessions.length === 0) {
      alert(t('bulkActions.noSessionsMonth', { month: getMonthName(currentMonth), year: currentYear }));
      return;
    }

    if (!confirm(t('bulkActions.confirmMonth', { count: monthSessions.length, month: getMonthName(currentMonth), year: currentYear }))) {
      return;
    }

    try {
      setLoading(true);
      const deletePromises = monthSessions.map((session) =>
        apiService.deletePlannedSession(session.id)
      );
      await Promise.all(deletePromises);

      await loadPlannedSessions(false);
      await loadAllSessions();
      setShowBulkActionsMenu(false);

      // Success haptic feedback
      if (window.Capacitor?.Plugins?.Haptics) {
        window.Capacitor.Plugins.Haptics.notification({ type: 'success' });
      }
    } catch (error) {
      logger.error('Failed to clear month:', error);
      alert(t('errors.deletePartial'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to previous month
   */
  const handlePreviousMonth = () => {
    const { year, month } = getPreviousMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);

    // Haptic feedback
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
  };

  /**
   * Navigate to next month
   */
  const handleNextMonth = () => {
    const { year, month } = getNextMonth(currentYear, currentMonth);
    setCurrentYear(year);
    setCurrentMonth(month);

    // Haptic feedback
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
  };

  /**
   * Handle touch start for swipe gesture
   */
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  /**
   * Handle touch move for swipe gesture
   */
  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  /**
   * Handle touch end - detect swipe and change month
   */
  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // Minimum distance to trigger swipe

    if (Math.abs(swipeDistance) < minSwipeDistance) {
      setTouchStartX(0);
      setTouchEndX(0);
      return;
    }

    if (swipeDistance > 0) {
      // Swiped left - go to next month
      handleNextMonth();
    } else {
      // Swiped right - go to previous month
      handlePreviousMonth();
    }

    setTouchStartX(0);
    setTouchEndX(0);
  };

  /**
   * Group planned sessions by date
   * Returns array of { date, sessions[] } objects sorted by date (upcoming first)
   */
  const groupedSessions = useMemo(() => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    plannedSessions.forEach((session) => {
      const dateKey = session.date;
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          dateObj: new Date(dateKey),
          sessions: [],
        };
      }
      groups[dateKey].sessions.push(session);
    });

    // Convert to array and sort by date (upcoming first)
    const sortedGroups = Object.values(groups).sort((a, b) => a.dateObj - b.dateObj);

    // Separate overdue and upcoming
    const overdue = sortedGroups.filter((group) => group.dateObj < today);
    const upcoming = sortedGroups.filter((group) => group.dateObj >= today);

    // Overdue first, then upcoming
    return [...overdue, ...upcoming];
  }, [plannedSessions]);

  /**
   * Format date for display (Today, Tomorrow, or formatted date)
   */
  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Normalize times to compare dates only
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === today.getTime()) {
      return t('dateLabels.today');
    } else if (sessionDate.getTime() === tomorrow.getTime()) {
      return t('dateLabels.tomorrow');
    } else {
      // Format as "Mon, Jan 6"
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  /**
   * Check if a date group is overdue
   */
  const isDateOverdue = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="workout-planner-container">
      {/* Header */}
      <header className="workout-planner-header">
        <button
          className="btn-back"
          onClick={onBack}
          aria-label="Go back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="header-content">
          <h1 className="header-title">{t('title')}</h1>
          <p className="header-subtitle">{t('subtitle')}</p>
        </div>

        <button
          className="btn-info"
          onClick={() => setShowInfoModal(true)}
          aria-label="Planning features info"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="workout-planner-main">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('loading')}</p>
          </div>
        ) : (
          <>
            {/* Calendar Section */}
            <section className="calendar-section">
              <div
                className="calendar-wrapper"
                ref={calendarRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <MiniCalendar sessions={allSessions} />
              </div>
            </section>

            {/* Quick Actions Bar */}
            <section className="quick-actions-bar">
              <button
                className="quick-action-btn quick-action-btn-secondary"
                onClick={() => setShowQuickPlanModal(true)}
              >
                <span className="quick-action-icon">⚡</span>
                <span className="quick-action-text">{t('quickActions.quickPlan')}</span>
              </button>

              <button
                className="quick-action-btn quick-action-btn-primary"
                onClick={() => {
                  setEditSession(null);
                  setShowPlanModal(true);
                }}
              >
                <span className="quick-action-icon">➕</span>
                <span className="quick-action-text">{t('quickActions.planWorkout')}</span>
              </button>

              <div className="month-navigation">
                <button
                  className="month-nav-btn"
                  onClick={handlePreviousMonth}
                  aria-label="Previous month"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                <span className="month-display">
                  {getMonthName(currentMonth)} {currentYear}
                </span>

                <button
                  className="month-nav-btn"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </section>

            {/* Planned Sessions List */}
            <section className="planned-sessions-section">
              <div className="section-header">
                <h2 className="section-title">
                  {t('sessions.title')}
                  {plannedSessions.length > 0 && (
                    <span className="session-count">{plannedSessions.length}</span>
                  )}
                </h2>

                {plannedSessions.length > 0 && (
                  <button
                    className="bulk-actions-trigger"
                    onClick={() => setShowBulkActionsMenu(!showBulkActionsMenu)}
                    aria-label="Bulk actions"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Pull to Refresh Indicator */}
              {refreshing && (
                <div className="refresh-indicator">
                  <div className="refresh-spinner"></div>
                  <span>{t('refreshing')}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Grouped Sessions List */}
              {groupedSessions.length > 0 ? (
                <div className="sessions-list">
                  {groupedSessions.map((group) => (
                    <div key={group.date} className="session-date-group">
                      <div className={`date-header ${isDateOverdue(group.date) ? 'overdue' : ''}`}>
                        <span className="date-label">{formatDateHeader(group.date)}</span>
                        <span className="date-count">{t('sessions.count', { count: group.sessions.length })}</span>
                      </div>

                      <div className="sessions-grid">
                        {group.sessions.map((session) => (
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3 className="empty-title">{t('empty.title')}</h3>
                  <p className="empty-message">
                    {t('empty.message')}
                  </p>
                  <button
                    className="btn-primary-cta"
                    onClick={() => setShowPlanModal(true)}
                  >
                    <span>{t('empty.action')}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Bulk Actions Bottom Sheet */}
      {showBulkActionsMenu && (
        <div className="bulk-actions-backdrop" onClick={() => setShowBulkActionsMenu(false)}>
          <div className="bulk-actions-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-actions-header">
              <h3>{t('bulkActions.title')}</h3>
              <button
                className="bulk-actions-close"
                onClick={() => setShowBulkActionsMenu(false)}
                aria-label={t('bulkActions.close')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="bulk-actions-list">
              <button
                className="bulk-action-item bulk-action-danger"
                onClick={handleClearThisWeek}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                <span>{t('bulkActions.clearWeek')}</span>
              </button>

              <button
                className="bulk-action-item bulk-action-danger"
                onClick={handleClearThisMonth}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{t('bulkActions.clearMonth', { month: getMonthName(currentMonth) })}</span>
              </button>

              <button
                className="bulk-action-item bulk-action-critical"
                onClick={handleDeleteAllPlanned}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span>{t('bulkActions.deleteAll', { count: plannedSessions.length })}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="info-modal-backdrop" onClick={() => setShowInfoModal(false)}>
          <div className="info-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="info-modal-header">
              <h3>{t('infoModal.title')}</h3>
              <button
                className="info-modal-close"
                onClick={() => setShowInfoModal(false)}
                aria-label={t('infoModal.close')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="info-modal-body">
              <div className="info-section">
                <h4>📅 {t('infoModal.features.planWorkout.title')}</h4>
                <p>{t('infoModal.features.planWorkout.description')}</p>
              </div>

              <div className="info-section">
                <h4>⚡ {t('infoModal.features.quickPlan.title')}</h4>
                <p>{t('infoModal.features.quickPlan.description')}</p>
              </div>

              <div className="info-section">
                <h4>🗓️ {t('infoModal.features.calendar.title')}</h4>
                <p>{t('infoModal.features.calendar.description')}</p>
              </div>

              <div className="info-section">
                <h4>🎯 {t('infoModal.features.sessionManagement.title')}</h4>
                <p>{t('infoModal.features.sessionManagement.description')}</p>
              </div>

              <div className="info-section">
                <h4>🗑️ {t('infoModal.features.bulkActions.title')}</h4>
                <p>{t('infoModal.features.bulkActions.description')}</p>
              </div>
            </div>

            <button
              className="info-modal-close-btn"
              onClick={() => setShowInfoModal(false)}
            >
              {t('infoModal.gotIt')}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <PlanWorkoutModal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setEditSession(null);
        }}
        onSuccess={handlePlanSuccess}
        editSession={editSession}
        initialDate={selectedDate || ''}
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
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message')}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('deleteDialog.cancel')}
        variant="danger"
      />
    </div>
  );
}

export default WorkoutPlanner;
