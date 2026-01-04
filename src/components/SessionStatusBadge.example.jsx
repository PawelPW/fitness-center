import React from 'react';
import SessionStatusBadge from './SessionStatusBadge';

/**
 * SessionStatusBadge Usage Examples
 *
 * This file demonstrates various ways to use the SessionStatusBadge component
 * in different contexts throughout your fitness app.
 */

// ========================================
// EXAMPLE 1: Basic Usage
// ========================================

function BasicExample() {
  const completedSession = {
    id: 1,
    type: 'Strength Training',
    date: '2025-12-20',
    completed: true
  };

  const overdueSession = {
    id: 2,
    type: 'Cardio',
    date: '2025-12-15',
    completed: false
  };

  const plannedSession = {
    id: 3,
    type: 'Yoga',
    date: '2026-01-05',
    completed: false
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '12px' }}>
      <SessionStatusBadge session={completedSession} />
      <SessionStatusBadge session={overdueSession} />
      <SessionStatusBadge session={plannedSession} />
    </div>
  );
}

// ========================================
// EXAMPLE 2: Size Variants
// ========================================

function SizeVariantsExample() {
  const session = {
    id: 1,
    date: '2025-12-20',
    completed: true
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3>Small Size (Calendar cells, compact lists)</h3>
        <SessionStatusBadge session={session} size="small" />
      </div>

      <div>
        <h3>Medium Size (Default - Cards, general use)</h3>
        <SessionStatusBadge session={session} size="medium" />
      </div>

      <div>
        <h3>Large Size (Headers, modals, emphasis)</h3>
        <SessionStatusBadge session={session} size="large" />
      </div>
    </div>
  );
}

// ========================================
// EXAMPLE 3: Icon & Label Variants
// ========================================

function IconLabelVariantsExample() {
  const session = {
    id: 1,
    date: '2026-01-05',
    completed: false
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
      <div>
        <p>Icon + Label (Default)</p>
        <SessionStatusBadge session={session} />
      </div>

      <div>
        <p>Icon Only</p>
        <SessionStatusBadge session={session} showLabel={false} />
      </div>

      <div>
        <p>Label Only</p>
        <SessionStatusBadge session={session} showIcon={false} />
      </div>
    </div>
  );
}

// ========================================
// EXAMPLE 4: Calendar Day Cell
// ========================================

function CalendarDayCellExample() {
  const sessions = [
    {
      id: 1,
      type: 'Strength Training',
      date: '2026-01-02',
      completed: true,
      duration: 45
    },
    {
      id: 2,
      type: 'Cardio',
      date: '2026-01-02',
      completed: false,
      duration: 30
    }
  ];

  return (
    <div className="calendar-day" style={{
      padding: '8px',
      background: 'var(--graphite-900)',
      borderRadius: '8px',
      minWidth: '120px'
    }}>
      <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
        Jan 2
      </div>
      {sessions.map(session => (
        <div key={session.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '6px',
          fontSize: '12px'
        }}>
          <SessionStatusBadge session={session} size="small" showLabel={false} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {session.type}
          </span>
        </div>
      ))}
    </div>
  );
}

// ========================================
// EXAMPLE 5: Session Card Header
// ========================================

function SessionCardHeaderExample() {
  const session = {
    id: 1,
    type: 'Strength Training',
    date: '2025-12-20',
    completed: true,
    duration: 45,
    calories: 320
  };

  return (
    <div className="session-card" style={{
      background: 'var(--graphite-900)',
      borderRadius: '12px',
      padding: '16px',
      maxWidth: '400px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          {session.type}
        </h3>
        <SessionStatusBadge session={session} size="medium" />
      </div>

      <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: 'var(--text-tertiary)' }}>
        <span>{session.duration} min</span>
        <span>{session.calories} cal</span>
      </div>
    </div>
  );
}

// ========================================
// EXAMPLE 6: Dashboard Upcoming Workout
// ========================================

