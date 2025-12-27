# Database Migrations

## Overview

This directory contains all database migration files for the Fitness Center application. Migrations are executed automatically in version order and tracked in the `schema_migrations` table.

---

## Migration System

### How It Works

1. **Migration Files**: SQL files numbered sequentially (001, 002, 003, etc.)
2. **Tracking Table**: `schema_migrations` table stores which migrations have been applied
3. **Runner Script**: `run-migrations.js` executes pending migrations in order
4. **Transactions**: Each migration runs in a transaction (rollback on failure)

### Running Migrations

```bash
# Run all pending migrations
cd server
node src/config/migrations/run-migrations.js

# Or use npm script (if configured)
npm run migrate
```

---

## Migration List

### 001_create_session_exercise_sets.sql ✅
**Status:** Applied
**Description:** Creates table for tracking individual sets within workout exercises
**Tables:** `session_exercise_sets`
**Indexes:**
- `idx_session_exercise_sets_session_exercise_id`
- `idx_session_exercise_sets_timestamp`
- `idx_sets_exercise_timestamp`

### 002_add_notes_to_session_exercises.sql ✅
**Status:** Applied
**Description:** Adds notes column to session_exercises table
**Tables:** `session_exercises`
**Columns Added:** `notes TEXT`

### 003_add_user_preferences.sql ✅
**Status:** Applied
**Date:** 2025-12-25
**Description:** Adds user preferences as JSONB for multi-device sync and server-side management

**Changes Made:**
- Added `preferences` column (JSONB, NOT NULL, default '{}')
- Created GIN index on `preferences` for efficient JSON queries
- Created index on `updated_at` for cache invalidation
- Created trigger to auto-update `updated_at` on row changes
- Added CHECK constraint to ensure preferences is always a JSON object

**Rollback:** `003_add_user_preferences_rollback.sql`

---

## User Preferences Schema (Migration 003)

### Column Details

| Column | Type | Default | Nullable | Description |
|--------|------|---------|----------|-------------|
| preferences | JSONB | '{}' | NO | User preferences stored as JSON |
| updated_at | TIMESTAMP | CURRENT_TIMESTAMP | YES | Last update timestamp (auto-updated) |

### Indexes

| Index Name | Type | Column(s) | Purpose |
|------------|------|-----------|---------|
| idx_users_preferences | GIN | preferences | Efficient JSONB queries |
| idx_users_updated_at | BTREE | updated_at | Cache invalidation, sorting |

### Triggers

| Trigger Name | Event | Timing | Function |
|--------------|-------|--------|----------|
| update_users_updated_at | UPDATE | BEFORE | Sets updated_at to CURRENT_TIMESTAMP |

### Preferences Structure

```json
{
  "language": "en",
  "weightUnit": "kg",
  "distanceUnit": "km",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12h",
  "restTimer": 90,
  "notifications": {
    "workoutReminders": true,
    "achievementAlerts": true,
    "weeklyReports": true
  },
  "theme": "dark",
  "workoutDefaults": {
    "warmupTime": 300,
    "cooldownTime": 300
  }
}
```

### Supported Fields

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| language | string | ISO 639-1 code | UI language (en, es, fr, de, it, pl, pt) |
| weightUnit | string | "kg", "lbs" | Weight measurement unit |
| distanceUnit | string | "km", "mi" | Distance measurement unit |
| dateFormat | string | Any valid format | Date display format |
| timeFormat | string | "12h", "24h" | Time display format |
| restTimer | number | Seconds | Default rest timer duration |
| notifications | object | See below | Notification preferences |
| theme | string | "light", "dark", "auto" | UI theme preference |
| workoutDefaults | object | See below | Default workout settings |

#### Notifications Object

```json
{
  "workoutReminders": boolean,
  "achievementAlerts": boolean,
  "weeklyReports": boolean
}
```

#### Workout Defaults Object

```json
{
  "warmupTime": number,    // seconds
  "cooldownTime": number   // seconds
}
```

---

## Query Examples

### Get User with Preferences
```sql
SELECT id, username, email, preferences, updated_at
FROM users
WHERE id = 1;
```

### Find Users by Language
```sql
SELECT id, username, preferences->>'language' as language
FROM users
WHERE preferences @> '{"language": "es"}';
```

### Get All Spanish-Speaking Users
```sql
SELECT id, username, email
FROM users
WHERE preferences->>'language' = 'es';
```

### Find Users with Workout Reminders Enabled
```sql
SELECT id, username, email
FROM users
WHERE preferences->'notifications'->>'workoutReminders' = 'true';
```

### Update User Preferences (Full Replace)
```sql
UPDATE users
SET preferences = '{"language": "fr", "weightUnit": "kg", "restTimer": 120}'::jsonb
WHERE id = 1;
```

### Update User Preferences (Merge)
```sql
UPDATE users
SET preferences = preferences || '{"language": "de"}'::jsonb
WHERE id = 1;
```

