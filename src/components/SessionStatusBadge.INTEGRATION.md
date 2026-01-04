# SessionStatusBadge - Integration Guide

Quick guide for integrating the SessionStatusBadge component into your existing pages.

## Quick Start

### 1. Import the Component

```javascript
import SessionStatusBadge from '../components/SessionStatusBadge';
```

### 2. Use in Your JSX

```jsx
<SessionStatusBadge session={session} />
```

That's it! The component handles all the status logic automatically.

---

## Integration Examples for Existing Pages

### Dashboard.jsx

**Use Case**: Show status in the "Last Training Session" card

```jsx
// In Dashboard.jsx
import SessionStatusBadge from '../components/SessionStatusBadge';

// In the lastSession card section (around line 220):
<div
  className="card card-clickable session-card"
  onClick={() => onViewSession && onViewSession(lastSession)}
>
  <div className="session-icon">✅</div>
  <div className="session-details">
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <h3 className="session-type">{lastSession.type || t('workout:session.defaultType')}</h3>
      <SessionStatusBadge session={lastSession} size="small" />
    </div>
    <div className="session-meta">
      <span>{formatDate(lastSession.date)}</span>
      <span>{lastSession.duration || 0} {t('common:units.minutes_short')}</span>
      <span>{lastSession.calories || 0} {t('common:units.calories_short')}</span>
    </div>
  </div>
  <div className="view-arrow">→</div>
</div>
```

### TrainingCalendar.jsx

**Use Case**: Show status badges in calendar day cells

```jsx
// In TrainingCalendar.jsx
import SessionStatusBadge from '../components/SessionStatusBadge';

// In the calendar day rendering (where sessions are displayed):
{day.sessions && day.sessions.length > 0 && (
  <div className="calendar-day-sessions">
    {day.sessions.map(session => (
      <div key={session.id} className="calendar-session-item">
        <SessionStatusBadge
          session={session}
          size="small"
          showLabel={false}  // Icon only for compact view
        />
        <span className="session-type">{session.type}</span>
      </div>
    ))}
  </div>
)}
```

### TrainingDetail.jsx

**Use Case**: Show prominent status in session detail header

```jsx
// In TrainingDetail.jsx
import SessionStatusBadge from '../components/SessionStatusBadge';

// In the session header section:
<div className="session-detail-header">
  <div className="header-main">
    <h1>{session.type}</h1>
    <SessionStatusBadge session={session} size="large" />
  </div>
  <div className="header-meta">
    <span>{formatDate(session.date)}</span>
    <span>{session.duration} min</span>
  </div>
</div>
```

### TrainingList.jsx

**Use Case**: Show status in training program list items

```jsx
// In TrainingList.jsx
import SessionStatusBadge from '../components/SessionStatusBadge';

// In the program list rendering:
{programs.map(program => (
  <div key={program.id} className="program-card">
    <div className="program-header">
      <h3>{program.name}</h3>
      {program.lastSession && (
        <SessionStatusBadge session={program.lastSession} size="small" />
      )}
    </div>
    <div className="program-details">
      {/* ... rest of program details */}
    </div>
  </div>
))}
```

---

## Common Integration Patterns

### Pattern 1: Card Header (Side-by-side)

```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h3>{session.type}</h3>
  <SessionStatusBadge session={session} />
</div>
```

### Pattern 2: Inline with Text

```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <span>{session.type}</span>
  <SessionStatusBadge session={session} size="small" />
</div>
```

### Pattern 3: Vertical Stack (Dashboard Widget)

```jsx
<div>
  <SessionStatusBadge session={session} size="large" className="badge-standalone" />
  <h4>{session.type}</h4>
  <p>{formatDate(session.date)}</p>
</div>
```

### Pattern 4: List Item

```jsx
<div className="session-list-item">
  <SessionStatusBadge session={session} size="small" />
  <span className="flex-1">{session.type}</span>
  <span className="session-date">{formatDate(session.date)}</span>
</div>
```

---

## Styling Tips

### Aligning with Existing Cards

If you need the badge to align with your existing card styles:

```css
/* Add to your component's CSS file */
.session-card .session-status-badge {
  margin-left: auto; /* Push to right side */
}
```

### Making Badges Clickable

If you want badges to be clickable (e.g., to filter by status):

```jsx
<div
  onClick={(e) => {
    e.stopPropagation(); // Prevent parent click
    handleStatusFilter(session.status);
  }}
  style={{ cursor: 'pointer' }}
>
  <SessionStatusBadge session={session} />
</div>
```

### Custom Positioning

```jsx
// Absolute positioning for overlay effect
<div style={{ position: 'relative' }}>
  <img src={sessionImage} alt="Session" />
  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
    <SessionStatusBadge session={session} size="small" />
  </div>
</div>
```

