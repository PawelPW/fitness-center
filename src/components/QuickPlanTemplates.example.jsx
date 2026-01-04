import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuickPlanTemplates from './QuickPlanTemplates';

/**
 * QUICK PLAN TEMPLATES - INTEGRATION EXAMPLES
 *
 * This file demonstrates various ways to integrate the QuickPlanTemplates component
 * into different parts of your application.
 */

/* ============================================
   EXAMPLE 1: Basic Integration in Dashboard
   ============================================ */

export function DashboardExample() {
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const navigate = useNavigate();

  const handlePlanSuccess = (sessions) => {
    console.log('Created sessions:', sessions);

    // Show success message
    alert(`Successfully created ${sessions.length} workouts!`);

    // Navigate to calendar to show new sessions
    navigate('/calendar', {
      state: { highlightSessions: sessions }
    });
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Dashboard</h1>
      </div>

      {/* Quick Plan Button */}
      <div className="dashboard-actions">
        <button
          className="btn-quick-plan"
          onClick={() => setShowQuickPlan(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4"></polyline>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          Quick Plan
        </button>
      </div>

      {/* Quick Plan Modal */}
      <QuickPlanTemplates
        isOpen={showQuickPlan}
        onClose={() => setShowQuickPlan(false)}
        onSuccess={handlePlanSuccess}
        initialDuration="1week"
      />
    </div>
  );
}

/* ============================================
   EXAMPLE 2: Integration with Calendar Page
   ============================================ */

export function CalendarExample() {
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const [sessions, setSessions] = useState([]);

  const handlePlanSuccess = (newSessions) => {
    // Add new sessions to calendar state
    setSessions(prev => [...prev, ...newSessions]);

    // Show success toast
    showSuccessToast(`Created ${newSessions.length} workouts!`);

    // Scroll to first new session date
    if (newSessions.length > 0) {
      const firstSessionDate = new Date(newSessions[0].date);
      scrollToDate(firstSessionDate);
    }
  };

  const showSuccessToast = (message) => {
    // Implementation depends on your toast system
    console.log('Success:', message);
  };

  const scrollToDate = (date) => {
    // Implementation depends on your calendar component
    console.log('Scroll to date:', date);
  };

  return (
    <div className="calendar-page">
      <div className="calendar-toolbar">
        <button
          className="btn-quick-plan"
          onClick={() => setShowQuickPlan(true)}
        >
          ⚡ Quick Plan
        </button>
      </div>

      {/* Calendar component here */}
      <div className="calendar-grid">
        {/* Your calendar implementation */}
      </div>

      <QuickPlanTemplates
        isOpen={showQuickPlan}
        onClose={() => setShowQuickPlan(false)}
        onSuccess={handlePlanSuccess}
        initialDuration="2weeks"
      />
    </div>
  );
}

/* ============================================
   EXAMPLE 3: Floating Action Button (FAB)
   ============================================ */

export function FABExample() {
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handlePlanSuccess = (sessions) => {
    // Navigate to calendar with highlight
    navigate('/calendar', {
      state: {
        highlightSessions: sessions,
        showSuccessMessage: `${sessions.length} workouts planned!`
      }
    });
  };

  return (
    <>
      {/* Floating Action Menu */}
      <div className="fab-menu">
        {showMenu && (
          <div className="fab-menu-items">
            <button
              className="fab-menu-item"
              onClick={() => {
                setShowQuickPlan(true);
                setShowMenu(false);
              }}
            >
              <span className="fab-menu-icon">⚡</span>
              <span className="fab-menu-label">Quick Plan</span>
            </button>
            <button className="fab-menu-item">
              <span className="fab-menu-icon">💪</span>
              <span className="fab-menu-label">Start Workout</span>
            </button>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          className="fab-button"
          onClick={() => setShowMenu(!showMenu)}
        >
          +
        </button>
      </div>

      <QuickPlanTemplates
        isOpen={showQuickPlan}
        onClose={() => setShowQuickPlan(false)}
        onSuccess={handlePlanSuccess}
      />
    </>
  );
}

/* ============================================
   EXAMPLE 4: Onboarding Wizard
   ============================================ */

export function OnboardingExample() {
  const [step, setStep] = useState(1);
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const navigate = useNavigate();

  const handlePlanSuccess = (sessions) => {
    // Complete onboarding
    localStorage.setItem('onboarding_complete', 'true');

    // Navigate to dashboard
    navigate('/dashboard', {
      state: {
        showWelcomeMessage: true,
        plannedWorkouts: sessions.length
      }
    });
  };

  if (step === 1) {
    return (
      <div className="onboarding-step">
        <h2>Welcome to Fitness Center!</h2>
        <p>Let's set up your first week of training</p>
        <button onClick={() => setStep(2)}>Continue</button>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="onboarding-step">
        <h2>Plan Your Week</h2>
        <p>Use our Quick Plan feature to schedule your workouts</p>
        <button onClick={() => setShowQuickPlan(true)}>
          Create Workout Plan
        </button>
        <button onClick={() => setStep(1)}>Back</button>

        <QuickPlanTemplates
          isOpen={showQuickPlan}
          onClose={() => setShowQuickPlan(false)}
          onSuccess={handlePlanSuccess}
          initialDuration="1week"
        />
      </div>
    );
  }

  return null;
}

/* ============================================
   EXAMPLE 5: With Custom Success Handler
   ============================================ */

export function CustomSuccessExample() {
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handlePlanSuccess = async (sessions) => {
    // Show confetti animation
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    // Send analytics event
    if (window.gtag) {
      window.gtag('event', 'quick_plan_created', {
        event_category: 'engagement',
        event_label: 'workout_planning',
        value: sessions.length
      });
    }

    // Update local state/cache
    await refreshSessionsCache();

    // Show notification
    if (window.Capacitor?.Plugins?.LocalNotifications) {
      await window.Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [{
          title: 'Workout Plan Created',
          body: `You've scheduled ${sessions.length} workouts. Let's crush them!`,
          id: Date.now(),
        }]
      });
    }

    // Play success sound
    if (window.Audio) {
      const audio = new Audio('/sounds/success.mp3');
      audio.play();
    }
  };

  const refreshSessionsCache = async () => {
    // Refresh your sessions data
    console.log('Refreshing sessions cache...');
  };

  return (
    <div>
      {showConfetti && <ConfettiAnimation />}

      <button onClick={() => setShowQuickPlan(true)}>
        Quick Plan
      </button>

      <QuickPlanTemplates
        isOpen={showQuickPlan}
        onClose={() => setShowQuickPlan(false)}
        onSuccess={handlePlanSuccess}
        initialDuration="1month"
      />
    </div>
  );
}

function ConfettiAnimation() {
  return <div className="confetti">🎉</div>;
}

/* ============================================
   EXAMPLE 6: Progressive Pre-fill
   ============================================ */

export function ProgressivePreFillExample() {
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState('1week');

  // User selects duration first, then opens modal
  return (
    <div>
      <div className="duration-selector">
        <h3>How far ahead do you want to plan?</h3>
        <select
          value={selectedDuration}
          onChange={(e) => setSelectedDuration(e.target.value)}
        >
          <option value="1week">1 Week</option>
          <option value="2weeks">2 Weeks</option>
          <option value="1month">1 Month</option>
        </select>

        <button onClick={() => setShowQuickPlan(true)}>
          Create Plan
        </button>
      </div>

      <QuickPlanTemplates
        isOpen={showQuickPlan}
        onClose={() => setShowQuickPlan(false)}
        onSuccess={(sessions) => console.log('Created:', sessions)}
        initialDuration={selectedDuration}
      />
    </div>
  );
}

/* ============================================
   EXAMPLE 7: Error Handling
   ============================================ */

export function ErrorHandlingExample() {
  const [showQuickPlan, setShowQuickPlan] = useState(false);
  const [error, setError] = useState('');

  const handlePlanSuccess = (sessions) => {
    setError('');
    console.log('Success:', sessions);

    // Additional success logic here
  };

  const handlePlanClose = () => {
    setShowQuickPlan(false);
    // Clear any errors when closing
    setError('');
  };

  return (
    <div>
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <button onClick={() => setShowQuickPlan(true)}>
        Quick Plan
      </button>

      <QuickPlanTemplates
        isOpen={showQuickPlan}
        onClose={handlePlanClose}
        onSuccess={handlePlanSuccess}
      />
    </div>
  );
}

/* ============================================
   STYLING EXAMPLES
   ============================================ */

export const StylingExamples = `
/* Button to trigger Quick Plan modal */
.btn-quick-plan {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;

  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border: none;
  border-radius: 12px;

  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
}

.btn-quick-plan:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
}

.btn-quick-plan:active {
  transform: translateY(0);
}

/* FAB Menu Styling */
.fab-menu {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  z-index: 1000;
}

.fab-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border: none;
  font-size: 32px;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
  transition: all 0.3s ease;
}

.fab-button:hover {
  transform: scale(1.1) rotate(90deg);
}

.fab-menu-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: fabSlideUp 0.3s ease;
}

@keyframes fabSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(26, 30, 36, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 28px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.fab-menu-item:hover {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.5);
  transform: translateX(-4px);
}
`;

/* ============================================
   USAGE NOTES
   ============================================ */

export const UsageNotes = `
QUICK PLAN TEMPLATES - USAGE GUIDE

1. Basic Integration:
   - Import the component
   - Add state for isOpen
   - Handle onClose and onSuccess callbacks
   - Set initialDuration if needed

2. Success Handler:
   - Receives array of created sessions
   - Each session has: id, type, date, scheduled_time, notes, completed
   - Navigate to calendar or refresh session list
   - Show success message to user

3. Error Handling:
   - Component handles internal errors automatically
   - Displays error messages to user
   - Errors don't close the modal
   - User can retry after fixing issues

4. Mobile Considerations:
   - Modal slides up from bottom on mobile
   - Touch-friendly 44px minimum tap targets
   - Native date/time pickers on mobile
   - Haptic feedback on interactions (if Capacitor available)
   - Prevents body scroll when open

5. Smart Mode Requirements:
   - User needs 3+ completed workouts in past 4 weeks
   - Automatically analyzes training patterns
   - Falls back to default template if insufficient data
   - Shows lock icon if unavailable

6. Performance:
   - Generates templates client-side (fast)
   - Single bulk API call to create all sessions
   - Atomic transaction (all-or-nothing)
   - Loading states for all async operations

7. Accessibility:
   - Keyboard navigation (Tab, Enter, Escape)
   - ARIA labels on all interactive elements
   - Screen reader friendly
   - Reduced motion support
   - High contrast mode compatible

8. Customization:
   - Override CSS variables for theming
   - Modify training types in component
   - Adjust default template pattern
   - Customize success/error messages
`;

export default {
  DashboardExample,
  CalendarExample,
  FABExample,
  OnboardingExample,
  CustomSuccessExample,
  ProgressivePreFillExample,
  ErrorHandlingExample,
  StylingExamples,
  UsageNotes
};
