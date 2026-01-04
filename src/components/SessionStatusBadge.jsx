import React from 'react';
import { isOverdue } from '../utils/calendarHelpers';
import './SessionStatusBadge.css';

/**
 * SessionStatusBadge Component
 *
 * A visual badge indicating workout session status (Completed, Overdue, Planned)
 * with color-coded styling and optional icons/labels.
 *
 * @component
 * @example
 * // Default usage
 * <SessionStatusBadge session={session} />
 *
 * // Small size, icon only
 * <SessionStatusBadge session={session} size="small" showLabel={false} />
 *
 * // Large size with custom className
 * <SessionStatusBadge session={session} size="large" className="my-custom-class" />
 */
const SessionStatusBadge = React.memo(({
  session,
  size = 'medium',
  showIcon = true,
  showLabel = true,
  className = ''
}) => {
  // Determine session status based on completion and date
  const getStatus = () => {
    if (session.completed) return 'completed';
    if (isOverdue(session)) return 'overdue';
    return 'planned';
  };

  // Status configuration with icons, labels, and accessibility
  const statusConfig = {
    completed: {
      icon: '✓',
      label: 'Completed',
      ariaLabel: 'Session completed'
    },
    overdue: {
      icon: '⚠',
      label: 'Overdue',
      ariaLabel: 'Session overdue - not yet completed'
    },
    planned: {
      icon: '📅',
      label: 'Planned',
      ariaLabel: 'Session planned for future'
    }
  };

  const status = getStatus();
  const config = statusConfig[status];

  // Build CSS class names
  const badgeClasses = [
    'session-status-badge',
    `badge-${status}`,
    `badge-size-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span
      className={badgeClasses}
      role="status"
      aria-label={config.ariaLabel}
      title={config.ariaLabel}
    >
      {showIcon && (
        <span className="badge-icon" aria-hidden="true">
          {config.icon}
        </span>
      )}
      {showLabel && (
        <span className="badge-label">
          {config.label}
        </span>
      )}
    </span>
  );
});

// Display name for React DevTools
SessionStatusBadge.displayName = 'SessionStatusBadge';

export default SessionStatusBadge;
