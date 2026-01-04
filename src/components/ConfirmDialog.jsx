import React, { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

/**
 * ConfirmDialog Component
 *
 * Futuristic glassmorphism confirmation dialog with haptic feedback.
 * Supports multiple variants (danger, warning) and customizable buttons.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Control dialog visibility
 * @param {Function} props.onClose - Callback when dialog closes or Cancel is clicked
 * @param {Function} props.onConfirm - Callback when Delete/Confirm is clicked
 * @param {string} props.title - Dialog title (e.g., "Delete Workout?")
 * @param {string} props.message - Confirmation message
 * @param {string} [props.confirmText="Delete"] - Confirm button text
 * @param {string} [props.cancelText="Cancel"] - Cancel button text
 * @param {string} [props.variant="danger"] - Visual variant: "danger" (red) or "warning" (orange)
 */
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
}) {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);

  // Focus trap and ESC key handler
  useEffect(() => {
    if (!isOpen) return;

    // Focus the confirm button when dialog opens
    const focusTimeout = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 100);

    // ESC key handler
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    // Trap focus within dialog
    const handleFocusTrap = (e) => {
      if (!dialogRef.current) return;

      const focusableElements = dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleFocusTrap);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isOpen]);

  // Handle cancel with light haptic feedback
  const handleCancel = () => {
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
    onClose();
  };

  // Handle confirm with heavy haptic feedback
  const handleConfirm = () => {
    if (window.Capacitor?.Plugins?.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'heavy' });
    }
    onConfirm();
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="confirm-dialog-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className={`confirm-dialog confirm-dialog-${variant}`}
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        aria-modal="true"
      >
        {/* Dialog Header */}
        <div className="confirm-dialog-header">
          <h2 id="confirm-dialog-title" className="confirm-dialog-title">
            {title}
          </h2>
        </div>

        {/* Dialog Body */}
        <div className="confirm-dialog-body">
          <p id="confirm-dialog-message" className="confirm-dialog-message">
            {message}
          </p>
        </div>

        {/* Dialog Actions */}
        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-button confirm-dialog-button-cancel"
            onClick={handleCancel}
            aria-label={cancelText}
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            className="confirm-dialog-button confirm-dialog-button-confirm"
            onClick={handleConfirm}
            aria-label={confirmText}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