function DashboardUpcomingWorkoutExample() {
  const session = {
    id: 1,
    type: 'Leg Day',
    date: '2026-01-03',
    completed: false,
    duration: 60
  };

  return (
    <div className="upcoming-workout-widget" style={{
      background: 'var(--gradient-surface)',
      borderRadius: '16px',
      padding: '20px',
      maxWidth: '300px'
    }}>
      <SessionStatusBadge session={session} size="large" className="badge-standalone" />

      <div style={{ marginTop: '12px' }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 700 }}>
          {session.type}
        </h4>
        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '14px' }}>
          Tomorrow • {session.duration} min
        </p>
      </div>

      <button style={{
        marginTop: '16px',
        width: '100%',
        padding: '10px',
        background: 'var(--orange-600)',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: 'pointer'
      }}>
        Start Workout
      </button>
    </div>
  );
}

// ========================================
// EXAMPLE 7: Session List Item
// ========================================

function SessionListItemExample() {
  const sessions = [
    { id: 1, type: 'Strength Training', date: '2025-12-20', completed: true, calories: 320 },
    { id: 2, type: 'Cardio', date: '2025-12-18', completed: false, calories: 0 },
    { id: 3, type: 'Yoga', date: '2026-01-05', completed: false, calories: 0 }
  ];

  return (
    <div style={{ maxWidth: '400px' }}>
      {sessions.map(session => (
        <div key={session.id} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px',
          background: 'var(--graphite-900)',
          borderRadius: '8px',
          marginBottom: '8px'
        }}>
          <SessionStatusBadge session={session} size="small" />

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>{session.type}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {session.completed && (
            <div style={{ fontSize: '12px', color: 'var(--text-quaternary)' }}>
              {session.calories} cal
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ========================================
// EXAMPLE 8: Responsive Grid
// ========================================

function ResponsiveGridExample() {
  const sessions = [
    { id: 1, type: 'Strength', date: '2025-12-20', completed: true },
    { id: 2, type: 'Cardio', date: '2025-12-18', completed: false },
    { id: 3, type: 'Yoga', date: '2026-01-05', completed: false },
    { id: 4, type: 'HIIT', date: '2026-01-04', completed: false }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '12px',
      padding: '20px'
    }}>
      {sessions.map(session => (
        <div key={session.id} style={{
          background: 'var(--graphite-900)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <SessionStatusBadge session={session} size="medium" className="badge-standalone" />
          <h4 style={{ margin: '12px 0 4px', fontSize: '16px' }}>{session.type}</h4>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
        </div>
      ))}
    </div>
  );
}

// ========================================
// EXPORT ALL EXAMPLES
// ========================================

export {
  BasicExample,
  SizeVariantsExample,
  IconLabelVariantsExample,
  CalendarDayCellExample,
  SessionCardHeaderExample,
  DashboardUpcomingWorkoutExample,
  SessionListItemExample,
  ResponsiveGridExample
};

// Default example component showing all variants
export default function SessionStatusBadgeExamples() {
  return (
    <div style={{
      background: 'var(--graphite-950)',
      color: 'var(--text-primary)',
      padding: '40px',
      fontFamily: 'var(--font-primary)'
    }}>
      <h1 style={{ marginBottom: '40px' }}>SessionStatusBadge Examples</h1>

      <section style={{ marginBottom: '40px' }}>
        <h2>Basic Usage</h2>
        <BasicExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Size Variants</h2>
        <SizeVariantsExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Icon & Label Variants</h2>
        <IconLabelVariantsExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Calendar Day Cell</h2>
        <CalendarDayCellExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Session Card Header</h2>
        <SessionCardHeaderExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Dashboard Widget</h2>
        <DashboardUpcomingWorkoutExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Session List</h2>
        <SessionListItemExample />
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2>Responsive Grid</h2>
        <ResponsiveGridExample />
      </section>
    </div>
  );
}