### Update Nested Preference
```sql
UPDATE users
SET preferences = jsonb_set(
  preferences,
  '{notifications,workoutReminders}',
  'false'::jsonb
)
WHERE id = 1;
```

### Check if Preference Exists
```sql
SELECT id, username
FROM users
WHERE preferences ? 'language';
```

### Get Users Updated in Last 7 Days
```sql
SELECT id, username, updated_at
FROM users
WHERE updated_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY updated_at DESC;
```

---

## Performance Notes

### GIN Index Benefits

The GIN (Generalized Inverted Index) on `preferences` enables:
- Fast containment queries (`@>` operator)
- Efficient key existence checks (`?` operator)
- Fast nested value lookups
- Optimal for read-heavy workloads

### Index Usage

```sql
-- Uses GIN index (fast)
WHERE preferences @> '{"language": "es"}'

-- Uses GIN index (fast)
WHERE preferences ? 'language'

-- Does NOT use GIN index (slower, but still indexed on updated_at)
WHERE preferences->>'language' = 'es'
```

### Cache Invalidation

Use `updated_at` for cache invalidation strategies:
```sql
-- Get latest update timestamp
SELECT MAX(updated_at) FROM users WHERE id IN (1, 2, 3);

-- Check if user preferences changed since last fetch
SELECT id, preferences
FROM users
WHERE id = 1 AND updated_at > '2025-12-25 10:00:00';
```

---

## Best Practices

### 1. Use Transactions
Always wrap preference updates in transactions:
```javascript
await client.query('BEGIN');
try {
  await client.query(
    'UPDATE users SET preferences = $1 WHERE id = $2',
    [newPrefs, userId]
  );
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
}
```

### 2. Validate JSON Structure
Validate preferences on the application side before saving:
```javascript
const validatePreferences = (prefs) => {
  if (typeof prefs !== 'object') throw new Error('Invalid preferences');
  if (prefs.language && !['en','es','fr','de','it','pl','pt'].includes(prefs.language)) {
    throw new Error('Invalid language');
  }
  // ... more validation
};
```

### 3. Use Merge Instead of Replace
Preserve existing preferences when updating:
```sql
-- Good: Merges new preferences
UPDATE users
SET preferences = preferences || $1::jsonb
WHERE id = $2;

-- Bad: Replaces all preferences
UPDATE users
SET preferences = $1::jsonb
WHERE id = $2;
```

### 4. Set Defaults on Application Side
Don't rely solely on database defaults:
```javascript
const DEFAULT_PREFERENCES = {
  language: 'en',
  weightUnit: 'kg',
  distanceUnit: 'km',
  restTimer: 90,
  notifications: {
    workoutReminders: true,
    achievementAlerts: true,
  },
  theme: 'auto',
};

const getUserPreferences = async (userId) => {
  const result = await pool.query(
    'SELECT preferences FROM users WHERE id = $1',
    [userId]
  );
  return { ...DEFAULT_PREFERENCES, ...result.rows[0].preferences };
};
```

---

## Rollback Procedure

If you need to rollback migration 003:

```bash
# Run rollback SQL
psql -d fitness_center -f src/config/migrations/003_add_user_preferences_rollback.sql

# Remove from schema_migrations table
psql -d fitness_center -c "DELETE FROM schema_migrations WHERE version = 3;"
```

**WARNING:** Rollback will permanently delete all user preference data!

---

## Creating New Migrations

### 1. Create Migration File
```bash
# Number sequentially
touch server/src/config/migrations/004_your_migration_name.sql
```

### 2. Write SQL
```sql
-- Migration: Description
-- Explain what this migration does

-- Your SQL changes here
ALTER TABLE ...
CREATE INDEX ...
```

### 3. Create Rollback (Optional but Recommended)
```bash
touch server/src/config/migrations/004_your_migration_name_rollback.sql
```

### 4. Update run-migrations.js
```javascript
const migrations = [
  { version: 1, file: '001_create_session_exercise_sets.sql' },
  { version: 2, file: '002_add_notes_to_session_exercises.sql' },
  { version: 3, file: '003_add_user_preferences.sql' },
  { version: 4, file: '004_your_migration_name.sql' }, // Add this
];
```

### 5. Test Migration
```bash
node src/config/migrations/run-migrations.js
```

### 6. Verify Changes
```bash
psql -d fitness_center -c "\d tablename"
```

---

## Troubleshooting

### Migration Failed
1. Check error message in console
2. Verify SQL syntax
3. Check database permissions
4. Ensure dependent tables/columns exist

### Migration Already Applied
If you need to re-run a migration:
```sql
DELETE FROM schema_migrations WHERE version = X;
```

### Check Applied Migrations
```sql
SELECT * FROM schema_migrations ORDER BY version;
```

### Check Migration Status
```bash
psql -d fitness_center -c "SELECT * FROM schema_migrations ORDER BY version;"
```

---

**Last Updated:** 2025-12-25
**Current Version:** 3
**Total Migrations:** 3
