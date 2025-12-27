import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Charts.css';

function VolumeChart({ data }) {
  const { t } = useTranslation('stats');

  if (!data || data.length === 0) {
    return <div className="chart-empty">{t('volumeChart.noData')}</div>;
  }

  // Calculate min/max for scaling
  const volumes = data.map(d => d.totalVolume);
  const minVolume = Math.min(...volumes);
  const maxVolume = Math.max(...volumes);
  const range = maxVolume - minVolume || 1;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatVolume = (volume) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toFixed(0);
  };

  return (
    <div className="chart-container">
      <div className="chart-y-axis">
        <span className="y-axis-label">{formatVolume(maxVolume)} kg</span>
        <span className="y-axis-label">{formatVolume((maxVolume + minVolume) / 2)} kg</span>
        <span className="y-axis-label">{formatVolume(minVolume)} kg</span>
      </div>

      <div className="chart-bars">
        {data.map((period, index) => {
          const heightPercent = ((period.totalVolume - minVolume) / range) * 100;

          return (
            <div key={index} className="chart-bar-group">
              <div className="chart-bar-wrapper">
                <div
                  className="chart-bar volume-bar"
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                  title={`${formatVolume(period.totalVolume)} kg total volume`}
                >
                  <span className="chart-bar-value">{formatVolume(period.totalVolume)}</span>
                </div>
              </div>
              <div className="chart-bar-label">
                {formatDate(period.periodStart)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color volume-bar"></div>
          <span>{t('volumeChart.legend')}</span>
        </div>
      </div>
    </div>
  );
}

export default VolumeChart;
