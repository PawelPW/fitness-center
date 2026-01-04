# PlannedSessionCard Component

A futuristic glassmorphism card component for displaying planned (not yet completed) workout sessions in the fitness center app. Features an outlined design with transparent background, overdue detection with pulsing animations, and comprehensive action buttons.

## Design Philosophy

The **PlannedSessionCard** visually distinguishes planned workouts from completed sessions through:

- **Outlined Design**: 2px border with transparent glassmorphism background (vs. solid background for completed sessions)
- **Overdue Indicators**: Pulsing border animation and warning badge for sessions past their scheduled date
- **Interactive Feedback**: Touch-optimized with haptic feedback, scale animations, and hover states
- **Mobile-First**: Optimized for touch interactions with 44px minimum tap targets

## Visual Features

### Glassmorphism Effects
- Transparent background with `backdrop-filter: blur(12px)`
- Layered depth with inner glow effects
- Smooth transitions and animations at 60fps
- Professional Orange & Graphite color scheme

### Overdue State
- Pulsing border animation (orange/red colors)
- "OVERDUE" badge with glassmorphism design
- Enhanced visual prominence to draw user attention
- Icon color changes to warning tones

### Responsive Design
- **Desktop (>1024px)**: Max-width 400px with side margins
- **Tablet (768-1024px)**: Full width with optimized spacing
- **Mobile (<768px)**: Stacked buttons, full width layout
- **Small (<360px)**: Compact spacing and reduced font sizes

## Installation & Usage

### 1. Import Component

```jsx
import PlannedSessionCard from './components/PlannedSessionCard';
import './components/PlannedSessionCard.css';
```

### 2. Basic Usage

```jsx
<PlannedSessionCard
  session={plannedSession}
  onStartWorkout={(session) => startWorkout(session)}
  onEdit={(session) => openEditModal(session)}
  onDelete={(sessionId) => deleteSession(sessionId)}
  onCardClick={(session) => showDetails(session)}
/>
```

### 3. Session Data Structure

```javascript
const session = {
  id: 'session-123',               // Required: Unique identifier
  type: 'Strength',                // Required: Training type
  date: '2026-01-15',              // Required: ISO date string (YYYY-MM-DD)
  scheduled_time: '07:00',         // Optional: HH:MM format (24-hour)
  notes: 'Focus on compound...',   // Optional: Session notes
  completed: false,                // Required: Must be false for planned sessions
};
```

## Props API

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `session` | Object | Yes | - | Session data object (see structure above) |
| `onStartWorkout` | Function | Yes | - | Called when "Start Workout" button clicked. Receives `session` object. |
| `onEdit` | Function | Yes | - | Called when "Edit" button clicked. Receives `session` object. |
| `onDelete` | Function | Yes | - | Called when "Delete" button clicked. Receives `sessionId` string. |
| `onCardClick` | Function | No | undefined | Called when card is clicked. Receives `session` object. Optional for detail views. |
| `showActions` | Boolean | No | `true` | Controls visibility of action buttons. Set to `false` for read-only display. |

## Component Sections

### Header
- **Training Icon**: Emoji icon based on training type (🏃 Cardio, 💪 Strength, etc.)
- **Type Name**: Training type with gradient text effect
- **Overdue Badge**: Conditional pulsing badge for overdue sessions

### Body
- **Date Display**: Smart formatting (Today, Tomorrow, or "Jan 15, 2026")
- **Time Display**: 12-hour format with AM/PM, or "All Day" if not set
- **Notes Preview**: First 100 characters with "..." truncation if longer

### Footer (Action Buttons)
- **Start Workout**: Primary orange button to begin workout tracking
- **Edit**: Secondary outlined button to modify session details
- **Delete**: Danger text button to remove planned session

## Training Type Icons

Supported training types with emoji icons:

| Type | Icon | Type | Icon |
|------|------|------|------|
| Cardio | 🏃 | Strength | 💪 |
| Calisthenics | 🤸 | Boxing | 🥊 |
| Swimming | 🏊 | Yoga | 🧘 |
| HIIT | ⚡ | Cycling | 🚴 |
| Running | 🏃 | Default | 🏋️ |

*Icon matching is case-insensitive and whitespace-tolerant.*

## Event Handlers

### onStartWorkout(session)
Triggered when user clicks "Start Workout" button.

```javascript
const handleStartWorkout = (session) => {
  // Navigate to active workout screen
  navigate('/workout/active', {
    state: {
      sessionId: session.id,
      type: session.type
    }
  });
};
```

### onEdit(session)
Triggered when user clicks "Edit" button.

