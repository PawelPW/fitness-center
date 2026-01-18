import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import SetLogger from '../components/SetLogger';
import RestTimer from '../components/RestTimer';
import apiService from '../services/api';
import '../styles/WorkoutSession.css';

function WorkoutSession({ program, plannedSessionId, onComplete, onCancel }) {
  const { t } = useTranslation(['workout', 'common']);
  const swipeHandlers = useSwipeNavigation(onCancel);
  const {
    state,
    initializeSession,
    goToNextExercise,
    goToPreviousExercise,
    updateCurrentExercise,
    addSet,
    editSet,
    deleteSet,
    completeCurrentExercise,
    skipCurrentExercise,
    startRestTimer,
    stopRestTimer,
    addRestTime,
    resetSession,
    getCurrentExercise,
    getProgress,
    getFormattedTime,
    getFormattedRestTime,
    getSuggestedWeight,
    getSuggestedReps,
  } = useWorkoutSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  useEffect(() => {
    // Guard: Only start session once, and only when program is available
    // Include plannedSessionId in check to ensure props are synchronized
    if (program && !sessionStarted) {
      setSessionStarted(true);
      startWorkoutSession();
    }
  }, [program, plannedSessionId, sessionStarted]);

  const startWorkoutSession = async () => {
    try {
      setLoading(true);

      let sessionId;

      // If starting from a planned session, use its ID
      // For ad-hoc workouts, use a temporary marker - session will be created on completion
      if (plannedSessionId) {
        sessionId = plannedSessionId;
        console.log('Starting workout from planned session:', plannedSessionId);
      } else if (program.plannedSessionId) {
        // Fallback: Check if plannedSessionId is nested in program object
        sessionId = program.plannedSessionId;
        console.log('Starting workout from planned session (via program):', sessionId);
      } else {
        // For ad-hoc workouts, don't create a session yet
        // Use 'pending' as a marker - actual session will be created when workout is completed
        // This prevents incomplete/abandoned workouts from appearing as "upcoming"
        sessionId = 'pending';
        console.log('Starting ad-hoc workout - session will be created on completion');
      }

      // FE-8: Initialize session in frontend
      // Check for exercises in nested program object (from planned sessions with programs)
      // or directly in program object (from training program starts)
      console.log('FE-8: WorkoutSession - Full program object:', JSON.stringify(program, null, 2));
      console.log('FE-8: WorkoutSession - program.program:', program.program);
      console.log('FE-8: WorkoutSession - program.exercises:', program.exercises);

      // Handle different API response structures
      let exercises = [];
      if (program.program?.exercises) {
        // Planned session with fetched program data
        exercises = program.program.exercises;
        console.log('FE-8: Using program.program.exercises (planned session):', exercises.length, 'exercises');
      } else if (program.exercises) {
        // Direct program start
        exercises = program.exercises;
        console.log('FE-8: Using program.exercises (direct start):', exercises.length, 'exercises');
      } else if (program.program?.program_exercises) {
        // Backend might return program_exercises array
        exercises = program.program.program_exercises;
        console.log('FE-8: Using program.program.program_exercises:', exercises.length, 'exercises');
      } else if (program.program_exercises) {
        exercises = program.program_exercises;
        console.log('FE-8: Using program.program_exercises:', exercises.length, 'exercises');
      } else {
        console.warn('FE-8: NO EXERCISES FOUND! Checked all possible locations.');
        console.warn('FE-8: Available properties:', Object.keys(program));
        if (program.program) {
          console.warn('FE-8: program.program properties:', Object.keys(program.program));
        }
      }

      const programName = program.program?.name || program.name || program.type;
      const programId = program.program?.id || program.id || program.training_program_id;

      console.log('FE-8: Final exercises array:', exercises.length, 'exercises');
      console.log('FE-8: Final programName:', programName);
      console.log('FE-8: Final programId:', programId);

      if (exercises.length === 0) {
        console.error('FE-8: WARNING - Starting workout with 0 exercises!');
        console.error('FE-8: This will create an empty workout session.');
        // Set error and stop
        setError('No exercises found in this program. Cannot start workout.');
        setLoading(false);
        return;
      }

      console.log('FE-8: Calling initializeSession with:', {
        sessionId,
        programId,
        programName,
        trainingType: program.type,
        exerciseCount: exercises.length
      });

      initializeSession({
        sessionId: sessionId,
        programId: programId,
        programName: programName,
        trainingType: program.type,
        exercises: exercises,
      });

      console.log('FE-8: Session initialized successfully!');
    } catch (err) {
      console.error('FE-8: Failed to start workout:', err);
      console.error('FE-8: Error stack:', err.stack);
      setError(t('errors.startFailed') || 'Failed to start workout');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSet = (weight, reps) => {
    const currentExercise = getCurrentExercise();
    if (!currentExercise) return;

    // Calculate rest time since last set
    const restTime = currentExercise.completedSets.length > 0
      ? Math.floor((Date.now() - currentExercise.completedSets[currentExercise.completedSets.length - 1].timestamp) / 1000)
      : 0;

    addSet(weight, reps, restTime);

    // Auto-start rest timer if not the last planned set
    if (currentExercise.completedSets.length + 1 < currentExercise.plannedSets) {
      startRestTimer(currentExercise.restDuration);
    }

    setError('');
  };

  const handleCompleteExercise = () => {
    const currentExercise = getCurrentExercise();

    if (!currentExercise) return;

    // Validate that at least one set is completed
    if (currentExercise.completedSets.length === 0) {
      setError(t('errors.minOneSet'));
      return;
    }

    completeCurrentExercise();
    setError('');

    // Auto-advance to next exercise
    if (state.currentExerciseIndex < state.exercises.length - 1) {
      setTimeout(() => goToNextExercise(), 500);
    }
  };

  const handleSkipExercise = () => {
    if (window.confirm(t('confirmSkip'))) {
      skipCurrentExercise();
      setError('');

      // Auto-advance to next exercise
      if (state.currentExerciseIndex < state.exercises.length - 1) {
        setTimeout(() => goToNextExercise(), 300);
      }
    }
  };

  const handleFinishWorkout = async () => {
    try {
      setLoading(true);

      // Calculate total duration in minutes
      const durationMinutes = Math.floor(state.elapsedTime / 60);

      // Estimate calories (rough calculation)
      const estimatedCalories = Math.floor(durationMinutes * 5);

      let finalSessionId = state.sessionId;

      // Check if this is an ad-hoc workout (session not yet created)
      if (state.sessionId === 'pending') {
        // Create the session now with completed=true
        console.log('Creating session for completed ad-hoc workout');
        const sessionData = {
          programId: state.programId,
          type: state.trainingType,
          date: new Date().toISOString(),
          duration: durationMinutes,
          calories: estimatedCalories,
          completed: true, // Created as completed - won't appear in "upcoming"
        };

        const response = await apiService.createSession(sessionData);
        finalSessionId = response.id;
        console.log('Created completed session with ID:', finalSessionId);
      } else {
        // Existing planned session - update it to completed
        const completionData = {
          completed: true,
          duration: durationMinutes,
          calories: estimatedCalories,
          completed_at: new Date().toISOString(),
        };

        // The updatePlannedSession endpoint is only for editing planned session metadata (type, date, notes)
        // Completion updates (completed, duration, calories) go through updateSession
        await apiService.updateSession(state.sessionId, completionData);
        console.log('Updated planned session to completed:', state.sessionId);
      }

      // Save exercise data with individual sets
      for (const exercise of state.exercises) {
        if (exercise.completed && !exercise.skipped && exercise.completedSets.length > 0) {
          // Calculate totals for the exercise
          const totalSets = exercise.completedSets.length;
          const totalReps = exercise.completedSets.reduce((sum, set) => sum + set.reps, 0);
          const avgWeight = exercise.completedSets.reduce((sum, set) => sum + set.weight, 0) / totalSets;

          console.log('Exercise object:', exercise);
          console.log('Exercise exerciseName:', exercise.exerciseName);

          const exerciseData = {
            exerciseName: exercise.exerciseName,
            sets: totalSets,
            reps: Math.floor(totalReps / totalSets), // average reps
            weight: avgWeight,
            notes: exercise.notes || '',
            setsData: exercise.completedSets, // Send individual sets data
          };

          console.log('Sending to API:', exerciseData);

          await apiService.createSessionExercise(finalSessionId, exerciseData);
        }
      }

      // Navigate to completion screen
      if (onComplete) {
        onComplete({
          sessionId: finalSessionId,
          duration: durationMinutes,
          calories: estimatedCalories,
          exercisesCompleted: state.completedExercises.filter(idx =>
            !state.exercises[idx]?.skipped
          ).length,
          totalExercises: state.exercises.length,
          wasPlanned: !!plannedSessionId,
        });
      }
    } catch (err) {
      console.error('Failed to finish workout:', err);
      setError(t('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWorkout = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    // Clear localStorage to prevent stale workout data
    resetSession();

    if (onCancel) {
      onCancel();
    }
  };

  const handleSaveNotes = (notes) => {
    updateCurrentExercise({ notes });
    setShowNotesModal(false);
  };

  // Helper function to format date for planned session indicator
  const formatPlannedDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading && !state.isActive) {
    return (
      <div className="workout-session-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('session.loading')}</p>
        </div>
      </div>
    );
  }

  const currentExercise = getCurrentExercise();
  const progress = getProgress();
  const isLastExercise = state.currentExerciseIndex === state.exercises.length - 1;
  const isFirstExercise = state.currentExerciseIndex === 0;
  const canCompleteExercise = currentExercise?.completedSets.length > 0;
  const hasCompletedExercises = state.exercises.some(ex => ex.completed && !ex.skipped && ex.completedSets.length > 0);

  return (
    <div {...swipeHandlers} className="workout-session-container">
      {/* Header */}
      <div className="workout-header">
        <button onClick={handleCancelWorkout} className="cancel-btn">
          ✕
        </button>
        <div className="workout-info">
          <h1 className="workout-title">{state.programName}</h1>
          <div className="workout-meta">
            <span className="workout-time">⏱️ {getFormattedTime()}</span>
            <span className="workout-type">{state.trainingType}</span>
          </div>
        </div>
        <button
          onClick={handleFinishWorkout}
          className="finish-btn"
          disabled={loading || !hasCompletedExercises}
          title={!hasCompletedExercises ? t('session.finishDisabledHint') : ""}
        >
          {loading ? t('session.saving') : t('session.finish')}
        </button>
      </div>

      {/* Planned Session Indicator */}
      {plannedSessionId && program.plannedDate && (
        <div className="planned-session-indicator">
          <span className="indicator-icon">📅</span>
          <span className="indicator-text">
            Planned workout for {formatPlannedDate(program.plannedDate)}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="workout-progress-container">
          <div
            className="workout-progress-fill"
            style={{
              width: `${progress}%`,
              maxWidth: `${progress}%`,
              minWidth: progress === 0 ? '0%' : undefined
            }}
          />
        </div>
        <div className="progress-text">
          {state.completedExercises.filter(idx => !state.exercises[idx]?.skipped).length} / {state.exercises.length} {t('progress.exercisesCompleted')}
          {state.exercises.filter(ex => ex.skipped).length > 0 && (
            <span style={{color: 'var(--text-tertiary)', marginLeft: 'var(--space-2)'}}>
              ({state.exercises.filter(ex => ex.skipped).length} {t('progress.skipped')})
            </span>
          )}
        </div>
      </div>

      {/* Current Exercise */}
      {currentExercise ? (
        <div className="exercise-section">
          <div className="exercise-header">
            <div className="workout-exercise-number">
              {t('exercise.number', { current: state.currentExerciseIndex + 1, total: state.exercises.length })}
            </div>
            <h2 className="exercise-name">{currentExercise.exerciseName}</h2>
            {currentExercise.description && (
              <p className="exercise-description">{currentExercise.description}</p>
            )}
            {currentExercise.skipped && (
              <div className="skipped-badge">⏭️ {t('exercise.skippedBadge')}</div>
            )}
            {currentExercise.completed && !currentExercise.skipped && (
              <div className="completed-badge">✓ {t('exercise.completedBadge')}</div>
            )}
          </div>

          {/* Only show set logger if not skipped/completed */}
          {!currentExercise.completed && (
            <>
              {/* Rest Timer */}
              {state.restTimer.remaining > 0 || state.restTimer.isActive ? (
                <RestTimer
                  isActive={state.restTimer.isActive}
                  remaining={state.restTimer.remaining}
                  duration={state.restTimer.duration}
                  formattedTime={getFormattedRestTime()}
                  onSkip={stopRestTimer}
                  onAddTime={addRestTime}
                />
              ) : null}

              {/* Set Logger */}
              <SetLogger
                exercise={currentExercise}
                onAddSet={handleAddSet}
                onEditSet={editSet}
                onDeleteSet={deleteSet}
                suggestedWeight={getSuggestedWeight()}
                suggestedReps={getSuggestedReps()}
              />

              {/* Exercise Notes Button */}
              <button
                className="notes-btn"
                onClick={() => setShowNotesModal(true)}
                type="button"
              >
                <span className="btn-icon">📝</span>
                {currentExercise.notes?.trim() ? t('notes.edit') : t('notes.add')}
                {currentExercise.notes?.trim() && <span className="notes-indicator">•</span>}
              </button>

              {error && <div className="error-message">{error}</div>}

              {/* Exercise Actions */}
              <div className="exercise-actions">
                <button
                  onClick={handleSkipExercise}
                  className="skip-exercise-btn"
                  type="button"
                >
                  {t('actions.skip')}
                </button>
                <button
                  onClick={handleCompleteExercise}
                  className="complete-exercise-btn"
                  disabled={!canCompleteExercise}
                  type="button"
                >
                  {canCompleteExercise ? `✓ ${t('actions.complete')}` : t('actions.minOneSet')}
                </button>
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="exercise-navigation">
            <button
              onClick={goToPreviousExercise}
              className="nav-btn"
              disabled={isFirstExercise}
            >
              ← {t('actions.previous')}
            </button>
            <button
              onClick={goToNextExercise}
              className="nav-btn"
              disabled={isLastExercise}
            >
              {t('actions.next')} →
            </button>
          </div>
        </div>
      ) : (
        <div className="no-exercise">
          <p>{t('empty.noExercises')}</p>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && currentExercise && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{t('workout:notes.title')}</h2>
            <p className="modal-subtitle">{currentExercise.exerciseName}</p>
            <textarea
              className="notes-textarea"
              placeholder={t('workout:notes.placeholder')}
              value={currentExercise.notes || ''}
              onChange={(e) => updateCurrentExercise({ notes: e.target.value })}
              rows="6"
            />
            <div className="modal-actions">
              <button
                onClick={() => setShowNotesModal(false)}
                className="modal-btn cancel"
              >
                {t('common:cancel')}
              </button>
              <button
                onClick={() => handleSaveNotes(currentExercise.notes)}
                className="modal-btn confirm"
              >
                {t('workout:notes.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{t('workout:exitModal.title')}</h2>
            <p className="modal-subtitle">{t('workout:exitModal.message')}</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="modal-btn cancel"
              >
                {t('workout:exitModal.continue')}
              </button>
              <button
                onClick={confirmExit}
                className="modal-btn confirm"
              >
                {t('workout:exitModal.exitWithoutSaving')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutSession;
