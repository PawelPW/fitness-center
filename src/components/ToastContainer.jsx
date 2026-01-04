import React from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import './ToastContainer.css';

/**
 * ToastContainer Component
 *
 * Container for rendering all active toast notifications.
 * Positioned at bottom-center on mobile, top-right on desktop.
 * Stacks multiple toasts vertically.
 */
function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onDismiss={dismissToast}
          action={toast.action}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
