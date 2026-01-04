/**
 * PLAN WORKOUT MODAL - INTEGRATION EXAMPLE
 *
 * This file demonstrates how to integrate the PlanWorkoutModal component
 * into your pages (Dashboard, Calendar, etc.)
 */

import React, { useState } from 'react';
import PlanWorkoutModal from './PlanWorkoutModal';
import apiService from '../services/api';

function DashboardExample() {
  // State for controlling modal visibility
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Optional: Pre-fill data for the modal
  const [initialDate, setInitialDate] = useState('');
  const [initialType, setInitialType] = useState('');

  // State for sessions (to refresh after creating a planned workout)
  const [sessions, setSessions] = useState([]);

  // Function to load/refresh sessions from API
  const loadSessions = async () => {
    try {
      const allSessions = await apiService.getAllSessions();
      setSessions(allSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  // Handle successful workout creation
  const handleWorkoutScheduled = (session) => {
    console.log('Workout scheduled:', session);

    // Show a success toast notification (implement your toast system)
    showToast(`Workout scheduled for ${session.formattedDate}`, 'success');

    // Refresh the sessions list to include the new planned workout
    loadSessions();

    // Optional: Navigate to calendar view or update UI
    // onViewCalendar();
  };

  // Example: Open modal with pre-filled date (e.g., from calendar click)
  const handleCalendarDateClick = (dateString) => {
    setInitialDate(dateString); // e.g., '2026-01-15'
    setInitialType(''); // Reset type
    setShowPlanModal(true);
  };

  // Example: Open modal with pre-filled type (e.g., from quick action)
  const handleQuickScheduleCardio = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setInitialDate(tomorrowStr);
    setInitialType('Cardio');
    setShowPlanModal(true);
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
      </header>

      <main>
        {/* Example: Button to open modal with no pre-fill */}
        <button
          className="btn-primary"
          onClick={() => setShowPlanModal(true)}
        >
          Schedule Workout
        </button>

        {/* Example: Quick action buttons with pre-fill */}
        <div className="quick-actions">
          <button
            className="action-card"
            onClick={handleQuickScheduleCardio}
          >
            <span className="action-icon">🏃</span>
            <span>Schedule Cardio</span>
          </button>

          <button
            className="action-card"
            onClick={() => {
              setInitialType('Strength');
              setShowPlanModal(true);
            }}
          >
            <span className="action-icon">💪</span>
            <span>Schedule Strength</span>
          </button>
        </div>

        {/* Example: Calendar integration */}
        <div className="calendar-grid">
          {/* When user clicks a future date on calendar */}
          <div
            className="calendar-day"
            onClick={() => handleCalendarDateClick('2026-01-15')}
          >
            15
          </div>
        </div>

        {/* Display planned sessions */}
        <section>
          <h2>Upcoming Workouts</h2>
          {sessions
            .filter(s => !s.completed && new Date(s.date) >= new Date())
            .map(session => (
              <div key={session.id} className="session-card">
                <span>{session.type}</span>
                <span>{session.date}</span>
              </div>
            ))}
        </section>
      </main>

      {/* THE MODAL COMPONENT */}
      <PlanWorkoutModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSuccess={handleWorkoutScheduled}
        initialDate={initialDate}
        initialType={initialType}
      />
    </div>
  );
}

// Example toast notification function (implement based on your system)
function showToast(message, type = 'info') {
  // This is a placeholder - implement your actual toast system
  console.log(`[${type.toUpperCase()}] ${message}`);

  // Example implementation:
  // - Use a toast library like react-hot-toast
  // - Or create custom toast component
  // - Or use native browser notifications
}

export default DashboardExample;


/* =============================================================================
   INTEGRATION CHECKLIST
   =============================================================================

   1. Import the component:
      import PlanWorkoutModal from './components/PlanWorkoutModal';

   2. Add state to control modal visibility:
      const [showPlanModal, setShowPlanModal] = useState(false);

   3. Add optional state for pre-filling form:
      const [initialDate, setInitialDate] = useState('');
      const [initialType, setInitialType] = useState('');

   4. Create success handler:
      const handleWorkoutScheduled = (session) => {
        // Show success message
        // Refresh sessions list
        // Optional: navigate to calendar
      };

   5. Add the modal to your JSX:
      <PlanWorkoutModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSuccess={handleWorkoutScheduled}
        initialDate={initialDate}
        initialType={initialType}
      />

   6. Add buttons/triggers to open the modal:
      <button onClick={() => setShowPlanModal(true)}>
        Schedule Workout
      </button>

   =============================================================================
   API INTEGRATION
   =============================================================================

   The component uses apiService.createPlannedSession() which expects:

   Request body:
   {
     type: string,          // Required: 'Cardio', 'Strength', etc.
     date: string,          // Required: 'YYYY-MM-DD' format
     notes: string,         // Optional: user notes
     scheduled_time: string // Optional: 'HH:MM' format if time picker is used
   }

   Response:
   {
     id: number,
     user_id: number,
     type: string,
     date: string,
     notes: string | null,
     completed: boolean,
     created_at: string
   }

   The component handles:
   - Form validation (type required, date required, date must be today or future)
   - API validation errors (displays field-specific errors)
   - Loading states (disables form during submission)
   - Success/error feedback

   =============================================================================
   STYLING NOTES
   =============================================================================

   The modal uses:
   - CSS variables from theme.css (--orange-600, --graphite-950, etc.)
   - z-index: var(--z-modal-backdrop) and var(--z-modal)
   - Mobile-first responsive design
   - Glassmorphism effects with backdrop-filter
   - Smooth animations (slide-up on mobile, scale on desktop)
   - Touch-friendly 44px minimum tap targets

   No additional CSS imports needed - the component is self-contained.

   =============================================================================
   ACCESSIBILITY FEATURES
   =============================================================================

   - Keyboard navigation (Tab, Enter, Escape)
   - Escape key closes modal
   - Focus trap within modal when open
   - ARIA labels on close button
   - Semantic HTML (form, label, button)
   - Error messages linked to fields
   - Disabled states clearly indicated
   - Reduced motion support via prefers-reduced-motion

   =============================================================================
*/
