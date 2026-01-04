import React, { useState } from 'react';
import PlannedSessionCard from './PlannedSessionCard';
import './PlannedSessionCard.css';

/**
 * PlannedSessionCard Usage Examples
 *
 * This file demonstrates various use cases for the PlannedSessionCard component.
 * Use these examples as reference when integrating the component into your app.
 */

const PlannedSessionCardExamples = () => {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Example 1: Today's planned session with scheduled time
  const todaySession = {
    id: '1',
    type: 'Strength',
    date: new Date().toISOString().split('T')[0], // Today's date
    scheduled_time: '07:00',
    notes: 'Focus on compound movements: squats, deadlifts, and bench press. Remember to warm up properly!',
    completed: false,
  };

  // Example 2: Tomorrow's cardio session
  const tomorrowSession = {
    id: '2',
    type: 'Cardio',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    scheduled_time: '18:30',
    notes: 'Easy 5K run in the park. Keep heart rate in zone 2.',
    completed: false,
  };

  // Example 3: Future calisthenics session with all-day time
  const futureSession = {
    id: '3',
    type: 'Calisthenics',
    date: '2026-01-10',
    // No scheduled_time - will display "All Day"
    notes: 'Pull-ups, dips, and core work. Aim for 100 reps total.',
    completed: false,
  };

  // Example 4: Overdue session (past date)
  const overdueSession = {
    id: '4',
    type: 'Boxing',
    date: '2025-12-30',
    scheduled_time: '16:00',
    notes: 'Heavy bag work and shadowboxing. 30 minutes intense session.',
    completed: false,
  };

  // Example 5: Swimming session with long notes (will be truncated)
  const longNotesSession = {
    id: '5',
    type: 'Swimming',
    date: '2026-01-15',
    scheduled_time: '06:00',
    notes: 'Complete swimming workout: 400m warm-up, 10x100m intervals at race pace with 30s rest, 200m cool-down. Focus on technique and breathing. Bring fins and pull buoy for drills.',
    completed: false,
  };

  // Example 6: Yoga session without notes
  const noNotesSession = {
    id: '6',
    type: 'Yoga',
    date: '2026-01-20',
    scheduled_time: '09:00',
    completed: false,
  };

  // Event Handlers

  const handleStartWorkout = (session) => {
    console.log('Starting workout:', session);
    alert(`Starting ${session.type} workout!\n\nThis would navigate to the workout tracking screen.`);
    // In real app: navigate to workout session screen
    // Example: navigate('/workout/active', { state: { session } });
  };

  const handleEdit = (session) => {
    console.log('Editing session:', session);
    alert(`Editing ${session.type} session\n\nThis would open the edit modal.`);
    // In real app: open edit modal
    // Example: setEditSession(session); setShowEditModal(true);
  };

  const handleDelete = (sessionId) => {
    console.log('Deleting session:', sessionId);
    const confirmed = window.confirm('Are you sure you want to delete this planned workout?');
    if (confirmed) {
      alert(`Session ${sessionId} deleted!\n\nThis would call the API to delete the session.`);
      // In real app: call API to delete
      // Example: await apiService.deleteSession(sessionId);
    }
  };

  const handleCardClick = (session) => {
    console.log('Card clicked:', session);
    setSelectedSession(session);
    setShowDetail(true);
  };

  const closeDetailModal = () => {
    setShowDetail(false);
    setSelectedSession(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--graphite-950)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h1 style={{
          color: 'var(--text-primary)',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          PlannedSessionCard Examples
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem',
        }}>
          {/* Example 1: Today's Session */}
          <div>
            <h2 style={{
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}>
              1. Today's Session
            </h2>
            <PlannedSessionCard
              session={todaySession}
              onStartWorkout={handleStartWorkout}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Example 2: Tomorrow's Session */}
          <div>
            <h2 style={{
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}>
              2. Tomorrow's Session
            </h2>
            <PlannedSessionCard
              session={tomorrowSession}
              onStartWorkout={handleStartWorkout}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Example 3: Future Session (All Day) */}
          <div>
            <h2 style={{
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}>
              3. Future Session (All Day)
            </h2>
            <PlannedSessionCard
              session={futureSession}
              onStartWorkout={handleStartWorkout}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Example 4: Overdue Session */}
          <div>
            <h2 style={{
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}>
              4. Overdue Session (Pulsing Border)
            </h2>
            <PlannedSessionCard
              session={overdueSession}
              onStartWorkout={handleStartWorkout}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Example 5: Long Notes (Truncated) */}
          <div>
            <h2 style={{
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}>
              5. Long Notes (Truncated)
            </h2>
            <PlannedSessionCard
              session={longNotesSession}
              onStartWorkout={handleStartWorkout}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Example 6: No Notes */}
          <div>
            <h2 style={{
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}>
              6. Session Without Notes
            </h2>
            <PlannedSessionCard
              session={noNotesSession}
              onStartWorkout={handleStartWorkout}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCardClick={handleCardClick}
            />
          </div>

          {/* Example 7: Actions Hidden */}
          <div>
            <h2 style={{
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}>
              7. Actions Hidden (showActions=false)
            </h2>
            <PlannedSessionCard
              session={todaySession}
              onCardClick={handleCardClick}
              showActions={false}
            />
          </div>

          {/* Example 8: Card-Only Interaction */}
          <div>
            <h2 style={{
              color: 'var(--text-secondary)',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}>
              8. Card-Only Interaction (No Actions)
            </h2>
            <PlannedSessionCard
              session={tomorrowSession}
              onCardClick={() => alert('Card clicked! Opens detail view.')}
              showActions={false}
            />
          </div>
        </div>

        {/* Integration Example Code */}
        <div style={{
          background: 'var(--graphite-900)',
          border: '1px solid var(--graphite-800)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          marginTop: '3rem',
        }}>
          <h2 style={{
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            marginBottom: '1rem',
          }}>
            Integration Example
          </h2>
          <pre style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            overflow: 'auto',
            background: 'var(--graphite-950)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
          }}>
{`// Import the component
import PlannedSessionCard from './components/PlannedSessionCard';

// Use in your page component
function CalendarPage() {
  const [plannedSessions, setPlannedSessions] = useState([]);

  useEffect(() => {
    // Load planned sessions from API
    const loadSessions = async () => {
      const sessions = await apiService.getAllSessions();
      const planned = sessions.filter(s => !s.completed);
      setPlannedSessions(planned);
    };
    loadSessions();
  }, []);

  const handleStartWorkout = (session) => {
    // Navigate to workout tracking
    navigate('/workout/active', { state: { session } });
  };

  const handleEdit = (session) => {
    // Open edit modal
    setEditSession(session);
    setShowEditModal(true);
  };

  const handleDelete = async (sessionId) => {
    if (confirm('Delete this workout?')) {
      await apiService.deleteSession(sessionId);
      // Reload sessions
      loadSessions();
    }
  };

  return (
    <div className="calendar-page">
      <h2>Planned Workouts</h2>
      <div className="session-grid">
        {plannedSessions.map(session => (
          <PlannedSessionCard
            key={session.id}
            session={session}
            onStartWorkout={handleStartWorkout}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCardClick={(s) => setDetailSession(s)}
          />
        ))}
      </div>
    </div>
  );
}`}
          </pre>
        </div>
      </div>

      {/* Simple Detail Modal */}
      {showDetail && selectedSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={closeDetailModal}
        >
          <div
            style={{
              background: 'var(--graphite-900)',
              border: '2px solid var(--orange-600)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              color: 'var(--text-primary)',
              fontSize: '1.75rem',
              marginBottom: '1rem',
            }}>
              {selectedSession.type}
            </h2>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <p><strong>Date:</strong> {selectedSession.date}</p>
              <p><strong>Time:</strong> {selectedSession.scheduled_time || 'All Day'}</p>
              {selectedSession.notes && (
                <p><strong>Notes:</strong> {selectedSession.notes}</p>
              )}
            </div>
            <button
              onClick={closeDetailModal}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--orange-600)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannedSessionCardExamples;
