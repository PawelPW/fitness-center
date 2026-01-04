/**
 * Unit Tests for Calendar Helper Utilities (FE-1)
 * Tests for planned session utilities: getPlannedSessionsForDate, getCompletedSessionsForDate, isOverdue
 *
 * To run tests: npm install -D vitest && npm run test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSessionsForDate,
  getPlannedSessionsForDate,
  getCompletedSessionsForDate,
  isOverdue,
  formatDateKey
} from '../calendarHelpers.js';

describe('FE-1: Planned Session Utilities', () => {
  let mockSessions;

  beforeEach(() => {
    // Mock session data for testing
    mockSessions = [
      // Completed sessions on 2026-01-01
      {
        id: '1',
        date: '2026-01-01',
        type: 'Strength',
        completed: true,
        duration: 60,
        calories: 400
      },
      {
        id: '2',
        date: '2026-01-01',
        type: 'Cardio',
        completed: true,
        duration: 30,
        calories: 200
      },
      // Planned session on 2026-01-01
      {
        id: '3',
        date: '2026-01-01',
        type: 'Boxing',
        completed: false,
        duration: null,
        calories: null
      },
      // Completed session on 2026-01-05
      {
        id: '4',
        date: '2026-01-05',
        type: 'Swimming',
        completed: true,
        duration: 45,
        calories: 350
      },
      // Planned session on 2026-01-05
      {
        id: '5',
        date: '2026-01-05',
        type: 'Calisthenics',
        completed: false,
        duration: null,
        calories: null
      },
      // Overdue planned session (past date)
      {
        id: '6',
        date: '2025-12-30',
        type: 'Strength',
        completed: false,
        duration: null,
        calories: null
      },
      // Future planned session
      {
        id: '7',
        date: '2026-02-15',
        type: 'Cardio',
        completed: false,
        duration: null,
        calories: null
      }
    ];
  });

  describe('getSessionsForDate()', () => {
    it('should return all sessions (planned + completed) for a specific date', () => {
      const date = new Date('2026-01-01');
      const sessions = getSessionsForDate(date, mockSessions);

      expect(sessions).toHaveLength(3); // 2 completed + 1 planned
      expect(sessions.map(s => s.id)).toEqual(['1', '2', '3']);
    });

    it('should return empty array if no sessions on date', () => {
      const date = new Date('2026-01-15');
      const sessions = getSessionsForDate(date, mockSessions);

      expect(sessions).toHaveLength(0);
    });

    it('should handle date with only completed sessions', () => {
      const date = new Date('2026-01-05');
      const allSessions = mockSessions.filter(s => s.date === '2026-01-05');

      // Remove the planned session from mock for this test
      const sessionsWithOnlyCompleted = mockSessions.filter(s => s.id !== '5');
      const sessions = getSessionsForDate(date, sessionsWithOnlyCompleted);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].completed).toBe(true);
    });

    it('should handle date with only planned sessions', () => {
      const date = new Date('2026-02-15');
      const sessions = getSessionsForDate(date, mockSessions);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].completed).toBe(false);
    });

    it('should handle session_date property (legacy format)', () => {
      const sessionsWithSessionDate = [
        {
          id: '1',
          session_date: '2026-01-10',
          type: 'Strength',
          completed: true
        }
      ];

      const date = new Date('2026-01-10');
      const sessions = getSessionsForDate(date, sessionsWithSessionDate);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('1');
    });
  });

  describe('getCompletedSessionsForDate()', () => {
    it('should return only completed sessions for a specific date', () => {
      const date = new Date('2026-01-01');
      const sessions = getCompletedSessionsForDate(date, mockSessions);

      expect(sessions).toHaveLength(2); // Only completed
      expect(sessions.every(s => s.completed === true)).toBe(true);
      expect(sessions.map(s => s.id)).toEqual(['1', '2']);
    });

    it('should return empty array if no completed sessions on date', () => {
      const date = new Date('2026-02-15'); // Only planned session
      const sessions = getCompletedSessionsForDate(date, mockSessions);

      expect(sessions).toHaveLength(0);
    });

    it('should filter out planned sessions', () => {
      const date = new Date('2026-01-05');
      const sessions = getCompletedSessionsForDate(date, mockSessions);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('4'); // Only completed session
      expect(sessions[0].completed).toBe(true);
    });

    it('should handle empty sessions array', () => {
      const date = new Date('2026-01-01');
      const sessions = getCompletedSessionsForDate(date, []);

      expect(sessions).toHaveLength(0);
    });
  });

  describe('getPlannedSessionsForDate()', () => {
    it('should return only planned sessions for a specific date', () => {
      const date = new Date('2026-01-01');
      const sessions = getPlannedSessionsForDate(date, mockSessions);

      expect(sessions).toHaveLength(1); // Only planned
      expect(sessions.every(s => s.completed === false)).toBe(true);
      expect(sessions[0].id).toBe('3');
    });

    it('should return empty array if no planned sessions on date', () => {
      const date = new Date('2026-01-05');
      // Filter to only completed session on 2026-01-05
      const sessionsWithOnlyCompleted = mockSessions.filter(s => s.id !== '5');
      const sessions = getPlannedSessionsForDate(date, sessionsWithOnlyCompleted);

      expect(sessions).toHaveLength(0);
    });

    it('should filter out completed sessions', () => {
      const date = new Date('2026-01-05');
      const sessions = getPlannedSessionsForDate(date, mockSessions);

      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe('5'); // Only planned session
      expect(sessions[0].completed).toBe(false);
    });

    it('should handle multiple planned sessions on same date', () => {
      const multiPlannedSessions = [
        ...mockSessions,
        {
          id: '8',
          date: '2026-01-01',
          type: 'Swimming',
          completed: false
        }
      ];

      const date = new Date('2026-01-01');
      const sessions = getPlannedSessionsForDate(date, multiPlannedSessions);

      expect(sessions).toHaveLength(2); // Two planned sessions
      expect(sessions.map(s => s.id)).toEqual(['3', '8']);
    });

    it('should handle empty sessions array', () => {
      const date = new Date('2026-01-01');
      const sessions = getPlannedSessionsForDate(date, []);

      expect(sessions).toHaveLength(0);
    });
  });

  describe('isOverdue()', () => {
    // Mock current date for consistent testing
    const originalDate = Date;

    beforeEach(() => {
      // Mock Date to always return 2026-01-01 as "today"
      global.Date = class extends originalDate {
        constructor(...args) {
          if (args.length === 0) {
            return new originalDate('2026-01-01T12:00:00Z');
          }
          return new originalDate(...args);
        }
        static now() {
          return new originalDate('2026-01-01T12:00:00Z').getTime();
        }
      };
    });

    afterEach(() => {
      global.Date = originalDate;
    });

    it('should return true for planned session with past date', () => {
      const overdueSession = {
        id: '6',
        date: '2025-12-30',
        type: 'Strength',
        completed: false
      };

      expect(isOverdue(overdueSession)).toBe(true);
    });

    it('should return false for completed session with past date', () => {
      const completedSession = {
        id: '1',
        date: '2025-12-30',
        type: 'Strength',
        completed: true
      };

      expect(isOverdue(completedSession)).toBe(false);
    });

    it('should return false for planned session on today', () => {
      const todaySession = {
        id: '3',
        date: '2026-01-01',
        type: 'Boxing',
        completed: false
      };

      expect(isOverdue(todaySession)).toBe(false);
    });

    it('should return false for planned session in the future', () => {
      const futureSession = {
        id: '7',
        date: '2026-02-15',
        type: 'Cardio',
        completed: false
      };

      expect(isOverdue(futureSession)).toBe(false);
    });

    it('should return true for planned session 1 day in the past', () => {
      const yesterdaySession = {
        id: '8',
        date: '2025-12-31', // Yesterday (today is 2026-01-01)
        type: 'Swimming',
        completed: false
      };

      expect(isOverdue(yesterdaySession)).toBe(true);
    });

    it('should handle session_date property (legacy format)', () => {
      const overdueSessionLegacy = {
        id: '9',
        session_date: '2025-12-25',
        type: 'Calisthenics',
        completed: false
      };

      expect(isOverdue(overdueSessionLegacy)).toBe(true);
    });

    it('should return false for completed session regardless of date', () => {
      const completedFutureSession = {
        id: '10',
        date: '2026-02-15',
        type: 'Strength',
        completed: true
      };

      expect(isOverdue(completedFutureSession)).toBe(false);
    });

    it('should handle session with date far in the past', () => {
      const veryOldSession = {
        id: '11',
        date: '2025-01-01',
        type: 'Cardio',
        completed: false
      };

      expect(isOverdue(veryOldSession)).toBe(true);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle sessions with Date objects instead of strings', () => {
      const sessionsWithDateObjects = [
        {
          id: '1',
          date: new Date('2026-01-01'),
          completed: true
        },
        {
          id: '2',
          date: new Date('2026-01-01'),
          completed: false
        }
      ];

      const date = new Date('2026-01-01');
      const allSessions = getSessionsForDate(date, sessionsWithDateObjects);
      const completed = getCompletedSessionsForDate(date, sessionsWithDateObjects);
      const planned = getPlannedSessionsForDate(date, sessionsWithDateObjects);

      expect(allSessions).toHaveLength(2);
      expect(completed).toHaveLength(1);
      expect(planned).toHaveLength(1);
    });

    it('should handle malformed session data gracefully', () => {
      const malformedSessions = [
        {
          id: '1',
          // Missing date
          completed: true
        },
        {
          id: '2',
          date: null,
          completed: false
        }
      ];

      const date = new Date('2026-01-01');

      // Should not throw errors
      expect(() => {
        getSessionsForDate(date, malformedSessions);
        getCompletedSessionsForDate(date, malformedSessions);
        getPlannedSessionsForDate(date, malformedSessions);
      }).not.toThrow();
    });

    it('should correctly separate planned and completed when using getSessionsForDate', () => {
      const date = new Date('2026-01-01');
      const allSessions = getSessionsForDate(date, mockSessions);
      const completedSessions = getCompletedSessionsForDate(date, mockSessions);
      const plannedSessions = getPlannedSessionsForDate(date, mockSessions);

      // Verify total matches sum of parts
      expect(allSessions.length).toBe(completedSessions.length + plannedSessions.length);

      // Verify no overlap
      const completedIds = completedSessions.map(s => s.id);
      const plannedIds = plannedSessions.map(s => s.id);
      const allIds = allSessions.map(s => s.id);

      expect(allIds.sort()).toEqual([...completedIds, ...plannedIds].sort());
    });
  });
});
