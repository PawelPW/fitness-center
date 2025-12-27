import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import ExerciseStatsDetail from '../components/ExerciseStatsDetail';
import '../styles/ExerciseStats.css';

function ExerciseStats({ onBack }) {
  const { t } = useTranslation('stats');
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadExerciseStats();
  }, []);

  const loadExerciseStats = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllExerciseStats();
      setExercises(data.exercises);
    } catch (err) {
      console.error('Failed to load exercise stats:', err);
      setError(t('exerciseStats.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('exerciseStats.dateRelative.today');
    if (diffDays === 1) return t('exerciseStats.dateRelative.yesterday');
    if (diffDays < 7) return t('exerciseStats.dateRelative.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('exerciseStats.dateRelative.weeksAgo', { count: Math.floor(diffDays / 7) });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (selectedExercise) {
    return (
      <ExerciseStatsDetail
        exerciseName={selectedExercise}
        onBack={() => setSelectedExercise(null)}
      />
    );
  }

  return (
    <div className="exercise-stats-container">
      <header className="stats-header">
        <button onClick={onBack} className="back-btn">← {t('exerciseStats.back')}</button>
        <h1 className="stats-title">{t('exerciseStats.title')}</h1>
      </header>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('exerciseStats.loading')}</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={loadExerciseStats} className="btn-primary">
            {t('exerciseStats.retry')}
          </button>
        </div>
      ) : exercises.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>{t('exerciseStats.empty.title')}</h3>
          <p>{t('exerciseStats.empty.message')}</p>
        </div>
      ) : (
        <div className="exercise-stats-grid">
          {exercises.map((exercise) => (
            <div
              key={exercise.exerciseName}
              className="exercise-stat-card"
              onClick={() => setSelectedExercise(exercise.exerciseName)}
            >
              <div className="exercise-stat-header">
                <h3 className="exercise-stat-name">{exercise.exerciseName}</h3>
                <div className="exercise-stat-badge">
                  {t('exerciseStats.badges.sessions', { count: exercise.totalSessions })}
                </div>
              </div>

              <div className="exercise-stat-metrics">
                <div className="stat-metric">
                  <div className="stat-metric-label">{t('exerciseStats.metrics.totalVolume')}</div>
                  <div className="stat-metric-value">
                    {formatVolume(exercise.totalVolume)} {t('exerciseStats.units.kg')}
                  </div>
                </div>

                <div className="stat-metric">
                  <div className="stat-metric-label">{t('exerciseStats.metrics.totalSets')}</div>
                  <div className="stat-metric-value">
                    {exercise.totalSets}
                  </div>
                </div>

                <div className="stat-metric">
                  <div className="stat-metric-label">{t('exerciseStats.metrics.maxWeight')}</div>
                  <div className="stat-metric-value">
                    {exercise.maxWeight} {t('exerciseStats.units.kg')}
                  </div>
                </div>
              </div>

              <div className="exercise-stat-footer">
                <span className="last-performed">
                  {t('exerciseStats.lastPerformed', { date: formatDate(exercise.lastPerformed) })}
                </span>
                <span className="view-details-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExerciseStats;
