import React from 'react';
import { useTranslation } from 'react-i18next';
import './RestTimer.css';

function RestTimer({
  isActive,
  remaining,
  duration,
  formattedTime,
  onSkip,
  onAddTime,
  onStartManually,
}) {
  const { t } = useTranslation('workout');
  const progressPercentage = duration > 0 ? (remaining / duration) * 100 : 0;
  const isAlmostDone = remaining <= 10 && remaining > 0;

  if (!isActive && !onStartManually) {
    return null;
  }

  return (
    <div className={`rest-timer ${isActive ? 'active' : 'inactive'} ${isAlmostDone ? 'almost-done' : ''}`}>
      {!isActive ? (
        /* Manual Start Option */
        <div className="rest-timer-start">
          <p className="rest-timer-prompt">{t('restTimer.prompt')}</p>
          <button
            className="start-rest-btn"
            onClick={onStartManually}
            type="button"
          >
            <span className="btn-icon">⏱️</span>
            {t('restTimer.startRest', { duration })}
          </button>
        </div>
      ) : (
        /* Active Rest Timer */
        <>
          <div className="rest-timer-header">
            <span className="rest-timer-label">{t('restTimer.label')}</span>
            <span className={`rest-timer-time ${isAlmostDone ? 'pulsing' : ''}`}>
              {formattedTime}
            </span>
          </div>

          {/* Circular Progress Indicator */}
          <div className="rest-timer-progress">
            <svg className="progress-ring" width="120" height="120" viewBox="0 0 120 120">
              <circle
                className="progress-ring-bg"
                cx="60"
                cy="60"
                r="52"
              />
              <circle
                className="progress-ring-fill"
                cx="60"
                cy="60"
                r="52"
                style={{
                  strokeDashoffset: 327 - (327 * progressPercentage) / 100,
                }}
              />
            </svg>
            <div className="progress-ring-text">
              {remaining > 0 ? t('restTimer.seconds', { count: remaining }) : t('restTimer.done')}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="rest-timer-actions">
            <button
              className="rest-action-btn skip-btn"
              onClick={onSkip}
              type="button"
            >
              <span className="btn-icon">⏭️</span>
              {t('restTimer.skipRest')}
            </button>
            <button
              className="rest-action-btn add-time-btn"
              onClick={() => onAddTime(30)}
              type="button"
            >
              <span className="btn-icon">➕</span>
              {t('restTimer.addTime')}
            </button>
          </div>

          {remaining === 0 && (
            <div className="rest-complete-message">
              <span className="complete-icon">✓</span>
              {t('restTimer.restComplete')}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RestTimer;
