import React, { useState, useEffect } from 'react';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { TRAINING_TYPES } from '../utils/trainingData';
import { getExercisesByType } from '../utils/exerciseDatabase';
import {
  createTrainingProgram,
  updateTrainingProgram,
} from '../utils/trainingDatabase';
import '../styles/TrainingBuilder.css';

function TrainingBuilder({ onBack, existingProgram }) {
  const swipeHandlers = useSwipeNavigation(onBack);
  const [programName, setProgramName] = useState('');
  const [programType, setProgramType] = useState(TRAINING_TYPES.STRENGTH);
  const [programDescription, setProgramDescription] = useState('');
  const [exercises, setExercises] = useState([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (existingProgram) {
      setProgramName(existingProgram.name);
      setProgramType(existingProgram.type);
      setProgramDescription(existingProgram.description || '');
      setExercises(existingProgram.exercises || []);
    }
  }, [existingProgram]);

  useEffect(() => {
    loadExercises();
  }, [programType]);

  const loadExercises = async () => {
    try {
      const exList = await getExercisesByType(programType);
      setAvailableExercises(exList);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExercise = (exercise) => {
    const newExercise = {
      id: `ex-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3,
      reps: 10,
      weight: programType === TRAINING_TYPES.STRENGTH ? 20 : 0,
      duration: [TRAINING_TYPES.CARDIO, TRAINING_TYPES.SWIMMING].includes(programType) ? 30 : 0,
      restTime: 60,
    };

    setExercises([...exercises, newExercise]);
    setShowExercisePicker(false);
  };

  const removeExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id, field, value) => {
    setExercises(exercises.map(ex =>
      ex.id === id ? { ...ex, [field]: parseInt(value) || 0 } : ex
    ));
  };

  const handleSave = async () => {
    setError('');

    if (!programName.trim()) {
      setError('Please enter a program name');
      return;
    }

    if (exercises.length === 0) {
      setError('Please add at least one exercise');
      return;
    }

    const programData = {
      name: programName.trim(),
      type: programType,
      description: programDescription.trim(),
      exercises,
    };

    try {
      if (existingProgram) {
        await updateTrainingProgram(existingProgram.id, programData);
      } else {
        await createTrainingProgram(programData);
      }
      onBack();
    } catch (err) {
      setError(err.message);
    }
  };

  const renderExerciseFields = (exercise) => {
    const isStrength = programType === TRAINING_TYPES.STRENGTH;
    const isCalisthenics = programType === TRAINING_TYPES.CALISTHENICS;
    const isCardio = programType === TRAINING_TYPES.CARDIO;
    const isSwimming = programType === TRAINING_TYPES.SWIMMING;

    return (
      <div className="exercise-fields">
        {(isStrength || isCalisthenics) && (
          <>
            <div className="field">
              <label>Sets</label>
              <input
                type="number"
                min="1"
                value={exercise.sets}
                onChange={(e) => updateExercise(exercise.id, 'sets', e.target.value)}
                className="field-input"
              />
            </div>
            <div className="field">
              <label>Reps</label>
              <input
                type="number"
                min="1"
                value={exercise.reps}
                onChange={(e) => updateExercise(exercise.id, 'reps', e.target.value)}
                className="field-input"
              />
            </div>
            {isStrength && (
              <div className="field">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={exercise.weight}
                  onChange={(e) => updateExercise(exercise.id, 'weight', e.target.value)}
                  className="field-input"
                />
              </div>
            )}
            <div className="field">
              <label>Rest (sec)</label>
              <input
                type="number"
                min="0"
                value={exercise.restTime}
                onChange={(e) => updateExercise(exercise.id, 'restTime', e.target.value)}
                className="field-input"
              />
            </div>
          </>
        )}

        {(isCardio || isSwimming) && (
          <>
            <div className="field">
              <label>Duration (min)</label>
              <input
                type="number"
                min="1"
                value={exercise.duration}
                onChange={(e) => updateExercise(exercise.id, 'duration', e.target.value)}
                className="field-input"
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div {...swipeHandlers} className="training-builder-container">
      <div className="builder-content">
        <div className="page-header">
          <h1 className="page-title">
            {existingProgram ? 'Edit Training Program' : 'Create Training Program'}
          </h1>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading exercises...</p>
          </div>
        ) : (
          <>
        {/* Program Details */}
        <div className="section">
          <h2 className="section-title">Program Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Program Name</label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g., Upper Body Strength"
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>Training Type</label>
              <select
                value={programType}
                onChange={(e) => setProgramType(e.target.value)}
                className="select-field"
              >
                {Object.values(TRAINING_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Description (optional)</label>
              <textarea
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                placeholder="Describe this training program..."
                className="input-field"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Exercises ({exercises.length})</h2>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="btn-primary"
            >
              + Add Exercise
            </button>
          </div>

          <div className="exercises-list">
            {exercises.length > 0 ? (
              exercises.map((exercise, index) => (
                <div key={exercise.id} className="exercise-item">
                  <div className="exercise-header">
                    <span className="exercise-number">{index + 1}</span>
                    <h3 className="exercise-name">{exercise.exerciseName}</h3>
                    <button
                      onClick={() => removeExercise(exercise.id)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  </div>
                  {renderExerciseFields(exercise)}
                </div>
              ))
            ) : (
              <div className="no-exercises">
                Click "Add Exercise" to start building your training program
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Save Button */}
        <div className="actions">
          <button onClick={onBack} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            {existingProgram ? 'Update Program' : 'Create Program'}
          </button>
        </div>
        </>
        )}
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="modal-overlay" onClick={() => setShowExercisePicker(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Exercise</h2>
              <button
                onClick={() => setShowExercisePicker(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            <div className="exercise-picker-list">
              {availableExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => addExercise(exercise)}
                  className="exercise-picker-item"
                >
                  <span className="picker-exercise-name">{exercise.name}</span>
                  {exercise.isCustom && (
                    <span className="custom-badge-small">Custom</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingBuilder;
