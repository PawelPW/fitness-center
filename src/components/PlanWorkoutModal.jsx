import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('workoutPlanner');
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

  // FE-1: Program selection state
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Training type options
  const trainingTypes = [
    { value: '', label: t('modal.form.trainingTypePlaceholder'), disabled: true },
    { value: 'Cardio', label: t('trainingTypes.cardio'), icon: '🏃' },
    { value: 'Strength', label: t('trainingTypes.strength'), icon: '💪' },
    { value: 'Calisthenics', label: t('trainingTypes.calisthenics'), icon: '🤸' },
    { value: 'Boxing', label: t('trainingTypes.boxing'), icon: '🥊' },
    { value: 'Swimming', label: t('trainingTypes.swimming'), icon: '🏊' }
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
        // FE-1: Pre-populate selectedProgramId in edit mode
        setSelectedProgramId(editSession.training_program_id || null);
      } else {
        // Create mode: Use initial props or empty values
        setFormData({
          type: initialType,
          date: initialDate,
          time: '',
          notes: ''
        });
        // FE-1: Reset program selection in create mode
        setSelectedProgramId(null);
      }
      setErrors({});
      setApiError('');
    } else {
      // FE-1: Cleanup - reset program selection when modal closes
      setSelectedProgramId(null);
      setAvailablePrograms([]);
      setLoadingPrograms(false);
    }
  }, [isOpen, initialDate, initialType, editSession, isEditMode]);

  // FE-2: Fetch programs when training type changes
  useEffect(() => {
    // AbortController for cleanup to prevent race conditions
    const abortController = new AbortController();

    const fetchPrograms = async () => {
      // Clear programs if no type selected
      if (!formData.type) {
        setAvailablePrograms([]);
        return;
      }

      try {
        setLoadingPrograms(true);

        // Fetch programs filtered by training type
        const programs = await apiService.getUserPrograms(formData.type);

        // Only update state if request wasn't aborted (user didn't change type rapidly)
        if (!abortController.signal.aborted) {
          setAvailablePrograms(programs);

          // FE-5: Validate selected program still exists in fetched list
          if (selectedProgramId) {
            const programExists = programs.some(p => p.id === selectedProgramId);
            if (!programExists) {
              // Program was deleted or doesn't match type - clear selection
              setSelectedProgramId(null);
              showToast({
                type: 'warning',
                message: t('modal.form.programWarning'),
                duration: 4000
              });
            }
          }
        }
      } catch (error) {
        // Only handle error if request wasn't aborted
        if (!abortController.signal.aborted) {
          console.error('Failed to fetch programs:', error);
          setAvailablePrograms([]);

          // Show error toast to user
          showToast({
            type: 'error',
            message: t('modal.form.loadProgramsFailed'),
            duration: 3000
          });
        }
      } finally {
        // Only update loading state if request wasn't aborted
        if (!abortController.signal.aborted) {
          setLoadingPrograms(false);
        }
      }
    };

    fetchPrograms();

    // Cleanup: abort fetch if user changes type rapidly
    return () => {
      abortController.abort();
    };
  }, [formData.type, showToast]); // Re-fetch when type changes

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // FE-1: Clear program selection when training type changes (prevents type mismatch)
    if (name === 'type' && value !== formData.type) {
      setSelectedProgramId(null);
    }

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
      newErrors.type = t('modal.validation.typeRequired');
    }

    // Date is required and must be today or in the future
    if (!formData.date) {
      newErrors.date = t('modal.validation.dateRequired');
    } else {
      const selectedDate = new Date(formData.date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = t('modal.validation.dateFuture');
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
        notes: formData.notes.trim() || undefined,
        // FE-1: Include selected program ID (undefined if not selected)
        training_program_id: selectedProgramId || undefined
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
        message: isEditMode ? t('modal.toast.updated') : t('modal.toast.scheduled'),
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

      // FE-4: Handle validation errors from API
      try {
        const errorData = JSON.parse(error.message);

        // FE-4: Handle program-specific validation errors
        if (errorData.field === 'training_program_id') {
          // Program-specific error (404, 403, 400)
          if (errorData.hint) {
            // BE-6: Type mismatch errors include helpful hints
            setApiError(`${errorData.error}. ${errorData.hint}`);
          } else {
            // BE-5: Ownership/existence errors
            setApiError(errorData.error);
          }
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          // Handle array of field-specific errors
          const fieldErrors = {};
          errorData.errors.forEach(err => {
            if (err.param) {
              fieldErrors[err.param] = err.msg;
            }
          });
          setErrors(fieldErrors);
          setApiError(t('modal.validation.fixErrors'));
        } else {
          // Generic error fallback
          setApiError(errorData.error || (isEditMode ? t('modal.errors.updateFailed') : t('modal.errors.scheduleFailed')));
        }
      } catch {
        setApiError(isEditMode ? t('modal.errors.updateFailed') : t('modal.errors.scheduleFailed'));
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
            <h2 className="plan-modal-title">{isEditMode ? t('modal.editTitle') : t('modal.scheduleTitle')}</h2>
          </div>
          <button
            className="plan-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t('modal.close')}
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
              {t('modal.form.trainingType')}
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

          {/* FE-3: Program Dropdown - appears after training type selected */}
          {formData.type && (
            <div className="plan-form-group">
              <label htmlFor="workout-program" className="plan-form-label">
                {t('modal.form.program')}
              </label>
              {loadingPrograms ? (
                /* FE-11: Skeleton loader - mimics dropdown structure */
                <div className="plan-form-skeleton-wrapper">
                  <div className="plan-form-skeleton plan-form-skeleton--select">
                    <div className="plan-form-skeleton__shimmer"></div>
                    <span className="plan-form-skeleton__text">{t('modal.form.loadingPrograms')}</span>
                  </div>
                </div>
              ) : availablePrograms.length > 0 ? (
                <>
                  <select
                    id="workout-program"
                    name="program"
                    value={selectedProgramId || ''}
                    onChange={(e) => setSelectedProgramId(e.target.value ? parseInt(e.target.value) : null)}
                    className="plan-form-select"
                    disabled={isSubmitting}
                  >
                    <option value="">📋 {t('modal.form.programPlaceholder')}</option>
                    {availablePrograms.map(program => (
                      <option key={program.id} value={program.id}>
                        💪 {program.name} ({program.exercise_count || 0} {t('card.exercises', { count: program.exercise_count || 0 }).split(' ').slice(1).join(' ')})
                      </option>
                    ))}
                  </select>
                  {selectedProgramId && (
                    <span className="plan-form-hint plan-form-success">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      {t('modal.form.programSuccess')}
                    </span>
                  )}
                </>
              ) : (
                <div className="plan-form-empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">
                    <p className="empty-state-title">{t('modal.form.noPrograms', { type: formData.type })}</p>
                    <p className="empty-state-description">
                      {t('modal.form.noProgramsDescription')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="plan-btn-link"
                    onClick={() => {
                      // Navigate to program builder
                      window.location.href = '/trainings';
                    }}
                  >
                    {t('modal.form.createProgram')} →
                  </button>
                </div>
              )}
              {availablePrograms.length > 0 && (
                <span className="plan-form-hint">
                  {t('modal.form.programHint')}
                </span>
              )}
            </div>
          )}

          {/* Date Picker */}
          <div className="plan-form-group">
            <label htmlFor="workout-date" className="plan-form-label label-required">
              {t('modal.form.date')}
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
              {t('modal.form.time')}
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
              {t('modal.form.timeHint')}
            </span>
          </div>

          {/* Notes Textarea (Optional) */}
          <div className="plan-form-group">
            <label htmlFor="workout-notes" className="plan-form-label">
              {t('modal.form.notes')}
            </label>
            <textarea
              id="workout-notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder={t('modal.form.notesPlaceholder')}
              rows="3"
              maxLength="500"
              className="plan-form-textarea"
              disabled={isSubmitting}
            />
            <span className="plan-form-hint">
              {t('modal.form.notesCount', { count: formData.notes.length })}
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
              {t('modal.actions.cancel')}
            </button>
            <button
              type="submit"
              className="plan-btn-primary"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="plan-btn-spinner"></span>
                  {isEditMode ? t('modal.actions.updating') : t('modal.actions.scheduling')}
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  {isEditMode ? t('modal.actions.update') : t('modal.actions.schedule')}
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
