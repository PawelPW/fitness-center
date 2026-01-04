import React, { useState, useEffect } from 'react';
import apiService from '../services/api.js';
import { useToast } from '../hooks/useToast';
import './PlanWorkoutModal.css';

/**
 * PlanWorkoutModal Component
 *
 * Modal component for scheduling and editing future workouts with futuristic glassmorphism design.
 * Uses native HTML5 date/time pickers for optimal mobile experience on iOS/Android.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Control modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Function} props.onSuccess - Callback with created/updated session data
 * @param {string} [props.initialDate] - Optional: pre-fill date (YYYY-MM-DD) for create mode
 * @param {string} [props.initialType] - Optional: pre-fill training type for create mode
 * @param {Object|null} [props.editSession] - Optional: session object to edit (if provided, enables edit mode)
 * @param {string} props.editSession.id - Session ID to update
 * @param {string} props.editSession.type - Training type
 * @param {string} props.editSession.date - Session date (YYYY-MM-DD)
 * @param {string} [props.editSession.scheduled_time] - Scheduled time (HH:MM)
 * @param {string} [props.editSession.notes] - Session notes
 */
function PlanWorkoutModal({ isOpen, onClose, onSuccess, initialDate = '', initialType = '', editSession = null }) {
  const { showToast } = useToast();

  // Determine if we're in edit mode (editSession has an id)
  const isEditMode = editSession && editSession.id;
  // Form state
  const [formData, setFormData] = useState({
    type: initialType,
    date: initialDate,
    time: '',
    notes: ''
  });

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Training type options
  const trainingTypes = [
    { value: '', label: 'Select training type', disabled: true },
    { value: 'Cardio', label: 'Cardio', icon: '🏃' },
    { value: 'Strength', label: 'Strength', icon: '💪' },
    { value: 'Calisthenics', label: 'Calisthenics', icon: '🤸' },
    { value: 'Boxing', label: 'Boxing', icon: '🥊' },
    { value: 'Swimming', label: 'Swimming', icon: '🏊' }
  ];

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Reset form when modal opens/closes or when switching between create/edit modes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        // Edit mode: Pre-populate form fields from editSession
        setFormData({
          type: editSession.type || '',
          date: editSession.date || '',
          time: editSession.scheduled_time || '',
          notes: editSession.notes || ''
        });
      } else {
        // Create mode: Use initial props or empty values
        setFormData({
          type: initialType,
          date: initialDate,
          time: '',
          notes: ''
        });
      }
      setErrors({});
      setApiError('');
    }
  }, [isOpen, initialDate, initialType, editSession, isEditMode]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    // Training type is required
    if (!formData.type) {
      newErrors.type = 'Please select a training type';
    }

    // Date is required and must be today or in the future
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = 'Date must be today or in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      // Prepare session data for API
      const sessionData = {
        type: formData.type,
        date: formData.date,
        notes: formData.notes.trim() || undefined
      };

      // If time is provided, combine it with date (optional feature)
      if (formData.time) {
        sessionData.scheduled_time = formData.time;
      }

      // Call appropriate API method based on mode
      let resultSession;
      if (isEditMode) {
        // Edit mode: Update existing planned session
        resultSession = await apiService.updatePlannedSession(editSession.id, sessionData);
      } else {
        // Create mode: Create new planned session
        resultSession = await apiService.createPlannedSession(sessionData);
      }

      // Format date for success message
      const dateObj = new Date(formData.date + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Show success toast
      showToast({
        type: 'success',
        message: isEditMode ? 'Workout updated' : 'Workout scheduled',
        duration: 3000
      });

      // Call success callback
      if (onSuccess) {
        onSuccess({
          ...resultSession,
          formattedDate
        });
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} planned session:`, error);

      // Handle validation errors from API
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const fieldErrors = {};
          errorData.errors.forEach(err => {
            if (err.param) {
              fieldErrors[err.param] = err.msg;
            }
          });
          setErrors(fieldErrors);
          setApiError('Please fix the errors above');
        } else {
          setApiError(errorData.error || `Failed to ${isEditMode ? 'update' : 'schedule'} workout`);
        }
      } catch {
        setApiError(`Failed to ${isEditMode ? 'update' : 'schedule'} workout. Please try again.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isSubmitting, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Check if form is valid for submit button
  const isFormValid = formData.type && formData.date;

  return (
    <div className="plan-modal-backdrop" onClick={handleBackdropClick}>
      <div className="plan-modal-container">
        {/* Header */}
        <div className="plan-modal-header">
          <div className="plan-modal-header-content">
            <div className="plan-modal-icon">📅</div>
            <h2 className="plan-modal-title">{isEditMode ? 'Edit Workout' : 'Schedule Workout'}</h2>
          </div>
          <button
            className="plan-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form className="plan-modal-form" onSubmit={handleSubmit} noValidate>
          {/* Training Type */}
          <div className="plan-form-group">
            <label htmlFor="workout-type" className="plan-form-label label-required">
              Training Type
            </label>
            <select
              id="workout-type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`plan-form-select ${errors.type ? 'error' : ''}`}
              disabled={isSubmitting}
              required
            >
              {trainingTypes.map(option => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.icon ? `${option.icon} ${option.label}` : option.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <span className="plan-form-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {errors.type}
              </span>
            )}
          </div>

          {/* Date Picker */}
          <div className="plan-form-group">
            <label htmlFor="workout-date" className="plan-form-label label-required">
              Date
            </label>
            <input
              type="date"
              id="workout-date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={getTodayDate()}
              className={`plan-form-input ${errors.date ? 'error' : ''}`}
              disabled={isSubmitting}
              required
            />
            {errors.date && (
              <span className="plan-form-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {errors.date}
              </span>
            )}
          </div>

          {/* Time Picker (Optional) */}
          <div className="plan-form-group">
            <label htmlFor="workout-time" className="plan-form-label">
              Time (Optional)
            </label>
            <input
              type="time"
              id="workout-time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="plan-form-input"
              disabled={isSubmitting}
            />
            <span className="plan-form-hint">
              Set a specific time for your workout
            </span>
          </div>

          {/* Notes Textarea (Optional) */}
          <div className="plan-form-group">
            <label htmlFor="workout-notes" className="plan-form-label">
              Notes (Optional)
            </label>
            <textarea
              id="workout-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes or goals for this workout..."
              rows="3"
              maxLength="500"
              className="plan-form-textarea"
              disabled={isSubmitting}
            />
            <span className="plan-form-hint">
              {formData.notes.length}/500 characters
            </span>
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="plan-form-api-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="plan-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="plan-btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="plan-btn-primary"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="plan-btn-spinner"></span>
                  {isEditMode ? 'Updating...' : 'Scheduling...'}
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  {isEditMode ? 'Update Workout' : 'Schedule Workout'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlanWorkoutModal;
