import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { TRAINING_TYPES } from '../utils/trainingData';
import apiService from '../services/api';
import {
  getAllTrainingPrograms,
  deleteTrainingProgram,
  duplicateTrainingProgram,
  getProgramStatistics,
} from '../utils/trainingDatabase';
import { logger } from '../utils/logger';
import '../styles/TrainingList.css';

function TrainingList({ onBack, onCreateTraining, onEditTraining, onStartWorkout }) {
  const { t } = useTranslation('training');
  const swipeHandlers = useSwipeNavigation(onBack);
  const [programs, setPrograms] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [programToClone, setProgramToClone] = useState(null);
  const [cloning, setCloning] = useState(false);

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
      logger.error('Failed to load training programs:', error);
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
        logger.error('Failed to delete training program:', error);
        alert(t('errors.deleteFailed'));
      }
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateTrainingProgram(id);
      await loadPrograms();
    } catch (error) {
      logger.error('Failed to duplicate training program:', error);
      alert(t('errors.duplicateFailed'));
    }
  };

  // Handle edit click - check if it's a system program
  const handleEditClick = (program) => {
    if (program.isSystem) {
      // System program - show clone confirmation modal
      setProgramToClone(program);
      setShowCloneModal(true);
    } else {
      // User's own program - edit directly
      onEditTraining(program);
    }
  };

  // Handle clone and edit for system programs
  const handleCloneAndEdit = async () => {
    if (!programToClone) return;

    setCloning(true);
    try {
      const clonedProgram = await apiService.cloneTrainingProgram(programToClone.id);
      setShowCloneModal(false);
      setProgramToClone(null);
      // Edit the cloned program
      onEditTraining(clonedProgram);
    } catch (error) {
      logger.error('Failed to clone training program:', error);
      alert(t('errors.cloneFailed', 'Failed to create your copy. Please try again.'));
    } finally {
      setCloning(false);
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
                    <div className="program-badges">
                      <span className="program-type-badge" data-type={program.type.toLowerCase()}>
                        {program.type}
                      </span>
                      {program.isSystem && (
                        <span className="program-system-badge">
                          {t('program.defaultBadge', 'Default')}
                        </span>
                      )}
                    </div>
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
                    onClick={() => handleEditClick(program)}
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
                  {!program.isSystem && (
                    <button
                      onClick={() => handleDelete(program.id)}
                      className="btn-danger btn-sm"
                    >
                      {t('actions.delete')}
                    </button>
                  )}
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

        {/* Clone Confirmation Modal */}
        {showCloneModal && programToClone && (
          <div className="modal-overlay" onClick={() => !cloning && setShowCloneModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">{t('cloneModal.title', 'Edit Default Training')}</h2>
              <p className="modal-message">
                {t('cloneModal.message', '"{{name}}" is a default training program. To customize it, we\'ll create your personal copy that you can edit freely.', { name: programToClone.name })}
              </p>
              <p className="modal-note">
                {t('cloneModal.note', 'The original default training will remain unchanged.')}
              </p>
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowCloneModal(false);
                    setProgramToClone(null);
                  }}
                  className="btn-secondary"
                  disabled={cloning}
                >
                  {t('common:cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleCloneAndEdit}
                  className="btn-primary"
                  disabled={cloning}
                >
                  {cloning
                    ? t('cloneModal.creating', 'Creating...')
                    : t('cloneModal.confirm', 'Create My Copy & Edit')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainingList;
