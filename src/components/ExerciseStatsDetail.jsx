import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import VolumeChart from './VolumeChart';
import ProgressionChart from './ProgressionChart';
import '../styles/ExerciseStatsDetail.css';

function ExerciseStatsDetail({ exerciseName, onBack }) {
  const [history, setHistory] = useState([]);
  const [prs, setPRs] = useState(null);
  const [volumeData, setVolumeData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'progression', 'volume'

  useEffect(() => {
    loadAllData();
  }, [exerciseName]);

  useEffect(() => {
    if (activeTab === 'volume') {
      loadVolumeData();
    }
  }, [selectedPeriod, activeTab]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [historyData, prsData] = await Promise.all([
        apiService.getExerciseHistory(exerciseName, 50),
        apiService.getExercisePRs(exerciseName)
      ]);
      setHistory(historyData.history || []);
      setPRs(prsData.personalRecords || {});
    } catch (err) {
      console.error('Failed to load exercise data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVolumeData = async () => {
    try {
      const data = await apiService.getVolumeStats(exerciseName, selectedPeriod, 'week');
      setVolumeData(data);
    } catch (err) {
      console.error('Failed to load volume data:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="exercise-detail-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading exercise data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exercise-detail-container">
      <header className="detail-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h1 className="detail-title">{exerciseName}</h1>
      </header>

      {/* Personal Records Section */}
      {prs && (prs.maxWeight || prs.maxReps || prs.maxVolumeSession) && (
        <section className="prs-section">
          <h2 className="section-title">Personal Records</h2>
          <div className="prs-grid">
            {prs.maxWeight && (
              <div className="pr-card">
                <div className="pr-icon">🏆</div>
                <div className="pr-label">Max Weight</div>
                <div className="pr-value">{prs.maxWeight.value} kg</div>
                <div className="pr-date">{formatDate(prs.maxWeight.achievedDate)}</div>
              </div>
            )}
            {prs.maxReps && (
              <div className="pr-card">
                <div className="pr-icon">💪</div>
                <div className="pr-label">Max Reps</div>
                <div className="pr-value">{prs.maxReps.value}</div>
                <div className="pr-date">{formatDate(prs.maxReps.achievedDate)}</div>
              </div>
            )}
            {prs.maxVolumeSession && (
              <div className="pr-card">
                <div className="pr-icon">📈</div>
                <div className="pr-label">Max Volume</div>
                <div className="pr-value">{prs.maxVolumeSession.value.toFixed(0)} kg</div>
                <div className="pr-date">{formatDate(prs.maxVolumeSession.achievedDate)}</div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`tab-btn ${activeTab === 'progression' ? 'active' : ''}`}
          onClick={() => setActiveTab('progression')}
        >
          Progression
        </button>
        <button
          className={`tab-btn ${activeTab === 'volume' ? 'active' : ''}`}
          onClick={() => setActiveTab('volume')}
        >
          Volume
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'history' && (
          <section className="history-section">
            <h2 className="section-title">Session History</h2>
            {history.length === 0 ? (
              <p className="empty-message">No session history available</p>
            ) : (
              <div className="history-list">
                {history.map((session) => (
                  <div key={session.sessionId} className="history-item">
                    <div className="history-date">{formatDate(session.sessionDate)}</div>
                    <div className="history-stats">
                      <span className="history-stat">
                        <strong>{session.totalSets}</strong> sets
                      </span>
                      <span className="history-stat">
                        <strong>{session.avgWeight.toFixed(1)}</strong> kg avg
                      </span>
                      <span className="history-stat">
                        <strong>{session.totalVolume.toFixed(0)}</strong> kg volume
                      </span>
                    </div>
                    {session.sets && session.sets.length > 0 && (
                      <div className="history-sets">
                        {session.sets.map((set) => (
                          <div key={set.setNumber} className="set-chip">
                            {set.reps} × {set.weight}kg
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'progression' && (
          <section className="progression-section">
            <h2 className="section-title">Weight Progression</h2>
            <ProgressionChart data={history} />
          </section>
        )}

        {activeTab === 'volume' && (
          <section className="volume-section">
            <div className="volume-header">
              <h2 className="section-title">Volume Over Time</h2>
              <div className="period-selector">
                <button
                  className={`period-btn ${selectedPeriod === 'month' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('month')}
                >
                  Month
                </button>
                <button
                  className={`period-btn ${selectedPeriod === 'year' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('year')}
                >
                  Year
                </button>
                <button
                  className={`period-btn ${selectedPeriod === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod('all')}
                >
                  All Time
                </button>
              </div>
            </div>
            {volumeData && <VolumeChart data={volumeData.data} />}
          </section>
        )}
      </div>
    </div>
  );
}

export default ExerciseStatsDetail;
