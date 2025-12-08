import { useReducer, useEffect } from 'react';

// Action types
const ACTIONS = {
  INIT_SESSION: 'INIT_SESSION',
  NEXT_EXERCISE: 'NEXT_EXERCISE',
  PREVIOUS_EXERCISE: 'PREVIOUS_EXERCISE',
  UPDATE_EXERCISE_DATA: 'UPDATE_EXERCISE_DATA',
  ADD_SET: 'ADD_SET',
  EDIT_SET: 'EDIT_SET',
  DELETE_SET: 'DELETE_SET',
  COMPLETE_EXERCISE: 'COMPLETE_EXERCISE',
  SKIP_EXERCISE: 'SKIP_EXERCISE',
  START_REST_TIMER: 'START_REST_TIMER',
  UPDATE_REST_TIMER: 'UPDATE_REST_TIMER',
  STOP_REST_TIMER: 'STOP_REST_TIMER',
  UPDATE_TIMER: 'UPDATE_TIMER',
  RESET_SESSION: 'RESET_SESSION',
};

// Initial state
const initialState = {
  sessionId: null,
  programId: null,
  programName: '',
  trainingType: '',
  exercises: [],
  currentExerciseIndex: 0,
  startTime: null,
  elapsedTime: 0,
  isActive: false,
  completedExercises: [],
  restTimer: {
    isActive: false,
    duration: 90, // default 90 seconds
    remaining: 90,
  },
};

