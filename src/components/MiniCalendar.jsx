import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  generateCalendarGrid,
  getMonthName,
  getDayNames,
  calculateCurrentStreak,
  getPlannedSessionsForDate,
  getCompletedSessionsForDate,
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

  // Count completed training days this month
  const completedDaysThisMonth = calendarGrid.filter(
    day => day.isCurrentMonth && getCompletedSessionsForDate(day.date, sessions).length > 0
  ).length;

  // Count planned sessions this month
  const plannedSessionsThisMonth = calendarGrid.reduce((count, day) => {
    if (day.isCurrentMonth) {
      return count + getPlannedSessionsForDate(day.date, sessions).length;
    }
    return count;
  }, 0);

  return (
    <div className="mini-calendar-card" onClick={onClick}>
      <div className="mini-calendar-header">
        <div className="mini-calendar-title">
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
            const planned = getPlannedSessionsForDate(dayData.date, sessions);
            const completed = getCompletedSessionsForDate(dayData.date, sessions);
            const hasPlanned = planned.length > 0;
            const hasCompleted = completed.length > 0;
            const hasAnySession = hasPlanned || hasCompleted;
            const isToday = dayData.isToday;
            const isCurrentMonth = dayData.isCurrentMonth;

            return (
              <div
                key={index}
                className={`mini-calendar-day
                  ${!isCurrentMonth ? 'other-month' : ''}
                  ${hasAnySession ? 'has-session' : ''}
                  ${isToday ? 'today' : ''}
                `}
              >
                <span className="mini-day-number">{dayData.day}</span>

                {/* Dual session indicators */}
                {hasAnySession && (
                  <div className="mini-session-indicators">
                    {/* Completed indicator - solid green dot */}
                    {hasCompleted && (
                      <span
                        className="mini-indicator-dot completed"
                        aria-label={`${completed.length} completed`}
                      />
                    )}

                    {/* Planned indicator - hollow blue ring */}
                    {hasPlanned && (
                      <span
                        className="mini-indicator-dot planned"
                        aria-label={`${planned.length} planned`}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mini-calendar-stats">
        <div className="mini-stat">
          <span className="mini-stat-icon">✓</span>
          <span className="mini-stat-value">{completedDaysThisMonth}</span>
          <span className="mini-stat-label">{t('mini.completed', 'completed')}</span>
        </div>
        {plannedSessionsThisMonth > 0 && (
          <div className="mini-stat">
            <span className="mini-stat-icon">📅</span>
            <span className="mini-stat-value">{plannedSessionsThisMonth}</span>
            <span className="mini-stat-label">{t('mini.planned', 'planned')}</span>
          </div>
        )}
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
