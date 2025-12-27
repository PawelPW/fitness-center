import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import {
  generateCalendarGrid,
  getMonthName,
  getDayNames,
  getPreviousMonth,
  getNextMonth,
  calculateCurrentStreak,
  calculateMonthlyStats,
} from '../utils/calendarHelpers';
import apiService from '../services/api';
import '../styles/TrainingCalendar.css';

function TrainingCalendar({ onBack }) {
  const { t } = useTranslation('calendar');
  const swipeHandlers = useSwipeNavigation(onBack);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllSessions();
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    const { year: newYear, month: newMonth } = getPreviousMonth(year, month);
    setCurrentDate(new Date(newYear, newMonth, 1));
  };

  const handleNextMonth = () => {
    const { year: newYear, month: newMonth } = getNextMonth(year, month);
    setCurrentDate(new Date(newYear, newMonth, 1));
  };

  const handleDayClick = (dayData) => {
    if (dayData.sessions && dayData.sessions.length > 0) {
      setSelectedDay(dayData);
      setShowSessionModal(true);
    }
  };

  const calendarGrid = generateCalendarGrid(year, month, sessions);
  const dayNames = getDayNames();
  const currentStreak = calculateCurrentStreak(sessions);
  const monthlyStats = calculateMonthlyStats(year, month, sessions);

  if (loading) {
    return (
      <div className="training-calendar-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div {...swipeHandlers} className="training-calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <button onClick={onBack} className="back-btn">
          ← {t('back')}
        </button>
        <h1 className="calendar-page-title">{t('title')}</h1>
      </div>

      {/* Month Navigation */}
      <div className="month-navigation">
        <button onClick={handlePreviousMonth} className="month-nav-btn">
          ←
        </button>
        <div className="current-month">
          <span className="month-name">{getMonthName(month)}</span>
          <span className="year-name">{year}</span>
        </div>
        <button onClick={handleNextMonth} className="month-nav-btn">
          →
        </button>
      </div>

      {/* Streak and Stats */}
      <div className="calendar-stats-section">
        {currentStreak > 0 && (
          <div className="streak-card">
            <span className="streak-icon">🔥</span>
            <div className="streak-info">
              <span className="streak-number">{currentStreak}</span>
              <span className="streak-label">{t('streak.label')}</span>
            </div>
          </div>
        )}

        <div className="monthly-stats-grid">
          <div className="stat-card">
            <span className="stat-icon">🏋️</span>
            <span className="stat-value">{monthlyStats.totalSessions}</span>
            <span className="stat-label">{t('stats.sessions')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🔥</span>
            <span className="stat-value">{monthlyStats.totalCalories}</span>
            <span className="stat-label">{t('stats.calories')}</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">⏱️</span>
            <span className="stat-value">{monthlyStats.totalMinutes}</span>
            <span className="stat-label">{t('stats.minutes')}</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-content">
        {/* Day names header */}
        <div className="calendar-days-header">
          {dayNames.map(day => (
            <div key={day} className="day-name">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="calendar-grid">
          {calendarGrid.map((dayData, index) => {
            const hasTraining = dayData.sessions && dayData.sessions.length > 0;
            const isToday = dayData.isToday;
            const isCurrentMonth = dayData.isCurrentMonth;

            return (
              <div
                key={index}
                className={`calendar-day
                  ${!isCurrentMonth ? 'other-month' : ''}
                  ${hasTraining ? 'has-training' : ''}
                  ${isToday ? 'today' : ''}
                `}
                onClick={() => handleDayClick(dayData)}
              >
                <span className="day-number">{dayData.day}</span>
                {hasTraining && (
                  <div className="training-indicator">
                    <span className="session-count">{dayData.sessions.length}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Session Details Modal */}
      {showSessionModal && selectedDay && (
        <div className="modal-overlay" onClick={() => setShowSessionModal(false)}>
          <div className="session-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {selectedDay.date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>

            <div className="session-list">
              {selectedDay.sessions.map((session, idx) => (
                <div key={idx} className="session-item">
                  <div className="session-header">
                    <span className="session-type">{session.type || t('modal.workoutDefault')}</span>
                    <span className="session-time">
                      {session.duration || 0} {t('units.min')}
                    </span>
                  </div>
                  <div className="session-details">
                    <span className="session-detail">
                      🔥 {session.calories || 0} {t('units.cal')}
                    </span>
                    {session.exerciseCount && (
                      <span className="session-detail">
                        💪 {t('modal.exercises', { count: session.exerciseCount })}
                      </span>
                    )}
                  </div>
                  {session.notes && (
                    <p className="session-notes">{session.notes}</p>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSessionModal(false)}
              className="modal-close-btn"
            >
              {t('modal.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingCalendar;