// Reducer function
function workoutSessionReducer(state, action) {
  switch (action.type) {
    case ACTIONS.INIT_SESSION:
      return {
        ...initialState,
        sessionId: action.payload.sessionId,
        programId: action.payload.programId,
        programName: action.payload.programName,
        trainingType: action.payload.trainingType,
        exercises: action.payload.exercises.map((ex, index) => ({
          ...ex,
          order: index,
          completed: false,
          skipped: false,
          notes: '',
          plannedSets: ex.sets || 3,
          plannedReps: ex.reps || 10,
          plannedWeight: ex.weight || 0,
          completedSets: [],
          restDuration: ex.restDuration || 90, // customizable per exercise
          // Previous performance data
          previousSets: ex.lastSeries || null,
          previousReps: ex.lastRepetitions || null,
          previousWeight: ex.lastWeight || null,
        })),
        startTime: Date.now(),
        isActive: true,
      };

    case ACTIONS.NEXT_EXERCISE:
      if (state.currentExerciseIndex < state.exercises.length - 1) {
        return {
          ...state,
          currentExerciseIndex: state.currentExerciseIndex + 1,
          restTimer: { ...initialState.restTimer },
        };
      }
      return state;

    case ACTIONS.PREVIOUS_EXERCISE:
      if (state.currentExerciseIndex > 0) {
        return {
          ...state,
          currentExerciseIndex: state.currentExerciseIndex - 1,
          restTimer: { ...initialState.restTimer },
        };
      }
      return state;

    case ACTIONS.UPDATE_EXERCISE_DATA:
      return {
        ...state,
        exercises: state.exercises.map((ex, index) =>
          index === state.currentExerciseIndex
            ? { ...ex, ...action.payload }
            : ex
        ),
      };

    case ACTIONS.ADD_SET: {
      const { weight, reps, restTime } = action.payload;
      return {
        ...state,
        exercises: state.exercises.map((ex, index) => {
          if (index === state.currentExerciseIndex) {
            const newSet = {
              setNumber: ex.completedSets.length + 1,
              reps: reps,
              weight: weight,
              restTime: restTime || 0,
              timestamp: Date.now(),
            };
            return {
              ...ex,
              completedSets: [...ex.completedSets, newSet],
            };
          }
          return ex;
        }),
      };
    }

    case ACTIONS.EDIT_SET: {
      const { setNumber, weight, reps } = action.payload;
      return {
        ...state,
        exercises: state.exercises.map((ex, index) => {
          if (index === state.currentExerciseIndex) {
            return {
              ...ex,
              completedSets: ex.completedSets.map(set =>
                set.setNumber === setNumber
                  ? { ...set, weight, reps, timestamp: set.timestamp } // Preserve timestamp and restTime
                  : set
              ),
            };
          }
          return ex;
        }),
      };
    }

    case ACTIONS.DELETE_SET: {
      const { setNumber } = action.payload;
      return {
        ...state,
        exercises: state.exercises.map((ex, index) => {
          if (index === state.currentExerciseIndex) {
            const updatedSets = ex.completedSets
              .filter(set => set.setNumber !== setNumber)
              .map((set, idx) => ({ ...set, setNumber: idx + 1 })); // Renumber sets
            return {
              ...ex,
              completedSets: updatedSets,
            };
          }
          return ex;
        }),
      };
    }

    case ACTIONS.COMPLETE_EXERCISE: {
      const updatedExercises = state.exercises.map((ex, index) =>
        index === state.currentExerciseIndex
          ? { ...ex, completed: true }
          : ex
      );

      return {
        ...state,
        exercises: updatedExercises,
        completedExercises: [
          ...state.completedExercises,
          state.currentExerciseIndex,
        ],
        restTimer: { ...initialState.restTimer },
      };
    }

    case ACTIONS.SKIP_EXERCISE: {
      const updatedExercises = state.exercises.map((ex, index) =>
        index === state.currentExerciseIndex
          ? { ...ex, skipped: true, completed: true }
          : ex
      );

      return {
        ...state,
        exercises: updatedExercises,
        completedExercises: [
          ...state.completedExercises,
          state.currentExerciseIndex,
        ],
        restTimer: { ...initialState.restTimer },
      };
    }

    case ACTIONS.START_REST_TIMER: {
      const duration = action.payload?.duration || state.restTimer.duration;
      return {
        ...state,
        restTimer: {
          isActive: true,
          duration: duration,
          remaining: duration,
          startTime: Date.now(),
        },
      };
    }

    case ACTIONS.UPDATE_REST_TIMER: {
      if (!state.restTimer.isActive || !state.restTimer.startTime) return state;

      const elapsed = Math.floor((Date.now() - state.restTimer.startTime) / 1000);
      const remaining = Math.max(0, state.restTimer.duration - elapsed);

      return {
        ...state,
        restTimer: {
          ...state.restTimer,
          remaining,
          isActive: remaining > 0,
        },
      };
    }

    case ACTIONS.STOP_REST_TIMER:
      return {
        ...state,
        restTimer: {
          ...state.restTimer,
          isActive: false,
        },
      };

    case ACTIONS.UPDATE_TIMER:
      return {
        ...state,
        elapsedTime: Math.floor((Date.now() - state.startTime) / 1000),
      };

    case ACTIONS.RESET_SESSION:
      return initialState;

    default:
      return state;
  }
}

