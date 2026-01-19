import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isOverdue } from '../utils/calendarHelpers';
import './PlannedSessionCard.css';

/**
 * PlannedSessionCard Component
 *
 * Displays a planned (not completed) workout session with futuristic glassmorphism design.
 * Features outlined card style, overdue detection, and comprehensive action buttons.
 *
 * @component
 * @example
 * <PlannedSessionCard
 *   session={plannedSession}
 *   onStartWorkout={(session) => startWorkout(session)}
 *   onEdit={(session) => openEditModal(session)}
 *   onDelete={(id) => deletePlannedSession(id)}
 *   onCardClick={(session) => showDetails(session)}
 * />
 */
const PlannedSessionCard = ({
  session,
  onStartWorkout,
  onEdit,
  onDelete,
  onCardClick,
  showActions = true,
}) => {
  const { t } = useTranslation('workoutPlanner');
  const [isPressed, setIsPressed] = useState(false);

  // Validate session data
  if (!session || !session.id) {
    console.warn('PlannedSessionCard: Invalid session data provided');
    return null;
  }

  // Check if session is overdue
  const overdueStatus = isOverdue(session);

  // Training type icon mapping
  const getTrainingIcon = (type) => {
    const typeMap = {
      'cardio': '🏃',
      'strength': '💪',
      'calisthenics': '🤸',
      'boxing': '🥊',
      'swimming': '🏊',
      'yoga': '🧘',
      'hiit': '⚡',
      'cycling': '🚴',
      'running': '🏃',
      'default': '🏋️'
    };

    const normalizedType = type?.toLowerCase().trim() || '';
    return typeMap[normalizedType] || typeMap['default'];
  };

  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return t('card.dateNotSet');

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return t('card.invalidDate');
      }

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
        // Format as "Jan 15, 2026"
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return t('card.invalidDate');
    }
  };

  // Format time display
  const formatTime = (timeString) => {
    if (!timeString) return t('card.allDay');

    try {
      // Handle HH:MM format (24-hour)
      const [hours, minutes] = timeString.split(':').map(Number);

      if (isNaN(hours) || isNaN(minutes)) {
        return t('card.allDay');
      }

      // Convert to 12-hour format with AM/PM
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');

      return `${displayHours}:${displayMinutes} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return t('card.allDay');
    }
  };

  // Truncate notes to 2 lines (approximately 100 characters)
  const truncateNotes = (notes) => {
    if (!notes) return null;

    const maxLength = 100;
    if (notes.length <= maxLength) return notes;

    return notes.substring(0, maxLength).trim() + '...';
  };

  // FE-6: Truncate program names (max 30 characters)
  const truncateProgramName = (name) => {
    if (!name) return null;

    const maxLength = 30;
    if (name.length <= maxLength) return name;

    return name.substring(0, maxLength).trim() + '...';
  };

  // Handle card click
  const handleCardClick = (e) => {
    // Trigger haptic feedback if available (Capacitor)
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }

    if (onCardClick) {
      onCardClick(session);
    }
  };

  // Handle button clicks (stop propagation to prevent card click)
  const handleButtonClick = (e, callback, ...args) => {
    e.stopPropagation();

    // Trigger haptic feedback
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'medium' });
    }

    if (callback) {
      callback(...args);
    }
  };

  // Touch handlers for press animation
  const handleTouchStart = () => setIsPressed(true);
  const handleTouchEnd = () => setIsPressed(false);

  const displayedNotes = truncateNotes(session.notes);
  const icon = getTrainingIcon(session.type);

  return (
    <article
      className={`planned-session-card ${overdueStatus ? 'is-overdue' : ''} ${isPressed ? 'is-pressed' : ''}`}
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
      }}
      aria-label={`Planned ${session.type || 'workout'} session on ${formatDate(session.date)}`}
    >
      {/* Header: Icon, Type, Overdue Badge */}
      <div className="planned-session-card__header">
        <div className="planned-session-card__icon-wrapper">
          <span
            className={`planned-session-card__icon ${overdueStatus ? 'is-overdue' : ''}`}
            role="img"
            aria-label={`${session.type || 'workout'} icon`}
          >
            {icon}
          </span>
        </div>

        <div className="planned-session-card__header-content">
          <h3 className="planned-session-card__type">
            {session.type || 'Workout'}
          </h3>

          {/* FE-6: Program badge - shows associated program name and exercise count */}
          {session?.program_name && (
            <div className="planned-session-card__program-badge">
              <span className="planned-session-card__program-icon" role="img" aria-hidden="true">
                📋
              </span>
              <span className="planned-session-card__program-name">
                {truncateProgramName(session.program_name)}
              </span>
              {session?.program_exercise_count && (
                <span className="planned-session-card__program-count">
                  {t('card.exercises', { count: session.program_exercise_count })}
                </span>
              )}
            </div>
          )}

          {overdueStatus && (
            <span className="planned-session-card__overdue-badge" role="status">
              {t('dateLabels.overdue')}
            </span>
          )}
        </div>
      </div>

      {/* Body: Date, Time, Notes */}
      <div className="planned-session-card__body">
        <div className="planned-session-card__datetime">
          <div className="planned-session-card__date">
            <span className="planned-session-card__date-icon" role="img" aria-hidden="true">
              📅
            </span>
            <span className="planned-session-card__date-text">
              {formatDate(session.date)}
            </span>
          </div>

          <div className="planned-session-card__time">
            <span className="planned-session-card__time-icon" role="img" aria-hidden="true">
              ⏰
            </span>
            <span className="planned-session-card__time-text">
              {formatTime(session.scheduled_time)}
            </span>
          </div>
        </div>

        {displayedNotes && (
          <div className="planned-session-card__notes">
            <span className="planned-session-card__notes-icon" role="img" aria-hidden="true">
              📝
            </span>
            <p className="planned-session-card__notes-text">
              {displayedNotes}
            </p>
          </div>
        )}
      </div>

      {/* Footer: Action Buttons */}
      {showActions && (
        <div className="planned-session-card__footer">
          <button
            className="planned-session-card__btn planned-session-card__btn--primary"
            onClick={(e) => handleButtonClick(e, onStartWorkout, session)}
            aria-label={`Start ${session.type || 'workout'} workout`}
          >
            <span className="planned-session-card__btn-icon" role="img" aria-hidden="true">
              ▶️
            </span>
            {t('card.startWorkout')}
          </button>

          <button
            className="planned-session-card__btn planned-session-card__btn--secondary"
            onClick={(e) => handleButtonClick(e, onEdit, session)}
            aria-label={`Edit ${session.type || 'workout'} session`}
          >
            <span className="planned-session-card__btn-icon" role="img" aria-hidden="true">
              ✏️
            </span>
            {t('card.edit')}
          </button>

          <button
            className="planned-session-card__btn planned-session-card__btn--danger"
            onClick={(e) => handleButtonClick(e, onDelete, session.id)}
            aria-label={`Delete ${session.type || 'workout'} session`}
          >
            <span className="planned-session-card__btn-icon" role="img" aria-hidden="true">
              🗑️
            </span>
            {t('card.delete')}
          </button>
        </div>
      )}
    </article>
  );
};

export default PlannedSessionCard;
