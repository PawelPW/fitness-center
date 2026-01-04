import React, { createContext, useState, useCallback } from 'react';

/**
 * ToastContext
 *
 * Context provider for managing toast notifications across the application.
 * Supports multiple simultaneous toasts with auto-dismiss and manual dismiss.
 */
export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Show a new toast notification
   * @param {Object} options - Toast options
   * @param {string} options.type - Toast type: 'success' | 'error' | 'info' | 'warning'
   * @param {string} options.message - Toast message text
   * @param {number} [options.duration=3000] - Auto-dismiss duration in ms (0 = no auto-dismiss)
   * @param {Object} [options.action] - Optional action button
   * @param {string} options.action.label - Action button label (e.g., "Retry")
   * @param {Function} options.action.onClick - Action button callback
   */
  const showToast = useCallback((options) => {
    const id = Date.now() + Math.random(); // Unique ID
    const newToast = {
      id,
      type: options.type || 'info',
      message: options.message,
      duration: options.duration !== undefined ? options.duration : 3000,
      action: options.action || null,
    };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto-dismiss if duration > 0
    if (newToast.duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, newToast.duration);
    }

    // Haptic feedback on show (light)
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
  }, []);

  /**
   * Dismiss a specific toast
   * @param {number} id - Toast ID to dismiss
   */
  const dismissToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}
