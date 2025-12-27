import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { TRAINING_TYPES } from '../utils/trainingData';
import {
  getAllTrainingPrograms,
  deleteTrainingProgram,
  duplicateTrainingProgram,
  getProgramStatistics,
} from '../utils/trainingDatabase';
import '../styles/TrainingList.css';

function TrainingList({ onBack, onCreateTraining, onEditTraining, onStartWorkout }) {
  const { t } = useTranslation('training');
  const swipeHandlers = useSwipeNavigation(onBack);
  const [programs, setPrograms] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    try {
      const allPrograms = await getAllTrainingPrograms();
      setPrograms(allPrograms);
      const programStats = await getProgramStatistics();
      setStats(programStats);
    } catch (error) {
      console.error('Failed to load training programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await deleteTrainingProgram(id);
        await loadPrograms();
      } catch (error) {
        console.error('Failed to delete training program:', error);
        alert(t('errors.deleteFailed'));
      }
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateTrainingProgram(id);
      await loadPrograms();
    } catch (error) {
      console.error('Failed to duplicate training program:', error);
      alert(t('errors.duplicateFailed'));
    }
  };

  const getFilteredPrograms = () => {
    if (filterType === 'all') {
      return programs;
    }
    return programs.filter(p => p.type === filterType);
  };

  const filteredPrograms = getFilteredPrograms();

  return (
    <div {...swipeHandlers} className="training-list-container">
      <div className="training-content">
        <div className="page-header">
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('loading')}</p>
          </div>
        ) : (
          <>
        {/* Statistics */}
        {stats && (
          <div className="training-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">{t('stats.totalPrograms')}</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalExercises}</span>
              <span className="stat-label">{t('stats.totalExercises')}</span>
            </div>
          </div>
        )}

        {/* Filter and Create */}
        <div className="action-bar">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select-field"
          >
            <option value="all">{t('filter.allTypes')}</option>
            {Object.values(TRAINING_TYPES).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button onClick={onCreateTraining} className="btn-primary">
            + {t('actions.createTraining')}
          </button>
        </div>

        {/* Training Programs List */}
        <div className="programs-grid">
          {filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => (
              <div key={program.id} className="program-card">
                <div className="program-header">
                  <div>
                    <h3 className="program-name">{program.name}</h3>
                    <span className="program-type-badge" data-type={program.type.toLowerCase()}>
                      {program.type}
                    </span>
                  </div>
                </div>

                {program.description && (
                  <p className="program-description">{program.description}</p>
                )}

                <div className="program-info">
                  <div className="info-item">
                    <span className="info-icon">💪</span>
                    <span className="info-text">{t('program.exercises_count', { count: program.exercises.length })}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📅</span>
                    <span className="info-text">
                      {t('program.created', { date: new Date(program.createdAt).toLocaleDateString() })}
                    </span>
                  </div>
                </div>

                <div className="program-actions">
                  <button
                    onClick={() => onStartWorkout && onStartWorkout(program)}
                    className="btn-primary btn-sm"
                  >
                    🏋️ {t('actions.startWorkout')}
                  </button>
                  <button
                    onClick={() => onEditTraining(program)}
                    className="btn-secondary btn-sm"
                  >
                    {t('actions.edit')}
                  </button>
                  <button
                    onClick={() => handleDuplicate(program.id)}
                    className="btn-ghost btn-sm"
                  >
                    {t('actions.duplicate')}
                  </button>
                  <button
                    onClick={() => handleDelete(program.id)}
                    className="btn-danger btn-sm"
                  >
                    {t('actions.delete')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-programs">
              <div className="empty-icon">🏋️</div>
              <h3>{t('empty.title')}</h3>
              <p>{t('empty.message')}</p>
              <button onClick={onCreateTraining} className="btn-primary">
                {t('empty.action')}
              </button>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default TrainingList;
