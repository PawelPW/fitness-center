import React, { useState, useEffect } from 'react';
import './SetLogger.css';

function SetLogger({
  exercise,
  onAddSet,
  onEditSet,
  onDeleteSet,
  suggestedWeight,
  suggestedReps,
}) {
  const [weight, setWeight] = useState(suggestedWeight || 0);
  const [reps, setReps] = useState(suggestedReps || 0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSet, setEditingSet] = useState(null);

  // Update weight/reps when suggestions change
  useEffect(() => {
    setWeight(suggestedWeight || 0);
    setReps(suggestedReps || 0);
  }, [suggestedWeight, suggestedReps]);

  const handleAddSet = () => {
    const weightValue = parseFloat(weight) || 0;
    const repsValue = parseInt(reps) || 0;

    // Require at least weight OR reps to be greater than 0
    if (weightValue === 0 && repsValue === 0) {
      alert('Please enter at least weight or reps (both cannot be zero)');
      return;
    }

    onAddSet(weightValue, repsValue);

    // Keep same values for next set (user can adjust if needed)
    // Weight typically stays same or decreases, reps typically same or decrease
  };

  const handleEditSetClick = (set) => {
    setEditingSet(set);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (editingSet && onEditSet) {
      onEditSet(editingSet.setNumber, parseFloat(editingSet.weight), parseInt(editingSet.reps));
      setShowEditModal(false);
      setEditingSet(null);
    }
  };

  const handleDeleteSetClick = (setNumber) => {
    if (window.confirm('Delete this set?')) {
      onDeleteSet(setNumber);
    }
  };

  const adjustWeight = (amount) => {
    setWeight(prev => Math.max(0, (parseFloat(prev) || 0) + amount));
  };

  const adjustReps = (amount) => {
    setReps(prev => Math.max(0, (parseInt(prev) || 0) + amount));
  };

  const currentSetNumber = exercise.completedSets.length + 1;
  const isPlannedSetsComplete = exercise.completedSets.length >= exercise.plannedSets;

  return (
    <div className="set-logger">
      {/* Previous Performance */}
      {exercise.previousWeight && (
        <div className="previous-performance">
          <span className="previous-label">Last Workout:</span>
          <span className="previous-value">
            {exercise.previousSets} sets × {exercise.previousReps} reps @ {exercise.previousWeight}kg
          </span>
        </div>
      )}

      {/* Current Set Input */}
      <div className="current-set-section">
        <div className="set-header">
          <h3 className="set-title">
            Set {currentSetNumber}
            {exercise.plannedSets > 0 && ` of ${exercise.plannedSets}`}
          </h3>
          {isPlannedSetsComplete && (
            <span className="extra-set-badge">Extra Set</span>
          )}
        </div>

        {/* Weight Input with Quick Adjustments */}
        <div className="input-section">
          <label className="input-label">Weight (kg)</label>
          <div className="weight-input-group">
            <button
              className="adjust-btn"
              onClick={() => adjustWeight(-10)}
              type="button"
            >
              -10
            </button>
            <button
              className="adjust-btn"
              onClick={() => adjustWeight(-2.5)}
              type="button"
            >
              -2.5
            </button>
            <input
              type="number"
              className="set-input weight-input"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              step="0.5"
              min="0"
              placeholder="0"
            />
            <button
              className="adjust-btn"
              onClick={() => adjustWeight(2.5)}
              type="button"
            >
              +2.5
            </button>
            <button
              className="adjust-btn"
              onClick={() => adjustWeight(10)}
              type="button"
            >
              +10
            </button>
          </div>
        </div>

        {/* Reps Input with Quick Adjustments */}
        <div className="input-section">
          <label className="input-label">Reps</label>
          <div className="reps-input-group">
            <button
              className="adjust-btn"
              onClick={() => adjustReps(-1)}
              type="button"
            >
              -1
            </button>
            <input
              type="number"
              className="set-input reps-input"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              min="0"
              placeholder="0"
            />
            <button
              className="adjust-btn"
              onClick={() => adjustReps(1)}
              type="button"
            >
              +1
            </button>
          </div>
          {exercise.plannedReps > 0 && (
            <span className="planned-hint">Planned: {exercise.plannedReps} reps</span>
          )}
        </div>

        {/* Add Set Button */}
        <button
          className="add-set-btn"
          onClick={handleAddSet}
          type="button"
        >
          <span className="btn-icon">✓</span>
          Add Set
        </button>
      </div>

      {/* Completed Sets List */}
      {exercise.completedSets.length > 0 && (
        <div className="completed-sets-section">
          <h4 className="completed-sets-title">Completed Sets</h4>
          <div className="completed-sets-list">
            {exercise.completedSets.map((set) => (
              <div key={set.setNumber} className="completed-set-item">
                <div className="set-info">
                  <span className="set-number">Set {set.setNumber}</span>
                  <span className="set-details">
                    {set.weight}kg × {set.reps} reps
                  </span>
                </div>
                <div className="set-actions">
                  <button
                    className="edit-set-btn"
                    onClick={() => handleEditSetClick(set)}
                    type="button"
                  >
                    ✏️
                  </button>
                  <button
                    className="delete-set-btn"
                    onClick={() => handleDeleteSetClick(set.setNumber)}
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Set Summary */}
          <div className="set-summary">
            <div className="summary-stat">
              <span className="summary-label">Total Volume:</span>
              <span className="summary-value">
                {exercise.completedSets.reduce((sum, set) =>
                  sum + (set.weight * set.reps), 0
                ).toFixed(1)}kg
              </span>
            </div>
            <div className="summary-stat">
              <span className="summary-label">Avg Weight:</span>
              <span className="summary-value">
                {(exercise.completedSets.reduce((sum, set) =>
                  sum + set.weight, 0) / exercise.completedSets.length
                ).toFixed(1)}kg
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Set Modal */}
      {showEditModal && editingSet && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Set {editingSet.setNumber}</h3>

            <div className="modal-input-group">
              <label className="modal-label">Weight (kg)</label>
              <input
                type="number"
                className="modal-input"
                value={editingSet.weight}
                onChange={(e) => setEditingSet({
                  ...editingSet,
                  weight: parseFloat(e.target.value) || 0
                })}
                step="0.5"
                min="0"
              />
            </div>

            <div className="modal-input-group">
              <label className="modal-label">Reps</label>
              <input
                type="number"
                className="modal-input"
                value={editingSet.reps}
                onChange={(e) => setEditingSet({
                  ...editingSet,
                  reps: parseInt(e.target.value) || 0
                })}
                min="0"
              />
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn save-btn"
                onClick={handleSaveEdit}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SetLogger;
