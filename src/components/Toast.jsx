import React, { useState, useEffect } from 'react';
import './Toast.css';

/**
 * Toast Component
 *
 * Individual toast notification with swipe-to-dismiss functionality.
 * Supports multiple types: success, error, info, warning
 *
 * @param {Object} props
 * @param {string} props.id - Unique toast ID
 * @param {string} props.type - Toast type: 'success' | 'error' | 'info' | 'warning'
 * @param {string} props.message - Toast message text
 * @param {number} props.duration - Auto-dismiss duration (ms)
 * @param {Function} props.onDismiss - Callback when toast is dismissed
 * @param {Object} [props.action] - Optional action button
 * @param {string} props.action.label - Action button label (e.g., "Retry")
 * @param {Function} props.action.onClick - Action button callback
 */
function Toast({ id, type, message, duration, onDismiss, action }) {
  const [isExiting, setIsExiting] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss progress bar
  useEffect(() => {
    if (duration > 0) {
      const interval = 50; // Update every 50ms
      const decrement = (interval / duration) * 100;

      const timer = setInterval(() => {
        setProgress((prev) => {
          const next = prev - decrement;
          return next > 0 ? next : 0;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [duration]);

  // Handle dismiss with exit animation
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Match animation duration
  };

  // Touch handlers for swipe down to dismiss (mobile)
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart && touchEnd) {
      const swipeDistance = touchEnd - touchStart;
      // Swipe down threshold: 50px
      if (swipeDistance > 50) {
        handleDismiss();
      }
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Get icon based on toast type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  // Get ARIA role based on toast type
  const getRole = () => {
    return type === 'error' || type === 'warning' ? 'alert' : 'status';
  };

  return (
    <div
      className={`toast toast-${type} ${isExiting ? 'toast-exit' : ''}`}
      role={getRole()}
      aria-live="polite"
      aria-atomic="true"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="toast-content">
        <span className="toast-icon" aria-hidden="true">
          {getIcon()}
        </span>
        <span className="toast-message">{message}</span>

        {action && (
          <button
            className="toast-action-button"
            onClick={() => {
              action.onClick();
              handleDismiss();
            }}
            type="button"
          >
            {action.label}
          </button>
        )}

        <button
          className="toast-close"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          type="button"
        >
          <svg
            width="16"
            height="16"
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

      {/* Auto-dismiss progress bar */}
      {duration > 0 && (
        <div className="toast-progress-track">
          <div
            className="toast-progress-bar"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

export default Toast;
