import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Charts.css';

function ProgressionChart({ data }) {
  const { t } = useTranslation('stats');

  if (!data || data.length === 0) {
    return <div className="chart-empty">{t('progressionChart.noData')}</div>;
  }

  // Reverse to show oldest to newest
  const sortedData = [...data].reverse();

  // Calculate min/max for scaling
  const weights = sortedData.map(s => s.maxWeight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight || 1; // Avoid division by zero

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chart-container">
      <div className="chart-y-axis">
        <span className="y-axis-label">{maxWeight.toFixed(0)} kg</span>
        <span className="y-axis-label">{((maxWeight + minWeight) / 2).toFixed(0)} kg</span>
        <span className="y-axis-label">{minWeight.toFixed(0)} kg</span>
      </div>

      <div className="chart-bars">
        {sortedData.map((session, index) => {
          const heightPercent = ((session.maxWeight - minWeight) / range) * 100;

          return (
            <div key={session.sessionId} className="chart-bar-group">
              <div className="chart-bar-wrapper">
                <div
                  className="chart-bar"
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                  title={`${session.maxWeight} kg on ${formatDate(session.sessionDate)}`}
                >
                  <span className="chart-bar-value">{session.maxWeight.toFixed(0)}</span>
                </div>
              </div>
              <div className="chart-bar-label">
                {index % 3 === 0 ? formatDate(session.sessionDate) : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressionChart;
