import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import apiService from '../services/api';
import { TRAINING_TYPES } from '../utils/trainingData';
import '../styles/ExerciseList.css';

function ExerciseList({ onBack }) {
  const { t } = useTranslation(['exercises', 'common']);
  const swipeHandlers = useSwipeNavigation(onBack);
  const [exercises, setExercises] = useState({});
  const [selectedType, setSelectedType] = useState(TRAINING_TYPES.STRENGTH);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exerciseCount, setExerciseCount] = useState({ total: 0, custom: 0, default: 0 });

  useEffect(() => {
    loadExercises();
  }, []);

  useEffect(() => {
    if (exercises[selectedType]) {
      calculateExerciseCount(exercises);
    }
  }, [selectedType, exercises]);

  const loadExercises = async () => {
    try {
      const allExercises = await apiService.getAllExercises();
      setExercises(allExercises);
      calculateExerciseCount(allExercises);
    } catch (err) {
      console.error('Failed to load exercises:', err);
      setError(t('exercises:errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const calculateExerciseCount = (allExercises) => {
    const typeExercises = allExercises[selectedType] || [];
    const custom = typeExercises.filter(ex => ex.isCustom).length;
    const defaultCount = typeExercises.filter(ex => !ex.isCustom).length;
    setExerciseCount({
      total: typeExercises.length,
      custom,
      default: defaultCount,
    });
  };

  const handleAddExercise = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('exercises:errors.nameRequired'));
      return;
    }

    try {
      await apiService.createExercise({
        name: formData.name.trim(),
        description: formData.description.trim(),
        trainingType: selectedType,
      });
      await loadExercises();
      setFormData({ name: '', description: '' });
      setShowAddForm(false);
    } catch (err) {
      setError(err.message || t('exercises:errors.createFailed'));
    }
  };

  const handleEditExercise = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('exercises:errors.nameRequired'));
      return;
    }

    try {
      await apiService.updateExercise(editingExercise.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      await loadExercises();
      setFormData({ name: '', description: '' });
      setShowEditForm(false);
      setEditingExercise(null);
    } catch (err) {
      setError(err.message || t('exercises:errors.updateFailed'));
    }
  };

  const openEditForm = (exercise) => {
    setEditingExercise(exercise);
    setFormData({
      name: exercise.name,
      description: exercise.description || '',
    });
    setShowEditForm(true);
    setError('');
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!window.confirm(t('exercises:confirmDelete'))) {
      return;
    }

    try {
      await apiService.deleteExercise(exerciseId);
      await loadExercises();
    } catch (err) {
      setError(err.message || t('exercises:errors.deleteFailed'));
    }
  };

  const getFilteredExercises = () => {
    const typeExercises = exercises[selectedType] || [];

    if (!searchQuery.trim()) {
      return typeExercises;
    }

    const query = searchQuery.toLowerCase();
    return typeExercises.filter(ex =>
      ex.name.toLowerCase().includes(query)
    );
  };

  const filteredExercises = getFilteredExercises();

  return (
    <div {...swipeHandlers} className="exercise-list-container">
      <div className="exercise-content">
        <div className="page-header">
          <h1 className="page-title">{t('exercises:title')}</h1>
          <p className="page-subtitle">{t('exercises:subtitle')}</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('exercises:loading')}</p>
          </div>
        ) : (
          <>

        {/* Type Selector */}
        <div className="type-selector">
          {Object.values(TRAINING_TYPES).map((type) => (
            <button
              key={type}
              className={`type-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="exercise-stats">
          <div className="stat-item">
            <span className="stat-value">{exerciseCount.total}</span>
            <span className="stat-label">{t('exercises:stats.total')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{exerciseCount.default}</span>
            <span className="stat-label">{t('exercises:stats.default')}</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{exerciseCount.custom}</span>
            <span className="stat-label">{t('exercises:stats.custom')}</span>
          </div>
        </div>

        {/* Search and Add */}
        <div className="action-bar">
          <input
            type="text"
            placeholder={t('exercises:search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
          />
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary"
          >
            + {t('exercises:actions.addExercise')}
          </button>
        </div>

        {/* Add Exercise Form */}
        {showAddForm && (
          <div className="add-form-overlay" onClick={() => {
            setShowAddForm(false);
            setFormData({ name: '', description: '' });
            setError('');
          }}>
            <div className="add-form-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="form-title">{t('exercises:form.addTitle')}</h2>
              <p className="form-subtitle">{t('exercises:form.typeLabel', { type: selectedType })}</p>

              <form onSubmit={handleAddExercise}>
                <div className="form-group">
                  <label htmlFor="exerciseName">{t('exercises:form.nameLabel')}</label>
                  <input
                    type="text"
                    id="exerciseName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('exercises:form.namePlaceholder')}
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="exerciseDescription">{t('exercises:form.descriptionLabel')}</label>
                  <textarea
                    id="exerciseDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('exercises:form.descriptionPlaceholder')}
                    className="input-field"
                    rows="3"
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setFormData({ name: '', description: '' });
                      setError('');
                    }}
                    className="btn-secondary"
                  >
                    {t('common:cancel')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t('exercises:actions.addExercise')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Exercise Form */}
        {showEditForm && editingExercise && (
          <div className="add-form-overlay" onClick={() => {
            setShowEditForm(false);
            setEditingExercise(null);
            setFormData({ name: '', description: '' });
            setError('');
          }}>
            <div className="add-form-card" onClick={(e) => e.stopPropagation()}>
              <h2 className="form-title">{t('exercises:form.editTitle')}</h2>
              <p className="form-subtitle">{t('exercises:form.typeLabel', { type: selectedType })}</p>

              <form onSubmit={handleEditExercise}>
                <div className="form-group">
                  <label htmlFor="editExerciseName">{t('exercises:form.nameLabel')}</label>
                  <input
                    type="text"
                    id="editExerciseName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('exercises:form.namePlaceholder')}
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editExerciseDescription">{t('exercises:form.descriptionLabel')}</label>
                  <textarea
                    id="editExerciseDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('exercises:form.descriptionPlaceholder')}
                    className="input-field"
                    rows="3"
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingExercise(null);
                      setFormData({ name: '', description: '' });
                      setError('');
                    }}
                    className="btn-secondary"
                  >
                    {t('common:cancel')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t('exercises:actions.updateExercise')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="exercises-grid">
          {filteredExercises.length > 0 ? (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className={`exercise-card ${exercise.isCustom ? 'custom' : 'default'}`}
              >
                <div className="exercise-info">
                  <h3 className="exercise-name">{exercise.name}</h3>
                  {exercise.description && (
                    <p className="exercise-description">{exercise.description}</p>
                  )}
                  {exercise.isCustom && (
                    <span className="custom-badge">{t('exercises:card.customBadge')}</span>
                  )}
                  {exercise.lastWeight && (
                    <div className="exercise-stats">
                      <span>{t('exercises:card.lastStats', {
                        weight: exercise.lastWeight,
                        sets: exercise.lastSeries,
                        reps: exercise.lastRepetitions
                      })}</span>
                    </div>
                  )}
                </div>
                {exercise.isCustom && (
                  <div className="exercise-actions">
                    <button
                      onClick={() => openEditForm(exercise)}
                      className="edit-btn"
                      title={t('exercises:card.editTitle')}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise.id)}
                      className="delete-btn"
                      title={t('exercises:card.deleteTitle')}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-exercises">
              {searchQuery
                ? t('exercises:empty.noResults')
                : t('exercises:empty.noExercises')}
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}

export default ExerciseList;
