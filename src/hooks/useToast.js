import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

/**
 * useToast Hook
 *
 * Custom hook for accessing toast notification functionality.
 * Must be used within a ToastProvider.
 *
 * @returns {Object} Toast context methods
 * @returns {Array} return.toasts - Array of active toasts
 * @returns {Function} return.showToast - Show a new toast
 * @returns {Function} return.dismissToast - Dismiss a specific toast
 * @returns {Function} return.clearAllToasts - Clear all toasts
 *
 * @example
 * const { showToast } = useToast();
 *
 * showToast({
 *   type: 'success',
 *   message: 'Workout removed',
 *   duration: 3000
 * });
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
