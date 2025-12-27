import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { TRAINING_TYPES } from '../utils/trainingData';
import '../styles/TrainingDetail.css';

function TrainingDetail({ session, onBack }) {
  const { t } = useTranslation('training');
  const swipeHandlers = useSwipeNavigation(onBack);

  // State for expand/collapse exercise details
  const [expandedExercises, setExpandedExercises] = useState(new Set());

  const toggleExerciseExpand = (exerciseId) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };
  if (!session) {
    return (
      <div className="training-detail-container">
        <div className="detail-header">
          <button onClick={onBack} className="back-button">← {t('detail.back')}</button>
        </div>
        <div className="no-data">{t('detail.noData')}</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStrengthExercise = (exercise, index) => {
    const isExpanded = expandedExercises.has(exercise.id || index);
    const hasDetailedSets = exercise.setsData && exercise.setsData.length > 0;

    return (
      <div key={index} className="exercise-item">
        {/* Clickable header with chevron */}
        <div
          className={`exercise-header ${hasDetailedSets ? 'clickable' : ''}`}
          onClick={() => hasDetailedSets && toggleExerciseExpand(exercise.id || index)}
        >
          <div className="exercise-header-left">
            <h3 className="exercise-name">{exercise.name || exercise.exerciseName}</h3>
            <span className="exercise-badge">
              {t('detail.badges.sets', { count: exercise.sets })}
            </span>
          </div>
          {hasDetailedSets && (
            <div className="expand-icon">{isExpanded ? '▼' : '▶'}</div>
          )}
        </div>

        {/* Summary - always visible */}
        <div className="exercise-details">
          <div className="detail-item">
            <span className="detail-label">{t('detail.fields.reps')}</span>
            <span className="detail-value">{exercise.reps}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('detail.fields.weight')}</span>
            <span className="detail-value">{exercise.weight} {t('detail.units.kg')}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">{t('detail.fields.rest')}</span>
            <span className="detail-value">{exercise.restTime}{t('detail.units.sec')}</span>
          </div>
        </div>

        {/* Detailed sets - only when expanded */}
        {isExpanded && hasDetailedSets && (
          <div className="sets-breakdown">
            <div className="sets-breakdown-header">
              <span className="breakdown-title">{t('detail.setDetails.title')}</span>
            </div>
            <div className="sets-list">
              {exercise.setsData.map((set, setIndex) => (
                <div key={setIndex} className="set-item">
                  <span className="set-number">{t('detail.setDetails.setNumber', { number: set.setNumber })}</span>
                  <span className="set-details">
                    {set.reps} {t('detail.units.reps')} @ {set.weight} {t('detail.units.kg')}
                  </span>
                  {set.restTime > 0 && (
                    <span className="set-rest">{set.restTime}{t('detail.units.sec')} {t('detail.units.rest')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCalisthenicsExercise = (exercise, index) => (
    <div key={index} className="exercise-item">
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.exerciseName}</h3>
        <span className="exercise-badge bodyweight">
          {t('detail.badges.bodyweight')}
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.sets')}</span>
          <span className="detail-value">{exercise.sets}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.reps')}</span>
          <span className="detail-value">{exercise.reps}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.rest')}</span>
          <span className="detail-value">{exercise.restTime}{t('detail.units.sec')}</span>
        </div>
      </div>
    </div>
  );

  const renderCardioExercise = (exercise, index) => (
    <div key={index} className="exercise-item cardio">
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.exerciseName}</h3>
        <span className="exercise-badge cardio">
          {t('detail.badges.cardio')}
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.duration')}</span>
          <span className="detail-value">{exercise.duration} {t('detail.units.min')}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.distance')}</span>
          <span className="detail-value">{exercise.distance} {t('detail.units.km')}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.calories')}</span>
          <span className="detail-value">{exercise.calories}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.avgHR')}</span>
          <span className="detail-value">{exercise.avgHeartRate} {t('detail.units.bpm')}</span>
        </div>
      </div>
    </div>
  );

  const renderBoxingExercise = (exercise, index) => (
    <div key={index} className="exercise-item boxing">
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.exerciseName}</h3>
        <span className="exercise-badge boxing">
          {t('detail.badges.rounds', { count: exercise.rounds })}
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.roundDuration')}</span>
          <span className="detail-value">{exercise.roundDuration} {t('detail.units.min')}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.rest')}</span>
          <span className="detail-value">{exercise.restBetweenRounds}{t('detail.units.sec')}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.calories')}</span>
          <span className="detail-value">{exercise.calories}</span>
        </div>
      </div>
    </div>
  );

  const renderSwimmingExercise = (exercise, index) => (
    <div key={index} className="exercise-item swimming">
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.exerciseName}</h3>
        <span className="exercise-badge swimming">
          {t('detail.badges.laps', { count: exercise.laps })}
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.duration')}</span>
          <span className="detail-value">{exercise.duration} {t('detail.units.min')}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.distance')}</span>
          <span className="detail-value">{exercise.distance.toFixed(2)} {t('detail.units.km')}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">{t('detail.fields.calories')}</span>
          <span className="detail-value">{exercise.calories}</span>
        </div>
      </div>
    </div>
  );

  const renderExercise = (exercise, index) => {
    switch (session.type) {
      case TRAINING_TYPES.STRENGTH:
        return renderStrengthExercise(exercise, index);
      case TRAINING_TYPES.CALISTHENICS:
        return renderCalisthenicsExercise(exercise, index);
      case TRAINING_TYPES.CARDIO:
        return renderCardioExercise(exercise, index);
      case TRAINING_TYPES.BOXING:
        return renderBoxingExercise(exercise, index);
      case TRAINING_TYPES.SWIMMING:
        return renderSwimmingExercise(exercise, index);
      default:
        return null;
    }
  };

  return (
    <div {...swipeHandlers} className="training-detail-container">
      <div className="detail-content">
        <div className="session-header">
          <div className="session-type-badge" data-type={session.type.toLowerCase()}>
            {session.type}
          </div>
          <h1 className="session-title">{t('detail.title', { type: session.type })}</h1>
          <p className="session-date">{formatDate(session.date)}</p>
        </div>

        <div className="session-summary">
          <div className="summary-item">
            <div className="summary-icon">⏱️</div>
            <div className="summary-content">
              <div className="summary-label">{t('detail.summary.duration')}</div>
              <div className="summary-value">{session.duration} {t('detail.units.min')}</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">🔥</div>
            <div className="summary-content">
              <div className="summary-label">{t('detail.summary.calories')}</div>
              <div className="summary-value">{session.calories}</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">💪</div>
            <div className="summary-content">
              <div className="summary-label">{t('detail.summary.exercises')}</div>
              <div className="summary-value">{session.exercises?.length || 0}</div>
            </div>
          </div>
        </div>

        <div className="exercises-section">
          <h2 className="section-title">{t('detail.exercisesSection')}</h2>
          <div className="exercises-list">
            {session.exercises && session.exercises.length > 0 ? (
              session.exercises.map((exercise, index) => renderExercise(exercise, index))
            ) : (
              <div className="no-exercises">{t('detail.empty.noExercises')}</div>
            )}
          </div>
        </div>

        {session.notes && (
          <div className="notes-section">
            <h2 className="section-title">{t('detail.notesSection')}</h2>
            <div className="notes-content">
              {session.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainingDetail;