---

## Session Object Requirements

The component needs a session object with these properties:

```javascript
{
  completed: boolean,        // Required: true if workout completed
  date: string,             // Required: ISO date string (YYYY-MM-DD)
  // OR
  session_date: string,     // Alternative date field name

  // Optional (for display purposes):
  type: string,
  duration: number,
  calories: number,
  // ... other fields
}
```

### Example Session Objects

```javascript
// Completed session
const completedSession = {
  id: 1,
  type: 'Strength Training',
  date: '2025-12-20',
  completed: true,
  duration: 45,
  calories: 320
};

// Overdue session
const overdueSession = {
  id: 2,
  type: 'Cardio',
  date: '2025-12-15',
  completed: false,
  duration: 30,
  calories: 0
};

// Planned session
const plannedSession = {
  id: 3,
  type: 'Yoga',
  date: '2026-01-05',
  completed: false,
  duration: 60,
  calories: 0
};
```

---

## CSS Import

Make sure to import the CSS file in your component or in `App.jsx`:

```javascript
// Option 1: Import in SessionStatusBadge.jsx (already done)
import './SessionStatusBadge.css';

// Option 2: Import globally in App.jsx or main.jsx
import './components/SessionStatusBadge.css';
```

The component CSS file is already set up to import automatically when you use the component.

---

## Advanced: Filtering by Status

Example of filtering sessions by status using the badge:

```jsx
function SessionListWithFilters({ sessions }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredSessions = sessions.filter(session => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed') return session.completed;
    if (statusFilter === 'overdue') return !session.completed && isOverdue(session);
    if (statusFilter === 'planned') return !session.completed && !isOverdue(session);
    return true;
  });

  return (
    <div>
      {/* Filter buttons */}
      <div className="status-filters">
        <button onClick={() => setStatusFilter('all')}>All</button>
        <button onClick={() => setStatusFilter('completed')}>Completed</button>
        <button onClick={() => setStatusFilter('overdue')}>Overdue</button>
        <button onClick={() => setStatusFilter('planned')}>Planned</button>
      </div>

      {/* Filtered session list */}
      {filteredSessions.map(session => (
        <div key={session.id} className="session-item">
          <SessionStatusBadge session={session} />
          <span>{session.type}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Testing After Integration

After integrating the badge into your pages, test these scenarios:

1. **Completed Sessions**: Badge shows green with checkmark
2. **Overdue Sessions**: Badge shows red with warning icon
3. **Planned Sessions**: Badge shows blue with calendar icon
4. **Different Sizes**: Small in lists, medium in cards, large in headers
5. **Icon Only**: Works in compact calendar views
6. **Accessibility**: Tab navigation works, screen readers announce status
7. **Mobile**: Touch targets are 44x44px minimum
8. **Dark Mode**: Colors have sufficient contrast

---

## Troubleshooting

### Badge not showing
- Check that CSS is imported
- Verify session object has `completed` and `date` properties
- Check browser console for errors

### Wrong status displayed
- Verify date format is YYYY-MM-DD or valid ISO string
- Check that `completed` is boolean (not string "true"/"false")
- Ensure `isOverdue()` function is working correctly

### Styling conflicts
- Use `className` prop to add specificity
- Check that theme.css variables are loaded
- Inspect element to see which styles are being applied

---

## Performance Tips

1. **Memoize Session Data**: If passing sessions as props, use `useMemo`
2. **Avoid Inline Objects**: Don't create session objects inline in JSX
3. **Batch Updates**: Group multiple badge updates together
4. **Virtual Lists**: For long lists, use virtualization (react-window)

```jsx
// Good: Session object is stable reference
const session = useMemo(() => ({
  completed: workout.completed,
  date: workout.date
}), [workout.completed, workout.date]);

<SessionStatusBadge session={session} />

// Bad: Creates new object on every render
<SessionStatusBadge session={{ completed: workout.completed, date: workout.date }} />
```

---

## Next Steps

1. Import the component into your desired page
2. Add `<SessionStatusBadge session={session} />` to your JSX
3. Adjust `size` and `showIcon`/`showLabel` props as needed
4. Test with different session states
5. Customize styling with `className` if needed

For more examples, see `SessionStatusBadge.example.jsx`.
For detailed documentation, see `SessionStatusBadge.README.md`.

---

**Quick Reference**:

```jsx
// Basic
<SessionStatusBadge session={session} />

// Small (calendar)
<SessionStatusBadge session={session} size="small" />

// Icon only (compact)
<SessionStatusBadge session={session} showLabel={false} />

// Large (header)
<SessionStatusBadge session={session} size="large" />

// Custom class
<SessionStatusBadge session={session} className="ml-auto" />
```