```javascript
const handleEdit = (session) => {
  // Open edit modal with session data
  setEditSession(session);
  setShowEditModal(true);
};
```

### onDelete(sessionId)
Triggered when user clicks "Delete" button.

```javascript
const handleDelete = async (sessionId) => {
  if (confirm('Delete this planned workout?')) {
    await apiService.deleteSession(sessionId);
    // Reload sessions list
    refreshSessions();
  }
};
```

### onCardClick(session)
Triggered when user taps anywhere on the card (except buttons).

```javascript
const handleCardClick = (session) => {
  // Show detailed view modal
  setDetailSession(session);
  setShowDetailModal(true);
};
```

## Integration Examples

### Example 1: Calendar View

```jsx
function CalendarPage() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const allSessions = await apiService.getAllSessions();
    const planned = allSessions.filter(s => !s.completed);
    setSessions(planned);
  };

  return (
    <div className="calendar-view">
      <h2>Planned Workouts</h2>
      <div className="session-grid">
        {sessions.map(session => (
          <PlannedSessionCard
            key={session.id}
            session={session}
            onStartWorkout={handleStartWorkout}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 2: Dashboard Upcoming Workouts

```jsx
function Dashboard() {
  const [upcomingWorkouts, setUpcomingWorkouts] = useState([]);

  useEffect(() => {
    // Load next 3 upcoming workouts
    const loadUpcoming = async () => {
      const sessions = await apiService.getAllSessions();
      const planned = sessions
        .filter(s => !s.completed)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
      setUpcomingWorkouts(planned);
    };
    loadUpcoming();
  }, []);

  return (
    <section className="upcoming-workouts">
      <h2>Upcoming Workouts</h2>
      {upcomingWorkouts.map(session => (
        <PlannedSessionCard
          key={session.id}
          session={session}
          onStartWorkout={startWorkout}
          onEdit={editSession}
          onDelete={deleteSession}
          showActions={true}
        />
      ))}
    </section>
  );
}
```

### Example 3: Read-Only Display

```jsx
function WorkoutSummary({ session }) {
  return (
    <div className="summary-card">
      <PlannedSessionCard
        session={session}
        onCardClick={showDetails}
        showActions={false} // Hide action buttons for read-only view
      />
    </div>
  );
}
```

## Styling Customization

### CSS Variables

The component uses the app's Orange & Graphite design system variables:

```css
/* Primary Colors */
--orange-600: #f97316;
--orange-500: #fb923c;
--error-600: #ef4444;
--graphite-900: #12151a;

/* Spacing */
--space-3: 0.75rem;
--space-4: 1rem;
--space-5: 1.25rem;
--space-6: 1.5rem;

/* Border Radius */
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;

/* Transitions */
--transition-base: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

### Custom Styling

To customize the component appearance, override CSS classes:

```css
/* Adjust card border width */
.planned-session-card {
  border-width: 3px; /* Default: 2px */
}

/* Change overdue animation speed */
@keyframes overdueGlow {
  /* Modify animation timing */
}

/* Custom button colors */
.planned-session-card__btn--primary {
  background: #custom-color;
}
```

## Accessibility Features

### Keyboard Navigation
- **Tab**: Navigate between cards and buttons
- **Enter/Space**: Activate card or button
- **Shift+Tab**: Navigate backwards

### Screen Readers
- Semantic HTML (`<article>`, `<button>`)
- ARIA labels for interactive elements
- Clear role and state attributes
- Descriptive alt text for icons

### Focus Indicators
- Visible focus rings on keyboard navigation
- High contrast focus states
- Skip to content functionality

### Reduced Motion
Respects `prefers-reduced-motion` user preference:

```css
@media (prefers-reduced-motion: reduce) {
  /* Disables animations for accessibility */
}
```

## Mobile Optimizations

### Touch Interactions
- **Minimum tap target**: 44x44px for all buttons
- **Touch feedback**: Visual scale animation on press
- **Haptic feedback**: Uses Capacitor Haptics API when available
- **No hover states on touch devices**: Optimized for mobile

### Responsive Breakpoints

| Screen Size | Layout Changes |
|-------------|----------------|
| **< 360px** | Compact spacing, smaller icons, reduced fonts |
| **< 768px** | Stacked buttons, full-width layout |
| **768-1024px** | Side-by-side with margins |
| **> 1024px** | Fixed max-width (400px), centered |

### Performance
- **GPU-accelerated animations**: Uses `transform` and `opacity`
- **Lazy rendering**: Works with virtual scrolling
- **Optimized re-renders**: React.memo compatible
- **60fps animations**: Smooth on mid-range devices

## Error Handling

