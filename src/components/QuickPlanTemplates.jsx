import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api.js';
import { useToast } from '../hooks/useToast';
import { formatDateKey } from '../utils/calendarHelpers.js';
import { logger } from '../utils/logger';
import './QuickPlanTemplates.css';

/**
 * QuickPlanTemplates Component
 *
 * Advanced workout planning modal with AI-powered smart template generation.
 * Features futuristic glassmorphism design, editable preview cards, and bulk session creation.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Control modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSuccess - Callback with created sessions array
 * @param {string} [props.initialDuration='1week'] - Pre-select duration ('1week', '2weeks', '1month')
 */
function QuickPlanTemplates({ isOpen, onClose, onSuccess, initialDuration = '1week' }) {
  const { t } = useTranslation('workoutPlanner');
  const { showToast } = useToast();

  // State management
  const [duration, setDuration] = useState(initialDuration);
  const [mode, setMode] = useState('default'); // 'default' or 'smart'
  const [generatedSessions, setGeneratedSessions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingProgress, setCreatingProgress] = useState(0);
  const [error, setError] = useState('');
  const [hasTrainingHistory, setHasTrainingHistory] = useState(true);

  // Training type options with icons
  const trainingTypes = [
    { value: 'Cardio', label: t('trainingTypes.cardio'), icon: '🏃' },
    { value: 'Strength', label: t('trainingTypes.strength'), icon: '💪' },
    { value: 'Calisthenics', label: t('trainingTypes.calisthenics'), icon: '🤸' },
    { value: 'Boxing', label: t('trainingTypes.boxing'), icon: '🥊' },
    { value: 'Swimming', label: t('trainingTypes.swimming'), icon: '🏊' }
  ];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDuration(initialDuration);
      setMode('default');
      setGeneratedSessions([]);
      setEditingIndex(null);
      setError('');
      generateTemplate('default', initialDuration);
      checkTrainingHistory();
    }
  }, [isOpen, initialDuration]);

  // Check if user has training history for smart mode
  const checkTrainingHistory = async () => {
    try {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const allSessions = await apiService.getAllSessions({ completed: true });
      const recentSessions = allSessions.sessions.filter(s => new Date(s.date) >= fourWeeksAgo);

      setHasTrainingHistory(recentSessions.length >= 3);
    } catch (err) {
      logger.error('Error checking training history:', err);
      setHasTrainingHistory(false);
    }
  };

  // Generate default template (Mon/Wed/Fri pattern)
  const generateDefaultTemplate = (selectedDuration) => {
    const sessions = [];
    const daysCount = selectedDuration === '1week' ? 7 : selectedDuration === '2weeks' ? 14 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Start tomorrow

    // Training days: Monday (1), Wednesday (3), Friday (5)
    const trainingDays = [1, 3, 5];
    const types = ['Strength', 'Cardio'];

    for (let i = 0; i < daysCount; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();

      if (trainingDays.includes(dayOfWeek)) {
        // Alternate types: Strength → Cardio → Strength → Cardio
        const type = types[sessions.length % types.length];
        sessions.push({
          type,
          date: formatDateKey(date),
          scheduled_time: '',
          notes: '',
          id: `temp-${Date.now()}-${i}` // Temporary ID for editing
        });
      }
    }

    return sessions;
  };

  // Generate smart template based on user's training history
  const generateSmartTemplate = async (selectedDuration) => {
    try {
      // 1. Fetch past 4 weeks of completed sessions
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const allSessions = await apiService.getAllSessions({ completed: true });
      const recentSessions = allSessions.sessions.filter(s => new Date(s.date) >= fourWeeksAgo);

      if (recentSessions.length === 0) {
        // No history, fall back to default
        return generateDefaultTemplate(selectedDuration);
      }

      // 2. Analyze patterns - which days user trains
      const dayFrequency = {}; // { 0: 5, 1: 8, 3: 7, 5: 8 }
      const typeFrequency = {}; // { Strength: 12, Cardio: 11 }

      recentSessions.forEach(session => {
        const day = new Date(session.date).getDay(); // 0-6 (Sunday-Saturday)
        dayFrequency[day] = (dayFrequency[day] || 0) + 1;

        typeFrequency[session.type] = (typeFrequency[session.type] || 0) + 1;
      });

      // 3. Find top 3 training days
      const topDays = Object.entries(dayFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([day]) => parseInt(day));

      // 4. Find top 2 training types
      const topTypes = Object.entries(typeFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([type]) => type);

      // If only one type, duplicate it
      if (topTypes.length === 1) {
        topTypes.push(topTypes[0]);
      }

      // 5. Generate sessions for selected duration
      const sessions = [];
      const daysCount = selectedDuration === '1week' ? 7 : selectedDuration === '2weeks' ? 14 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1); // Start tomorrow

      for (let i = 0; i < daysCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();

        // If this day is in top training days
        if (topDays.includes(dayOfWeek)) {
          // Alternate between top types
          const type = topTypes[sessions.length % topTypes.length];
          sessions.push({
            type,
            date: formatDateKey(date),
            scheduled_time: '',
            notes: '',
            id: `temp-${Date.now()}-${i}`
          });
        }
      }

      return sessions;
    } catch (err) {
      logger.error('Error generating smart template:', err);
      // Fall back to default template on error
      return generateDefaultTemplate(selectedDuration);
    }
  };

  // Generate template based on current mode
  const generateTemplate = async (selectedMode, selectedDuration) => {
    setIsGenerating(true);
    setError('');

    try {
      let sessions;
      if (selectedMode === 'smart' && hasTrainingHistory) {
        sessions = await generateSmartTemplate(selectedDuration);
      } else {
        sessions = generateDefaultTemplate(selectedDuration);
      }

      setGeneratedSessions(sessions);
    } catch (err) {
      logger.error('Error generating template:', err);
      setError(t('quickPlan.errors.generateFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle duration change
  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    generateTemplate(mode, newDuration);

    // Haptic feedback
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
  };

  // Handle mode toggle
  const handleModeChange = (newMode) => {
    if (newMode === 'smart' && !hasTrainingHistory) {
      setError(t('quickPlan.errors.smartModeRequirement'));
      return;
    }

    setMode(newMode);
    generateTemplate(newMode, duration);

    // Haptic feedback
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'medium' });
    }
  };

  // Handle session edit
  const handleSessionEdit = (index, field, value) => {
    const updated = [...generatedSessions];
    updated[index] = { ...updated[index], [field]: value };
    setGeneratedSessions(updated);
  };

  // Handle session delete
  const handleSessionDelete = (index) => {
    const updated = generatedSessions.filter((_, i) => i !== index);
    setGeneratedSessions(updated);

    // Haptic feedback
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'heavy' });
    }
  };

  // Format date for display (e.g., "Mon, Jan 13")
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Group sessions by week
  const groupSessionsByWeek = () => {
    if (generatedSessions.length === 0) return [];

    const weeks = [];
    let currentWeek = [];
    let weekNumber = 1;

    generatedSessions.forEach((session, index) => {
      currentWeek.push({ ...session, index });

      // Start new week every 7 sessions or at end
      if ((index + 1) % 7 === 0 || index === generatedSessions.length - 1) {
        weeks.push({
          weekNumber,
          sessions: currentWeek
        });
        currentWeek = [];
        weekNumber++;
      }
    });

    return weeks;
  };

  // Handle form submission - bulk create sessions
  const handleSubmit = async () => {
    if (generatedSessions.length === 0) {
      setError(t('quickPlan.errors.noSessions'));
      return;
    }

    setIsSubmitting(true);
    setCreatingProgress(0);
    setError('');

    try {
      // Prepare sessions for API (remove temporary IDs)
      const sessionsToCreate = generatedSessions.map(session => ({
        type: session.type,
        date: session.date,
        scheduled_time: session.scheduled_time || undefined,
        notes: session.notes || undefined
      }));

      // Simulate progress for bulk create
      const progressInterval = setInterval(() => {
        setCreatingProgress(prev => {
          const next = prev + 10;
          return next > 90 ? 90 : next;
        });
      }, 100);

      // Call bulk create API
      const result = await apiService.bulkCreatePlannedSessions(sessionsToCreate);

      clearInterval(progressInterval);
      setCreatingProgress(100);

      // Haptic success feedback
      if (window.Capacitor?.Plugins?.Haptics) {
        window.Capacitor.Plugins.Haptics.notification({ type: 'success' });
      }

      // Show success toast
      showToast({
        type: 'success',
        message: t('quickPlan.toast.created', { count: result.count }),
        duration: 3000
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(result.sessions);
      }

      // Close modal
      onClose();
    } catch (err) {
      logger.error('Failed to create sessions:', err);

      // Parse error message
      let errorMessage = t('errors.createFailed');
      let errorCode = null;

      try {
        const errorData = JSON.parse(err.message);
        errorCode = errorData.code;

        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          // Show first validation error
          errorMessage = errorData.errors[0].msg || errorMessage;
        }
      } catch {
        // Use default error message
      }

      setError(errorMessage);

      // Show error toast with retry action for network errors
      const isNetworkError = errorCode === 'TIMEOUT' || errorCode === 'OFFLINE' || errorCode === 'NETWORK_ERROR';

      showToast({
        type: 'error',
        message: errorMessage,
        duration: isNetworkError ? 0 : 5000, // Don't auto-dismiss network errors
        action: isNetworkError ? {
          label: t('toast.retry'),
          onClick: () => handleSubmit()
        } : null
      });

      // Haptic error feedback
      if (window.Capacitor?.Plugins?.Haptics) {
        window.Capacitor.Plugins.Haptics.notification({ type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
      setCreatingProgress(0);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isSubmitting, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  const weekGroups = groupSessionsByWeek();

  return (
    <div className="qpt-backdrop" onClick={handleBackdropClick}>
      <div className="qpt-container">
        {/* Header */}
        <div className="qpt-header">
          <div className="qpt-header-content">
            <div className="qpt-icon">⚡</div>
            <div className="qpt-header-text">
              <h2 className="qpt-title">{t('quickPlan.title')}</h2>
              <p className="qpt-subtitle">{t('quickPlan.subtitle')}</p>
            </div>
          </div>
          <button
            className="qpt-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t('quickPlan.close')}
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="qpt-content">
          {/* Time Horizon Selector */}
          <div className="qpt-section">
            <label className="qpt-section-label">{t('quickPlan.timeHorizon')}</label>
            <div className="qpt-pill-group">
              <button
                type="button"
                className={`qpt-pill ${duration === '1week' ? 'active' : ''}`}
                onClick={() => handleDurationChange('1week')}
                disabled={isSubmitting || isGenerating}
              >
                {t('quickPlan.duration.oneWeek')}
              </button>
              <button
                type="button"
                className={`qpt-pill ${duration === '2weeks' ? 'active' : ''}`}
                onClick={() => handleDurationChange('2weeks')}
                disabled={isSubmitting || isGenerating}
              >
                {t('quickPlan.duration.twoWeeks')}
              </button>
              <button
                type="button"
                className={`qpt-pill ${duration === '1month' ? 'active' : ''}`}
                onClick={() => handleDurationChange('1month')}
                disabled={isSubmitting || isGenerating}
              >
                {t('quickPlan.duration.oneMonth')}
              </button>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="qpt-section">
            <label className="qpt-section-label">{t('quickPlan.templateMode')}</label>
            <div className="qpt-pill-group">
              <button
                type="button"
                className={`qpt-pill ${mode === 'default' ? 'active' : ''}`}
                onClick={() => handleModeChange('default')}
                disabled={isSubmitting || isGenerating}
              >
                <span className="qpt-pill-icon">📅</span>
                {t('quickPlan.modes.default')}
              </button>
              <button
                type="button"
                className={`qpt-pill ${mode === 'smart' ? 'active' : ''}`}
                onClick={() => handleModeChange('smart')}
                disabled={isSubmitting || isGenerating || !hasTrainingHistory}
                title={!hasTrainingHistory ? t('quickPlan.modes.smartLocked') : ''}
              >
                <span className="qpt-pill-icon">🧠</span>
                {t('quickPlan.modes.smart')}
                {!hasTrainingHistory && <span className="qpt-pill-badge">🔒</span>}
              </button>
            </div>
            {mode === 'smart' && hasTrainingHistory && (
              <p className="qpt-mode-hint">{t('quickPlan.modes.smartHint')}</p>
            )}
          </div>

          {/* Preview List */}
          <div className="qpt-section">
            <label className="qpt-section-label">
              {t('quickPlan.preview.title')} ({t('quickPlan.preview.count', { count: generatedSessions.length })})
            </label>

            {isGenerating ? (
              <div className="qpt-loading">
                <div className="qpt-spinner"></div>
                <p>{t('quickPlan.preview.generating')}</p>
              </div>
            ) : generatedSessions.length === 0 ? (
              <div className="qpt-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p>{t('quickPlan.preview.noSessions')}</p>
              </div>
            ) : (
              <div className="qpt-preview-list">
                {weekGroups.map((week) => (
                  <div key={week.weekNumber} className="qpt-week-group">
                    <div className="qpt-week-header">{t('quickPlan.preview.week', { number: week.weekNumber })}</div>
                    {week.sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`qpt-session-card ${editingIndex === session.index ? 'editing' : ''}`}
                      >
                        {editingIndex === session.index ? (
                          // Edit Mode
                          <div className="qpt-session-edit">
                            <div className="qpt-edit-row">
                              <select
                                value={session.type}
                                onChange={(e) => handleSessionEdit(session.index, 'type', e.target.value)}
                                className="qpt-edit-select"
                              >
                                {trainingTypes.map(t => (
                                  <option key={t.value} value={t.value}>
                                    {t.icon} {t.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="date"
                                value={session.date}
                                onChange={(e) => handleSessionEdit(session.index, 'date', e.target.value)}
                                className="qpt-edit-input"
                              />
                            </div>
                            <div className="qpt-edit-row">
                              <input
                                type="time"
                                value={session.scheduled_time}
                                onChange={(e) => handleSessionEdit(session.index, 'scheduled_time', e.target.value)}
                                placeholder={t('quickPlan.edit.timePlaceholder')}
                                className="qpt-edit-input"
                              />
                              <input
                                type="text"
                                value={session.notes}
                                onChange={(e) => handleSessionEdit(session.index, 'notes', e.target.value)}
                                placeholder={t('quickPlan.edit.notesPlaceholder')}
                                className="qpt-edit-input"
                              />
                            </div>
                            <div className="qpt-edit-actions">
                              <button
                                type="button"
                                onClick={() => setEditingIndex(null)}
                                className="qpt-edit-btn qpt-edit-btn-done"
                              >
                                {t('quickPlan.edit.done')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Display Mode
                          <>
                            <div className="qpt-session-main" onClick={() => setEditingIndex(session.index)}>
                              <div className="qpt-session-type">
                                <span className="qpt-session-icon">
                                  {trainingTypes.find(t => t.value === session.type)?.icon || '💪'}
                                </span>
                                <span className="qpt-session-type-name">{session.type}</span>
                              </div>
                              <div className="qpt-session-details">
                                <div className="qpt-session-date">{formatDisplayDate(session.date)}</div>
                                <div className="qpt-session-time">
                                  {session.scheduled_time || t('card.allDay')}
                                </div>
                              </div>
                              {session.notes && (
                                <div className="qpt-session-notes">{session.notes}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="qpt-session-delete"
                              onClick={() => handleSessionDelete(session.index)}
                              aria-label="Delete session"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="qpt-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="qpt-footer">
          <button
            type="button"
            onClick={onClose}
            className="qpt-btn qpt-btn-secondary"
            disabled={isSubmitting}
          >
            {t('quickPlan.actions.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="qpt-btn qpt-btn-primary"
            disabled={isSubmitting || generatedSessions.length === 0}
          >
            {isSubmitting ? (
              <>
                <span className="qpt-btn-spinner"></span>
                {creatingProgress > 0 && creatingProgress < 100 ? (
                  t('quickPlan.actions.creatingProgress', { progress: Math.round(creatingProgress) })
                ) : (
                  t('quickPlan.actions.creating', { count: generatedSessions.length })
                )}
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {t('quickPlan.actions.confirm', { count: generatedSessions.length })}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickPlanTemplates;
