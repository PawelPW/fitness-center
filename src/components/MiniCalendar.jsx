import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  generateCalendarGrid,
  getMonthName,
  getDayNames,
  calculateCurrentStreak,
} from '../utils/calendarHelpers';
import './MiniCalendar.css';

function MiniCalendar({ sessions, onClick }) {
  const { t, i18n } = useTranslation('calendar');
  const [currentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get current locale from i18n
  const locale = i18n.language === 'pl' ? 'pl-PL' : 'en-US';

  const calendarGrid = generateCalendarGrid(year, month, sessions);
  const dayNames = getDayNames(locale);
  const currentStreak = calculateCurrentStreak(sessions);

  // Count training days this month
  const trainingDaysThisMonth = calendarGrid.filter(
    day => day.isCurrentMonth && day.sessions.length > 0
  ).length;

  return (
    <div className="mini-calendar-card" onClick={onClick}>
      <div className="mini-calendar-header">
        <div className="mini-calendar-title">
          <span className="calendar-icon">📅</span>
          {t('mini.title')}
        </div>
        <div className="mini-calendar-month">
          {getMonthName(month, locale)} {year}
        </div>
      </div>

      <div className="mini-calendar-grid-container">
        {/* Day names header */}
        <div className="mini-calendar-days-header">
          {dayNames.map(day => (
            <div key={day} className="mini-day-name">
              {day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="mini-calendar-grid">
          {calendarGrid.map((dayData, index) => {
            const hasTraining = dayData.sessions && dayData.sessions.length > 0;
            const isToday = dayData.isToday;
            const isCurrentMonth = dayData.isCurrentMonth;

            return (
              <div
                key={index}
                className={`mini-calendar-day
                  ${!isCurrentMonth ? 'other-month' : ''}
                  ${hasTraining ? 'has-training' : ''}
                  ${isToday ? 'today' : ''}
                `}
              >
                <span className="mini-day-number">{dayData.day}</span>
                {hasTraining && <span className="training-indicator"></span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mini-calendar-stats">
        <div className="mini-stat">
          <span className="mini-stat-icon">🏋️</span>
          <span className="mini-stat-value">{trainingDaysThisMonth}</span>
          <span className="mini-stat-label">{t('mini.days')}</span>
        </div>
        {currentStreak > 0 && (
          <div className="mini-stat">
            <span className="mini-stat-icon">🔥</span>
            <span className="mini-stat-value">{currentStreak}</span>
            <span className="mini-stat-label">{t('mini.streak')}</span>
          </div>
        )}
        <div className="mini-calendar-cta">
          <span>{t('mini.viewDetails')}</span>
          <span className="arrow-icon">→</span>
        </div>
      </div>
    </div>
  );
}

export default MiniCalendar;