### Invalid Session Data

```javascript
// Component handles gracefully:
if (!session || !session.id) {
  console.warn('PlannedSessionCard: Invalid session data');
  return null; // Renders nothing
}
```

### Date Formatting Errors

```javascript
// Fallback to safe defaults:
formatDate('invalid') // Returns: "Invalid date"
formatTime(null)      // Returns: "All Day"
```

### Missing Handlers

```javascript
// Optional handlers won't cause errors:
onCardClick={undefined} // Component works without it
```

## Testing

### Unit Tests

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import PlannedSessionCard from './PlannedSessionCard';

test('renders session card with correct data', () => {
  const session = {
    id: '1',
    type: 'Strength',
    date: '2026-01-15',
    scheduled_time: '07:00',
    completed: false,
  };

  render(
    <PlannedSessionCard
      session={session}
      onStartWorkout={jest.fn()}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />
  );

  expect(screen.getByText('Strength')).toBeInTheDocument();
  expect(screen.getByText('7:00 AM')).toBeInTheDocument();
});

test('calls onStartWorkout when button clicked', () => {
  const handleStart = jest.fn();
  const session = { id: '1', type: 'Cardio', date: '2026-01-15', completed: false };

  render(
    <PlannedSessionCard
      session={session}
      onStartWorkout={handleStart}
      onEdit={jest.fn()}
      onDelete={jest.fn()}
    />
  );

  fireEvent.click(screen.getByText('Start Workout'));
  expect(handleStart).toHaveBeenCalledWith(session);
});
```

### Visual Regression Tests

Use Chromatic or Percy for visual testing:

```javascript
// Storybook story
export const Default = () => (
  <PlannedSessionCard
    session={mockSession}
    onStartWorkout={action('start')}
    onEdit={action('edit')}
    onDelete={action('delete')}
  />
);

export const Overdue = () => (
  <PlannedSessionCard
    session={{ ...mockSession, date: '2025-12-01' }}
    onStartWorkout={action('start')}
    onEdit={action('edit')}
    onDelete={action('delete')}
  />
);
```

## Performance Considerations

### Memoization

For large lists, wrap with React.memo:

```javascript
const MemoizedPlannedSessionCard = React.memo(PlannedSessionCard);

// Use in list
{sessions.map(session => (
  <MemoizedPlannedSessionCard
    key={session.id}
    session={session}
    // ... handlers
  />
))}
```

### Virtual Scrolling

Compatible with react-window or react-virtualized:

```javascript
import { FixedSizeList } from 'react-window';

const Row = ({ index, style }) => (
  <div style={style}>
    <PlannedSessionCard
      session={sessions[index]}
      // ... handlers
    />
  </div>
);

<FixedSizeList
  height={600}
  itemCount={sessions.length}
  itemSize={280}
>
  {Row}
</FixedSizeList>
```

## Browser Compatibility

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Android 90+
- **Fallbacks**: Graceful degradation for backdrop-filter support

### CSS Feature Detection

```css
@supports (backdrop-filter: blur(12px)) {
  /* Glassmorphism effects */
}

@supports not (backdrop-filter: blur(12px)) {
  /* Fallback solid background */
  background: var(--graphite-900);
}
```

## Troubleshooting

### Issue: Card not clickable

**Solution**: Ensure `onCardClick` handler is provided or `showActions` is true.

### Issue: Buttons overlap on mobile

**Solution**: Component handles this automatically. Check for custom CSS overrides.

### Issue: Overdue animation not working

**Solution**: Verify session date is in the past and `completed` is `false`.

### Issue: Icons not displaying

**Solution**: Ensure proper emoji font support. Use fallback icons if needed.

## Related Components

- **CompletedSessionCard**: For displaying finished workouts (solid background, checkmark icon)
- **PlanWorkoutModal**: For creating/editing planned sessions
- **MiniCalendar**: For viewing sessions in calendar format
- **WorkoutSession**: For active workout tracking

## Changelog

### v1.0.0 (2026-01-02)
- Initial release
- Futuristic glassmorphism design
- Overdue detection with pulsing animations
- Mobile-optimized touch interactions
- Haptic feedback support
- Full accessibility compliance
- Responsive design (mobile-first)

## License

Part of the Fitness Center application. See main project LICENSE.

## Support

For issues, questions, or contributions:
- Review the example file: `PlannedSessionCard.example.jsx`
- Check the main project documentation
- Ensure you're using the latest version of the component

---

**Created with**: React 18.3.1
**Design System**: Orange & Graphite
**Compatible with**: Capacitor 7.4
**Accessibility**: WCAG 2.1 AA Compliant