// Custom hook
export function useWorkoutSession() {
  const [state, dispatch] = useReducer(workoutSessionReducer, initialState);

  // Workout timer effect
  useEffect(() => {
    if (!state.isActive || !state.startTime) return;

    const interval = setInterval(() => {
      dispatch({ type: ACTIONS.UPDATE_TIMER });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isActive, state.startTime]);

  // Rest timer effect
  useEffect(() => {
    if (!state.restTimer.isActive) return;

    const interval = setInterval(() => {
      dispatch({ type: ACTIONS.UPDATE_REST_TIMER });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.restTimer.isActive]);

  // Rest timer completion effect (with notification)
  useEffect(() => {
    if (state.restTimer.isActive && state.restTimer.remaining === 0) {
      // Play sound or vibration
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Stop timer
      dispatch({ type: ACTIONS.STOP_REST_TIMER });
    }
  }, [state.restTimer.remaining, state.restTimer.isActive]);

  // Auto-save to localStorage
  useEffect(() => {
    if (state.isActive && state.sessionId) {
      localStorage.setItem('activeWorkoutSession', JSON.stringify(state));
    }
  }, [state]);

  const initializeSession = (sessionData) => {
    dispatch({
      type: ACTIONS.INIT_SESSION,
      payload: sessionData,
    });
  };

  const goToNextExercise = () => {
    dispatch({ type: ACTIONS.NEXT_EXERCISE });
  };

  const goToPreviousExercise = () => {
    dispatch({ type: ACTIONS.PREVIOUS_EXERCISE });
  };

  const updateCurrentExercise = (data) => {
    dispatch({
      type: ACTIONS.UPDATE_EXERCISE_DATA,
      payload: data,
    });
  };

  const addSet = (weight, reps, restTime = 0) => {
    dispatch({
      type: ACTIONS.ADD_SET,
      payload: { weight, reps, restTime },
    });
  };

  const editSet = (setNumber, weight, reps) => {
    dispatch({
      type: ACTIONS.EDIT_SET,
      payload: { setNumber, weight, reps },
    });
  };

  const deleteSet = (setNumber) => {
    dispatch({
      type: ACTIONS.DELETE_SET,
      payload: { setNumber },
    });
  };

  const completeCurrentExercise = () => {
    dispatch({ type: ACTIONS.COMPLETE_EXERCISE });
  };

  const skipCurrentExercise = () => {
    dispatch({ type: ACTIONS.SKIP_EXERCISE });
  };

  const startRestTimer = (duration) => {
    dispatch({
      type: ACTIONS.START_REST_TIMER,
      payload: { duration },
    });
  };

  const stopRestTimer = () => {
    dispatch({ type: ACTIONS.STOP_REST_TIMER });
  };

  const addRestTime = (seconds) => {
    if (state.restTimer.isActive) {
      const newDuration = state.restTimer.duration + seconds;
      dispatch({
        type: ACTIONS.START_REST_TIMER,
        payload: { duration: newDuration },
      });
    }
  };

  const resetSession = () => {
    localStorage.removeItem('activeWorkoutSession');
    dispatch({ type: ACTIONS.RESET_SESSION });
  };

  // Restore session from localStorage on mount
  const restoreSession = () => {
    const saved = localStorage.getItem('activeWorkoutSession');
    if (saved) {
      try {
        const sessionData = JSON.parse(saved);
        dispatch({
          type: ACTIONS.INIT_SESSION,
          payload: sessionData,
        });
        return true;
      } catch (error) {
        console.error('Failed to restore session:', error);
        return false;
      }
    }
    return false;
  };

  // Get current exercise
  const getCurrentExercise = () => {
    return state.exercises[state.currentExerciseIndex] || null;
  };

  // Get progress percentage
  const getProgress = () => {
    if (state.exercises.length === 0) return 0;
    return Math.floor((state.completedExercises.length / state.exercises.length) * 100);
  };

  // Format elapsed time as MM:SS
  const getFormattedTime = () => {
    const minutes = Math.floor(state.elapsedTime / 60);
    const seconds = state.elapsedTime % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Format rest timer as MM:SS
  const getFormattedRestTime = () => {
    const minutes = Math.floor(state.restTimer.remaining / 60);
    const seconds = state.restTimer.remaining % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Get suggested weight for next set (from previous set or last workout)
  const getSuggestedWeight = () => {
    const currentExercise = getCurrentExercise();
    if (!currentExercise) return 0;

    // If sets completed, use last set's weight
    if (currentExercise.completedSets.length > 0) {
      const lastSet = currentExercise.completedSets[currentExercise.completedSets.length - 1];
      return lastSet.weight;
    }

    // Otherwise use previous workout weight or planned weight
    return currentExercise.previousWeight || currentExercise.plannedWeight || 0;
  };

  // Get suggested reps for next set
  const getSuggestedReps = () => {
    const currentExercise = getCurrentExercise();
    if (!currentExercise) return 0;

    // If sets completed, use last set's reps
    if (currentExercise.completedSets.length > 0) {
      const lastSet = currentExercise.completedSets[currentExercise.completedSets.length - 1];
      return lastSet.reps;
    }

    // Otherwise use previous workout reps or planned reps
    return currentExercise.previousReps || currentExercise.plannedReps || 0;
  };

  return {
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
    restoreSession,
    getCurrentExercise,
    getProgress,
    getFormattedTime,
    getFormattedRestTime,
    getSuggestedWeight,
    getSuggestedReps,
  };
}
