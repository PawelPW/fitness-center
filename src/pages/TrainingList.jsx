import React, { useState, useEffect } from 'react';
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
    if (window.confirm('Are you sure you want to delete this training program?')) {
      try {
        await deleteTrainingProgram(id);
        await loadPrograms();
      } catch (error) {
        console.error('Failed to delete training program:', error);
        alert('Failed to delete training program');
      }
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await duplicateTrainingProgram(id);
      await loadPrograms();
    } catch (error) {
      console.error('Failed to duplicate training program:', error);
      alert('Failed to duplicate training program');
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
          <h1 className="page-title">Training Programs</h1>
          <p className="page-subtitle">Create and manage your workout routines</p>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading training programs...</p>
          </div>
        ) : (
          <>
        {/* Statistics */}
        {stats && (
          <div className="training-stats">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Programs</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalExercises}</span>
              <span className="stat-label">Total Exercises</span>
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
            <option value="all">All Types</option>
            {Object.values(TRAINING_TYPES).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button onClick={onCreateTraining} className="btn-primary">
            + Create Training
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
                    <span className="info-text">{program.exercises.length} exercises</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📅</span>
                    <span className="info-text">
                      Created {new Date(program.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="program-actions">
                  <button
                    onClick={() => onStartWorkout && onStartWorkout(program)}
                    className="btn-primary btn-sm"
                  >
                    🏋️ Start Workout
                  </button>
                  <button
                    onClick={() => onEditTraining(program)}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(program.id)}
                    className="btn-ghost btn-sm"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(program.id)}
                    className="btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-programs">
              <div className="empty-icon">🏋️</div>
              <h3>No training programs yet</h3>
              <p>Create your first training program to get started</p>
              <button onClick={onCreateTraining} className="btn-primary">
                Create Training Program
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
