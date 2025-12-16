import React, { useState, useEffect } from 'react';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import SetLogger from '../components/SetLogger';
import RestTimer from '../components/RestTimer';
import apiService from '../services/api';
import '../styles/WorkoutSession.css';

function WorkoutSession({ program, onComplete, onCancel }) {
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

  useEffect(() => {
    if (program) {
      startWorkoutSession();
    }
  }, [program]);

  const startWorkoutSession = async () => {
    try {
      setLoading(true);

      // Create session in backend
      const sessionData = {
        programId: program.id,
        type: program.type,  // Backend expects 'type', not 'trainingType'
        date: new Date().toISOString(),  // Backend expects 'date', not 'sessionDate'
        completed: false,
      };

      const response = await apiService.createSession(sessionData);

      // Initialize session in frontend
      initializeSession({
        sessionId: response.id,
        programId: program.id,
        programName: program.name,
        trainingType: program.type,
        exercises: program.exercises || [],
      });
    } catch (err) {
      console.error('Failed to start workout:', err);
      setError('Failed to start workout. Please try again.');
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
      setError('Please complete at least one set before finishing this exercise');
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
    if (window.confirm('Are you sure you want to skip this exercise?')) {
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

      // Update session as completed
      await apiService.updateSession(state.sessionId, {
        completed: true,
        duration: durationMinutes,
        calories: estimatedCalories,
      });

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

          await apiService.createSessionExercise(state.sessionId, exerciseData);
        }
      }

      // Navigate to completion screen
      if (onComplete) {
        onComplete({
          sessionId: state.sessionId,
          duration: durationMinutes,
          calories: estimatedCalories,
          exercisesCompleted: state.completedExercises.filter(idx =>
            !state.exercises[idx]?.skipped
          ).length,
          totalExercises: state.exercises.length,
        });
      }
    } catch (err) {
      console.error('Failed to finish workout:', err);
      setError('Failed to save workout. Please try again.');
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

  if (loading && !state.isActive) {
    return (
      <div className="workout-session-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Starting your workout...</p>
        </div>
      </div>
    );
  }

  const currentExercise = getCurrentExercise();
  const progress = getProgress();
  const isLastExercise = state.currentExerciseIndex === state.exercises.length - 1;
  const isFirstExercise = state.currentExerciseIndex === 0;
  const canCompleteExercise = currentExercise?.completedSets.length > 0;

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
          disabled={loading}
        >
          Finish
        </button>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          {state.completedExercises.length} / {state.exercises.length} exercises completed
        </div>
      </div>

      {/* Current Exercise */}
      {currentExercise ? (
        <div className="exercise-section">
          <div className="exercise-header">
            <div className="exercise-number">
              Exercise {state.currentExerciseIndex + 1} of {state.exercises.length}
            </div>
            <h2 className="exercise-name">{currentExercise.exerciseName}</h2>
            {currentExercise.description && (
              <p className="exercise-description">{currentExercise.description}</p>
            )}
            {currentExercise.skipped && (
              <div className="skipped-badge">⏭️ Skipped</div>
            )}
            {currentExercise.completed && !currentExercise.skipped && (
              <div className="completed-badge">✓ Completed</div>
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
                {currentExercise.notes ? 'Edit Notes' : 'Add Notes'}
                {currentExercise.notes && <span className="notes-indicator">•</span>}
              </button>

              {error && <div className="error-message">{error}</div>}

              {/* Exercise Actions */}
              <div className="exercise-actions">
                <button
                  onClick={handleSkipExercise}
                  className="skip-exercise-btn"
                  type="button"
                >
                  Skip Exercise
                </button>
                <button
                  onClick={handleCompleteExercise}
                  className="complete-exercise-btn"
                  disabled={!canCompleteExercise}
                  type="button"
                >
                  {canCompleteExercise ? '✓ Complete Exercise' : 'Add at least 1 set'}
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
              ← Previous
            </button>
            <button
              onClick={goToNextExercise}
              className="nav-btn"
              disabled={isLastExercise}
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <div className="no-exercise">
          <p>No exercises in this program</p>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && currentExercise && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Exercise Notes</h2>
            <p className="modal-subtitle">{currentExercise.exerciseName}</p>
            <textarea
              className="notes-textarea"
              placeholder="Add notes about form, pain, observations..."
              value={currentExercise.notes || ''}
              onChange={(e) => updateCurrentExercise({ notes: e.target.value })}
              rows="6"
            />
            <div className="modal-actions">
              <button
                onClick={() => setShowNotesModal(false)}
                className="modal-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveNotes(currentExercise.notes)}
                className="modal-btn confirm"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Exit Workout?</h2>
            <p className="modal-subtitle">Your progress will not be saved. Are you sure you want to exit?</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="modal-btn cancel"
              >
                Continue Workout
              </button>
              <button
                onClick={confirmExit}
                className="modal-btn confirm"
              >
                Exit Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkoutSession;
