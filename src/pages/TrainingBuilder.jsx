import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { TRAINING_TYPES } from '../utils/trainingData';
import { getExercisesByType } from '../utils/exerciseDatabase';
import {
  createTrainingProgram,
  updateTrainingProgram,
} from '../utils/trainingDatabase';
import '../styles/TrainingBuilder.css';

function TrainingBuilder({ onBack, existingProgram }) {
  const { t } = useTranslation(['training', 'common']);
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
      setError(t('training:errors.nameRequired'));
      return;
    }

    if (exercises.length === 0) {
      setError(t('training:errors.exercisesRequired'));
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
              <label>{t('training:builder.fields.sets')}</label>
              <input
                type="number"
                min="1"
                value={exercise.sets}
                onChange={(e) => updateExercise(exercise.id, 'sets', e.target.value)}
                className="field-input"
              />
            </div>
            <div className="field">
              <label>{t('training:builder.fields.reps')}</label>
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
                <label>{t('training:builder.fields.weight')}</label>
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
              <label>{t('training:builder.fields.rest')}</label>
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
              <label>{t('training:builder.fields.duration')}</label>
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
            {existingProgram ? t('training:builder.title.edit') : t('training:builder.title.create')}
          </h1>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('training:builder.loading')}</p>
          </div>
        ) : (
          <>
        {/* Program Details */}
        <div className="section">
          <h2 className="section-title">{t('training:builder.programDetails')}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('training:builder.form.nameLabel')}</label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder={t('training:builder.form.namePlaceholder')}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label>{t('training:builder.form.typeLabel')}</label>
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
              <label>{t('training:builder.form.descriptionLabel')}</label>
              <textarea
                value={programDescription}
                onChange={(e) => setProgramDescription(e.target.value)}
                placeholder={t('training:builder.form.descriptionPlaceholder')}
                className="input-field"
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">{t('training:builder.exercisesSection', { count: exercises.length })}</h2>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="btn-primary"
            >
              + {t('training:actions.addExercise')}
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
                {t('training:builder.empty.noExercises')}
              </div>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Save Button */}
        <div className="actions">
          <button onClick={onBack} className="btn-secondary">
            {t('common:cancel')}
          </button>
          <button onClick={handleSave} className="btn-primary">
            {existingProgram ? t('training:builder.actions.save.update') : t('training:builder.actions.save.create')}
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
              <h2>{t('training:builder.modal.title')}</h2>
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
                    <span className="custom-badge-small">{t('training:builder.modal.customBadge')}</span>
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
