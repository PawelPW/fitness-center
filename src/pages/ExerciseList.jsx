import React, { useState, useEffect } from 'react';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import apiService from '../services/api';
import { TRAINING_TYPES } from '../utils/trainingData';
import '../styles/ExerciseList.css';

function ExerciseList({ onBack }) {
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
      setError('Failed to load exercises');
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
      setError('Please enter an exercise name');
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
      setError(err.message || 'Failed to create exercise');
    }
  };

  const handleEditExercise = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Please enter an exercise name');
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
      setError(err.message || 'Failed to update exercise');
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
    if (!window.confirm('Are you sure you want to delete this exercise?')) {
      return;
    }

    try {
      await apiService.deleteExercise(exerciseId);
      await loadExercises();
    } catch (err) {
      setError(err.message || 'Failed to delete exercise');
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
      {/* Animated Background */}
      <div className="exercise-list-background">
        <div className="gradient-mesh"></div>
        <div className="grid-background"></div>

        {/* Floating Geometric Shapes */}
        <div className="geometric-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
        </div>

        {/* Floating Particles */}
        <div className="particles">
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`}></div>
          ))}
        </div>
      </div>

      <div className="exercise-content">
        <div className="page-header">
          <h1 className="page-title">Exercise Library</h1>
          <p className="page-subtitle">Manage your exercise database</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading exercises...</p>
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
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{exerciseCount.default}</span>
            <span className="stat-label">Default</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{exerciseCount.custom}</span>
            <span className="stat-label">Custom</span>
          </div>
        </div>

        {/* Search and Add */}
        <div className="action-bar">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button
            onClick={() => setShowAddForm(true)}
            className="add-exercise-btn"
          >
            + Add Exercise
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
              <h2 className="form-title">Add New Exercise</h2>
              <p className="form-subtitle">Type: {selectedType}</p>

              <form onSubmit={handleAddExercise}>
                <div className="form-group">
                  <label htmlFor="exerciseName">Exercise Name *</label>
                  <input
                    type="text"
                    id="exerciseName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Incline Dumbbell Press"
                    className="form-input"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="exerciseDescription">Description</label>
                  <textarea
                    id="exerciseDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional: Add instructions or notes about this exercise"
                    className="form-input"
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
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Add Exercise
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
              <h2 className="form-title">Edit Exercise</h2>
              <p className="form-subtitle">Type: {selectedType}</p>

              <form onSubmit={handleEditExercise}>
                <div className="form-group">
                  <label htmlFor="editExerciseName">Exercise Name *</label>
                  <input
                    type="text"
                    id="editExerciseName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Incline Dumbbell Press"
                    className="form-input"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editExerciseDescription">Description</label>
                  <textarea
                    id="editExerciseDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional: Add instructions or notes about this exercise"
                    className="form-input"
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
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Update Exercise
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
                    <span className="custom-badge">Custom</span>
                  )}
                  {exercise.lastWeight && (
                    <div className="exercise-stats">
                      <span>Last: {exercise.lastWeight}kg × {exercise.lastSeries} sets × {exercise.lastRepetitions} reps</span>
                    </div>
                  )}
                </div>
                {exercise.isCustom && (
                  <div className="exercise-actions">
                    <button
                      onClick={() => openEditForm(exercise)}
                      className="edit-btn"
                      title="Edit exercise"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise.id)}
                      className="delete-btn"
                      title="Delete exercise"
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
                ? 'No exercises match your search'
                : 'No exercises in this category yet'}
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
