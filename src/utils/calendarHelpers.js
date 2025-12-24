/**
 * Calendar Helper Utilities
 * Date calculations, session mapping, and streak tracking for training calendar
 */

/**
 * Get the first day of a month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Generate calendar grid (42 cells = 6 weeks x 7 days)
 * Returns array of day objects with date info and session data
 */
export function generateCalendarGrid(year, month, sessions = []) {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const grid = [];

  // Previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    grid.push({
      day,
      date,
      isCurrentMonth: false,
      isPrevMonth: true,
      isNextMonth: false,
      sessions: getSessionsForDate(date, sessions),
    });
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    grid.push({
      day,
      date,
      isCurrentMonth: true,
      isPrevMonth: false,
      isNextMonth: false,
      isToday: isToday(date),
      sessions: getSessionsForDate(date, sessions),
    });
  }

  // Next month's leading days (fill to 42 cells)
  const remainingCells = 42 - grid.length;
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    grid.push({
      day,
      date,
      isCurrentMonth: false,
      isPrevMonth: false,
      isNextMonth: true,
      sessions: getSessionsForDate(date, sessions),
    });
  }

  return grid;
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Format date as YYYY-MM-DD (for session matching)
 */
export function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get all sessions for a specific date
 */
export function getSessionsForDate(date, sessions) {
  const dateKey = formatDateKey(date);
  return sessions.filter(session => {
    // Parse session date (could be ISO string or Date object)
    const sessionDate = new Date(session.date || session.session_date);
    const sessionKey = formatDateKey(sessionDate);
    return sessionKey === dateKey && session.completed;
  });
}

/**
 * Calculate current training streak (consecutive days with workouts)
 * Allows 1 rest day between workouts
 */
export function calculateCurrentStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions]
    .filter(s => s.completed)
    .sort((a, b) => {
      const dateA = new Date(a.date || a.session_date);
      const dateB = new Date(b.date || b.session_date);
      return dateB - dateA;
    });

  if (sortedSessions.length === 0) return 0;

  // Get unique training days (remove duplicates on same day)
  const trainingDays = Array.from(
    new Set(sortedSessions.map(s => formatDateKey(new Date(s.date || s.session_date))))
  ).map(key => new Date(key));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecentTraining = new Date(trainingDays[0]);
  mostRecentTraining.setHours(0, 0, 0, 0);

  // Check if most recent training was within last 2 days (allows 1 rest day)
  const daysSinceLastTraining = Math.floor((today - mostRecentTraining) / (1000 * 60 * 60 * 24));
  if (daysSinceLastTraining > 2) return 0; // Streak broken

  // Count consecutive training days (allowing 1 rest day gap)
  let streak = 0;
  let currentDate = new Date(today);
  let consecutiveRestDays = 0;

  for (let i = 0; i < 365; i++) { // Max 1 year lookback
    const dateKey = formatDateKey(currentDate);
    const hasTraining = trainingDays.some(d => formatDateKey(d) === dateKey);

    if (hasTraining) {
      streak++;
      consecutiveRestDays = 0;
    } else {
      consecutiveRestDays++;
      if (consecutiveRestDays > 1) break; // Streak broken after 2 consecutive rest days
    }

    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

/**
 * Calculate monthly stats from sessions
 */
export function calculateMonthlyStats(year, month, sessions) {
  const monthSessions = sessions.filter(session => {
    const sessionDate = new Date(session.date || session.session_date);
    return (
      sessionDate.getFullYear() === year &&
      sessionDate.getMonth() === month &&
      session.completed
    );
  });

  return {
    totalSessions: monthSessions.length,
    totalCalories: monthSessions.reduce((sum, s) => sum + (s.calories || 0), 0),
    totalMinutes: monthSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    totalExercises: monthSessions.reduce((sum, s) => {
      // Count exercises from session if available
      return sum + (s.exerciseCount || 0);
    }, 0),
  };
}

/**
 * Get month name from month number
 */
export function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

/**
 * Get short month name
 */
export function getShortMonthName(month) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month];
}

/**
 * Get day names
 */
export function getDayNames() {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(year, month) {
  if (month === 0) {
    return { year: year - 1, month: 11 };
  }
  return { year, month: month - 1 };
}

/**
 * Navigate to next month
 */
export function getNextMonth(year, month) {
  if (month === 11) {
    return { year: year + 1, month: 0 };
  }
  return { year, month: month + 1 };
}
