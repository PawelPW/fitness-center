import React from 'react';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { TRAINING_TYPES } from '../utils/trainingData';
import '../styles/TrainingDetail.css';

function TrainingDetail({ session, onBack }) {
  const swipeHandlers = useSwipeNavigation(onBack);
  if (!session) {
    return (
      <div className="training-detail-container">
        <div className="detail-header">
          <button onClick={onBack} className="back-button">← Back</button>
        </div>
        <div className="no-data">No session data available</div>
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

  const renderStrengthExercise = (exercise, index) => (
    <div key={index} className="exercise-item">
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.exerciseName}</h3>
        <span className="exercise-badge">
          {exercise.sets} sets
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">Reps</span>
          <span className="detail-value">{exercise.reps}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Weight</span>
          <span className="detail-value">{exercise.weight} kg</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Rest</span>
          <span className="detail-value">{exercise.restTime}s</span>
        </div>
      </div>
    </div>
  );

  const renderCalisthenicsExercise = (exercise, index) => (
    <div key={index} className="exercise-item">
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.exerciseName}</h3>
        <span className="exercise-badge bodyweight">
          Bodyweight
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">Sets</span>
          <span className="detail-value">{exercise.sets}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Reps</span>
          <span className="detail-value">{exercise.reps}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Rest</span>
          <span className="detail-value">{exercise.restTime}s</span>
        </div>
      </div>
    </div>
  );

  const renderCardioExercise = (exercise, index) => (
    <div key={index} className="exercise-item cardio">
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.exerciseName}</h3>
        <span className="exercise-badge cardio">
          Cardio
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">Duration</span>
          <span className="detail-value">{exercise.duration} min</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Distance</span>
          <span className="detail-value">{exercise.distance} km</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Calories</span>
          <span className="detail-value">{exercise.calories}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Avg HR</span>
          <span className="detail-value">{exercise.avgHeartRate} bpm</span>
        </div>
      </div>
    </div>
  );

  const renderBoxingExercise = (exercise, index) => (
    <div key={index} className="exercise-item boxing">
      <div className="exercise-header">
        <h3 className="exercise-name">{exercise.exerciseName}</h3>
        <span className="exercise-badge boxing">
          {exercise.rounds} rounds
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">Round Duration</span>
          <span className="detail-value">{exercise.roundDuration} min</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Rest</span>
          <span className="detail-value">{exercise.restBetweenRounds}s</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Calories</span>
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
          {exercise.laps} laps
        </span>
      </div>
      <div className="exercise-details">
        <div className="detail-item">
          <span className="detail-label">Duration</span>
          <span className="detail-value">{exercise.duration} min</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Distance</span>
          <span className="detail-value">{exercise.distance.toFixed(2)} km</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Calories</span>
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
      {/* Animated Background */}
      <div className="training-detail-background">
        <div className="gradient-mesh"></div>
        <div className="grid-background"></div>

        {/* Floating Geometric Shapes */}
        <div className="geometric-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>
      </div>

      <div className="detail-content">
        <div className="session-header">
          <div className="session-type-badge" data-type={session.type.toLowerCase()}>
            {session.type}
          </div>
          <h1 className="session-title">{session.type} Training</h1>
          <p className="session-date">{formatDate(session.date)}</p>
        </div>

        <div className="session-summary">
          <div className="summary-item">
            <div className="summary-icon">⏱️</div>
            <div className="summary-content">
              <div className="summary-label">Duration</div>
              <div className="summary-value">{session.duration} min</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">🔥</div>
            <div className="summary-content">
              <div className="summary-label">Calories</div>
              <div className="summary-value">{session.calories}</div>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-icon">💪</div>
            <div className="summary-content">
              <div className="summary-label">Exercises</div>
              <div className="summary-value">{session.exercises?.length || 0}</div>
            </div>
          </div>
        </div>

        <div className="exercises-section">
          <h2 className="section-title">Exercises</h2>
          <div className="exercises-list">
            {session.exercises && session.exercises.length > 0 ? (
              session.exercises.map((exercise, index) => renderExercise(exercise, index))
            ) : (
              <div className="no-exercises">No exercises recorded</div>
            )}
          </div>
        </div>

        {session.notes && (
          <div className="notes-section">
            <h2 className="section-title">Notes</h2>
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
