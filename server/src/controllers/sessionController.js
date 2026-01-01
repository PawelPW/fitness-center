import pool from '../config/database.js';

// BE-9: Helper function for date validation
const validateDate = (dateString, fieldName = 'date') => {
  // Validate ISO 8601 format (YYYY-MM-DD)
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso8601Regex.test(dateString)) {
    return {
      valid: false,
      error: `Invalid ${fieldName} format. Expected ISO 8601 format (YYYY-MM-DD), received: ${dateString}`
    };
  }

  // Validate it's a real date
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      error: `Invalid ${fieldName}: "${dateString}" is not a valid date`
    };
  }

  // Validate date range: allow up to 1 day in past, today, and future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sessionDate = new Date(dateString);
  sessionDate.setHours(0, 0, 0, 0);

  if (sessionDate < yesterday) {
    return {
      valid: false,
      error: `Invalid ${fieldName}: Planned sessions cannot be more than 1 day in the past. Received: ${dateString}`
    };
  }

  return { valid: true, date: sessionDate };
};

// BE-9: Helper function for structured error logging
const logError = (endpoint, context, error) => {
  console.error(`[${endpoint}] Error:`, {
    timestamp: new Date().toISOString(),
    userId: context.userId || 'unknown',
    sessionId: context.sessionId || null,
    error: error.message,
    stack: error.stack,
    requestData: context.requestData || null
  });
};

export const getAllSessions = async (req, res) => {
  try {
    // BE-1: Support query params for filtering planned/completed sessions
    const { completed } = req.query;

    // Build WHERE clause based on query params
    let whereClause = 'user_id = $1';
    const queryParams = [req.user.userId];

    // Filter by completed status if specified
    if (completed !== undefined) {
      const isCompleted = completed === 'true' || completed === true;
      whereClause += ' AND completed = $2';
      queryParams.push(isCompleted);
    }
    // Default: return all sessions (backward compatible)

    const sessionsResult = await pool.query(
      `SELECT * FROM training_sessions WHERE ${whereClause} ORDER BY session_date DESC`,
      queryParams
    );

    const sessions = await Promise.all(
      sessionsResult.rows.map(async (session) => {
        const exercisesResult = await pool.query(
          'SELECT * FROM session_exercises WHERE session_id = $1',
          [session.id]
        );

        // Fetch detailed set data for each exercise
        const exercisesWithSets = await Promise.all(
          exercisesResult.rows.map(async (ex) => {
            // Fetch individual sets for this exercise
            const setsResult = await pool.query(
              'SELECT set_number, reps, weight, rest_time FROM session_exercise_sets WHERE session_exercise_id = $1 ORDER BY set_number ASC',
              [ex.id]
            );

            return {
              id: ex.id.toString(),
              name: ex.exercise_name,
              sets: ex.sets,
              reps: ex.reps,
              weight: parseFloat(ex.weight) || 0,
              duration: ex.duration,
              distance: parseFloat(ex.distance) || 0,
              calories: ex.calories,
              avgHeartRate: ex.avg_heart_rate,
              rounds: ex.rounds,
              roundDuration: ex.round_duration,
              restBetweenRounds: ex.rest_between_rounds,
              laps: ex.laps,
              restTime: ex.rest_time,
              // NEW: Individual set details
              setsData: setsResult.rows.map(set => ({
                setNumber: set.set_number,
                reps: set.reps,
                weight: parseFloat(set.weight),
                restTime: set.rest_time
              }))
            };
          })
        );

        return {
          id: session.id.toString(),
          type: session.training_type,
          date: session.session_date,
          duration: session.duration,
          calories: session.calories,
          notes: session.notes,
          completed: session.completed,
          exercises: exercisesWithSets,
          exerciseCount: exercisesWithSets.length,
        };
      })
    );

    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

export const getSessionStats = async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    // Use calendar week (Monday-Sunday) instead of rolling 7 days
    let dateFilter = "session_date >= DATE_TRUNC('week', CURRENT_DATE)";

    if (period === 'month') {
      // Use calendar month (first day of current month)
      dateFilter = "session_date >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (period === 'year') {
      // Use calendar year (first day of current year)
      dateFilter = "session_date >= DATE_TRUNC('year', CURRENT_DATE)";
    }

    // Get session stats
    const result = await pool.query(
      `SELECT COUNT(*) as count, SUM(duration) as total_duration, SUM(calories) as total_calories
       FROM training_sessions
       WHERE user_id = $1 AND completed = true AND ${dateFilter}`,
      [req.user.userId]
    );

    // Get total exercises count for the period
    const exerciseResult = await pool.query(
      `SELECT COUNT(*) as total_exercises
       FROM session_exercises se
       INNER JOIN training_sessions ts ON se.session_id = ts.id
       WHERE ts.user_id = $1 AND ts.completed = true AND ${dateFilter}`,
      [req.user.userId]
    );

    res.json({
      totalSessions: parseInt(result.rows[0].count) || 0,
      totalDuration: parseInt(result.rows[0].total_duration) || 0,
      totalCalories: parseInt(result.rows[0].total_calories) || 0,
      totalExercises: parseInt(exerciseResult.rows[0].total_exercises) || 0,
    });
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({ error: 'Failed to fetch session stats' });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM training_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];
    const exercisesResult = await pool.query(
      'SELECT * FROM session_exercises WHERE session_id = $1',
      [id]
    );

    // Fetch detailed set data for each exercise
    const exercisesWithSets = await Promise.all(
      exercisesResult.rows.map(async (ex) => {
        // Fetch individual sets for this exercise
        const setsResult = await pool.query(
          'SELECT set_number, reps, weight, rest_time FROM session_exercise_sets WHERE session_exercise_id = $1 ORDER BY set_number ASC',
          [ex.id]
        );

        return {
          id: ex.id.toString(),
          name: ex.exercise_name,
          sets: ex.sets,
          reps: ex.reps,
          weight: parseFloat(ex.weight) || 0,
          duration: ex.duration,
          distance: parseFloat(ex.distance) || 0,
          calories: ex.calories,
          avgHeartRate: ex.avg_heart_rate,
          rounds: ex.rounds,
          roundDuration: ex.round_duration,
          restBetweenRounds: ex.rest_between_rounds,
          laps: ex.laps,
          restTime: ex.rest_time,
          // NEW: Individual set details
          setsData: setsResult.rows.map(set => ({
            setNumber: set.set_number,
            reps: set.reps,
            weight: parseFloat(set.weight),
            restTime: set.rest_time
          }))
        };
      })
    );

    res.json({
      id: session.id.toString(),
      type: session.training_type,
      date: session.session_date,
      duration: session.duration,
      calories: session.calories,
      notes: session.notes,
      completed: session.completed,
      exercises: exercisesWithSets,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// BE-7: Modified to handle planned-to-completed conversion
export const createSession = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { type, date, duration, calories, notes, exercises, completed, plannedSessionId } = req.body;

    let session;

    // BE-7: If plannedSessionId provided, update existing planned session
    if (plannedSessionId) {
      // Verify session exists and belongs to user
      const checkResult = await client.query(
        'SELECT * FROM training_sessions WHERE id = $1 AND user_id = $2',
        [plannedSessionId, req.user.userId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Planned session not found' });
      }

      const plannedSession = checkResult.rows[0];

      // Verify it's a planned session (not already completed)
      if (plannedSession.completed === true) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Session is already completed. Cannot update completed sessions.'
        });
      }

      // Update planned session to completed
      const updateResult = await client.query(
        `UPDATE training_sessions
         SET training_type = $1, session_date = $2, duration = $3, calories = $4,
             notes = $5, completed = true, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [
          type || plannedSession.training_type,
          date || plannedSession.session_date,
          duration,
          calories,
          notes || plannedSession.notes,
          plannedSessionId,
          req.user.userId
        ]
      );

      session = updateResult.rows[0];

      // Add exercises to the now-completed session
      if (exercises && exercises.length > 0) {
        for (const ex of exercises) {
          await client.query(
            'INSERT INTO session_exercises (session_id, exercise_name, sets, reps, weight, duration, distance, calories, avg_heart_rate, rounds, round_duration, rest_between_rounds, laps, rest_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
            [session.id, ex.name, ex.sets, ex.reps, ex.weight, ex.duration, ex.distance, ex.calories, ex.avgHeartRate, ex.rounds, ex.roundDuration, ex.restBetweenRounds, ex.laps, ex.restTime]
          );
        }
      }
    } else {
      // Original behavior: Create new session
      const sessionResult = await client.query(
        'INSERT INTO training_sessions (user_id, training_type, session_date, duration, calories, notes, completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [req.user.userId, type, date, duration, calories, notes, completed !== false]
      );

      session = sessionResult.rows[0];

      if (exercises && exercises.length > 0) {
        for (const ex of exercises) {
          await client.query(
            'INSERT INTO session_exercises (session_id, exercise_name, sets, reps, weight, duration, distance, calories, avg_heart_rate, rounds, round_duration, rest_between_rounds, laps, rest_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
            [session.id, ex.name, ex.sets, ex.reps, ex.weight, ex.duration, ex.distance, ex.calories, ex.avgHeartRate, ex.rounds, ex.roundDuration, ex.restBetweenRounds, ex.laps, ex.restTime]
          );
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: session.id.toString(),
      type: session.training_type,
      date: session.session_date,
      duration: session.duration,
      calories: session.calories,
      notes: session.notes,
      completed: session.completed,
      exercises: exercises || [],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  } finally {
    client.release();
  }
};

// BE-2: Create planned session endpoint
// BE-9: Enhanced with ISO 8601 validation, backdating prevention, and error logging
export const createPlannedSession = async (req, res) => {
  try {
    const { type, date, notes } = req.body;

    // BE-9: Validation - Required fields
    if (!type) {
      logError('createPlannedSession', { userId: req.user.userId, requestData: { type, date } },
        new Error('Missing required field: type'));
      return res.status(400).json({
        error: 'Missing required field: type is required',
        field: 'type'
      });
    }

    if (!date) {
      logError('createPlannedSession', { userId: req.user.userId, requestData: { type, date } },
        new Error('Missing required field: date'));
      return res.status(400).json({
        error: 'Missing required field: date is required',
        field: 'date'
      });
    }

    // BE-9: Validation - ISO 8601 date format and date range
    const dateValidation = validateDate(date, 'date');
    if (!dateValidation.valid) {
      logError('createPlannedSession', { userId: req.user.userId, requestData: { type, date } },
        new Error(dateValidation.error));
      return res.status(400).json({
        error: dateValidation.error,
        field: 'date',
        hint: 'Use ISO 8601 format: YYYY-MM-DD (e.g., 2026-01-15)'
      });
    }

    // BE-9: Validation - Valid training type
    const validTypes = ['Cardio', 'Strength', 'Calisthenics', 'Boxing', 'Swimming'];
    if (!validTypes.includes(type)) {
      logError('createPlannedSession', { userId: req.user.userId, requestData: { type, date } },
        new Error(`Invalid training type: ${type}`));
      return res.status(400).json({
        error: `Invalid training type: "${type}"`,
        field: 'type',
        hint: `Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Create planned session (completed=false, duration/calories=NULL)
    const result = await pool.query(
      'INSERT INTO training_sessions (user_id, training_type, session_date, duration, calories, notes, completed) VALUES ($1, $2, $3, NULL, NULL, $4, false) RETURNING *',
      [req.user.userId, type, date, notes || null]
    );

    const session = result.rows[0];

    res.status(201).json({
      id: session.id.toString(),
      type: session.training_type,
      date: session.session_date,
      duration: session.duration,
      calories: session.calories,
      notes: session.notes,
      completed: session.completed,
      exercises: [],
      exerciseCount: 0,
    });
  } catch (error) {
    logError('createPlannedSession', { userId: req.user.userId, requestData: req.body }, error);
    res.status(500).json({
      error: 'Failed to create planned session',
      message: 'An internal server error occurred. Please try again later.'
    });
  }
};

// BE-3: Update planned session endpoint
// BE-9: Enhanced with ISO 8601 validation, backdating prevention, and error logging
export const updatePlannedSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, date, notes } = req.body;

    // BE-9: Check if session exists and belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM training_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      logError('updatePlannedSession', { userId: req.user.userId, sessionId: id },
        new Error('Session not found'));
      return res.status(404).json({
        error: 'Session not found',
        message: `No session found with ID: ${id}`
      });
    }

    const session = checkResult.rows[0];

    // BE-9: Validation - Only allow updates to planned sessions (completed=false)
    if (session.completed === true) {
      logError('updatePlannedSession', { userId: req.user.userId, sessionId: id },
        new Error('Attempted to update completed session'));
      return res.status(400).json({
        error: 'Cannot update completed session',
        message: 'Only planned sessions (not yet completed) can be modified. This session has already been completed.'
      });
    }

    // BE-9: Validation - If date is provided, validate ISO 8601 format and date range
    if (date !== undefined) {
      const dateValidation = validateDate(date, 'date');
      if (!dateValidation.valid) {
        logError('updatePlannedSession', { userId: req.user.userId, sessionId: id, requestData: { date } },
          new Error(dateValidation.error));
        return res.status(400).json({
          error: dateValidation.error,
          field: 'date',
          hint: 'Use ISO 8601 format: YYYY-MM-DD (e.g., 2026-01-15)'
        });
      }
    }

    // BE-9: Validation - If type is provided, must be valid
    if (type !== undefined) {
      const validTypes = ['Cardio', 'Strength', 'Calisthenics', 'Boxing', 'Swimming'];
      if (!validTypes.includes(type)) {
        logError('updatePlannedSession', { userId: req.user.userId, sessionId: id, requestData: { type } },
          new Error(`Invalid training type: ${type}`));
        return res.status(400).json({
          error: `Invalid training type: "${type}"`,
          field: 'type',
          hint: `Must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (type !== undefined) {
      updates.push(`training_type = $${paramCount++}`);
      values.push(type);
    }
    if (date !== undefined) {
      updates.push(`session_date = $${paramCount++}`);
      values.push(date);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updates.length === 0) {
      logError('updatePlannedSession', { userId: req.user.userId, sessionId: id },
        new Error('No fields to update'));
      return res.status(400).json({
        error: 'No fields to update',
        message: 'Request must include at least one field to update: type, date, or notes'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.userId);

    const query = `
      UPDATE training_sessions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const updatedSession = result.rows[0];

    res.json({
      id: updatedSession.id.toString(),
      type: updatedSession.training_type,
      date: updatedSession.session_date,
      duration: updatedSession.duration,
      calories: updatedSession.calories,
      notes: updatedSession.notes,
      completed: updatedSession.completed,
      exercises: [],
      exerciseCount: 0,
    });
  } catch (error) {
    logError('updatePlannedSession', { userId: req.user.userId, sessionId: req.params.id, requestData: req.body }, error);
    res.status(500).json({
      error: 'Failed to update planned session',
      message: 'An internal server error occurred. Please try again later.'
    });
  }
};

// BE-4: Delete planned session endpoint
// BE-9: Enhanced with clear error messages and structured error logging
export const deletePlannedSession = async (req, res) => {
  try {
    const { id } = req.params;

    // BE-9: Check if session exists and belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM training_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      logError('deletePlannedSession', { userId: req.user.userId, sessionId: id },
        new Error('Session not found'));
      return res.status(404).json({
        error: 'Session not found',
        message: `No session found with ID: ${id}`
      });
    }

    const session = checkResult.rows[0];

    // BE-9: Validation - Only allow deletion of planned sessions (completed=false)
    if (session.completed === true) {
      logError('deletePlannedSession', { userId: req.user.userId, sessionId: id },
        new Error('Attempted to delete completed session'));
      return res.status(400).json({
        error: 'Cannot delete completed session',
        message: 'Only planned sessions (not yet completed) can be deleted. Completed sessions are part of your workout history and should not be removed.'
      });
    }

    // Delete the planned session
    await pool.query(
      'DELETE FROM training_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    res.json({
      message: 'Planned session deleted successfully',
      id: id
    });
  } catch (error) {
    logError('deletePlannedSession', { userId: req.user.userId, sessionId: req.params.id }, error);
    res.status(500).json({
      error: 'Failed to delete planned session',
      message: 'An internal server error occurred. Please try again later.'
    });
  }
};

// BE-5: Get upcoming planned sessions endpoint
export const getUpcomingPlannedSessions = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Validate days parameter
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      return res.status(400).json({
        error: 'Invalid days parameter. Must be between 1 and 365.'
      });
    }

    // Query for upcoming planned sessions
    const sessionsResult = await pool.query(
      `SELECT * FROM training_sessions
       WHERE user_id = $1
       AND completed = false
       AND session_date >= CURRENT_DATE
       AND session_date < CURRENT_DATE + INTERVAL '${numDays} days'
       ORDER BY session_date ASC`,
      [req.user.userId]
    );

    // Fetch exercises for each session
    const sessions = await Promise.all(
      sessionsResult.rows.map(async (session) => {
        const exercisesResult = await pool.query(
          'SELECT * FROM session_exercises WHERE session_id = $1',
          [session.id]
        );

        // Fetch detailed set data for each exercise
        const exercisesWithSets = await Promise.all(
          exercisesResult.rows.map(async (ex) => {
            const setsResult = await pool.query(
              'SELECT set_number, reps, weight, rest_time FROM session_exercise_sets WHERE session_exercise_id = $1 ORDER BY set_number ASC',
              [ex.id]
            );

            return {
              id: ex.id.toString(),
              name: ex.exercise_name,
              sets: ex.sets,
              reps: ex.reps,
              weight: parseFloat(ex.weight) || 0,
              duration: ex.duration,
              distance: parseFloat(ex.distance) || 0,
              calories: ex.calories,
              avgHeartRate: ex.avg_heart_rate,
              rounds: ex.rounds,
              roundDuration: ex.round_duration,
              restBetweenRounds: ex.rest_between_rounds,
              laps: ex.laps,
              restTime: ex.rest_time,
              setsData: setsResult.rows.map(set => ({
                setNumber: set.set_number,
                reps: set.reps,
                weight: parseFloat(set.weight),
                restTime: set.rest_time
              }))
            };
          })
        );

        return {
          id: session.id.toString(),
          type: session.training_type,
          date: session.session_date,
          duration: session.duration,
          calories: session.calories,
          notes: session.notes,
          completed: session.completed,
          exercises: exercisesWithSets,
          exerciseCount: exercisesWithSets.length,
        };
      })
    );

    res.json({
      sessions,
      count: sessions.length,
      days: numDays
    });
  } catch (error) {
    console.error('Get upcoming planned sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming planned sessions' });
  }
};

// BE-6: Bulk create planned sessions endpoint
// BE-9: Enhanced with ISO 8601 validation, backdating prevention, and error logging
export const bulkCreatePlannedSessions = async (req, res) => {
  const client = await pool.connect();

  try {
    const { sessions } = req.body;

    // BE-9: Validation - sessions must be an array
    if (!Array.isArray(sessions)) {
      logError('bulkCreatePlannedSessions', { userId: req.user.userId, requestData: { sessions } },
        new Error('Invalid request: sessions is not an array'));
      return res.status(400).json({
        error: 'Invalid request format',
        message: 'The "sessions" field must be an array of session objects',
        field: 'sessions'
      });
    }

    // BE-9: Validation - array must not be empty
    if (sessions.length === 0) {
      logError('bulkCreatePlannedSessions', { userId: req.user.userId },
        new Error('Empty sessions array'));
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Sessions array cannot be empty. Provide at least one session to create.',
        field: 'sessions'
      });
    }

    // BE-9: Validation - maximum batch size (prevent abuse)
    if (sessions.length > 100) {
      logError('bulkCreatePlannedSessions', { userId: req.user.userId, requestData: { count: sessions.length } },
        new Error(`Batch size too large: ${sessions.length} sessions`));
      return res.status(400).json({
        error: 'Batch size exceeded',
        message: `Maximum 100 sessions can be created at once. Received: ${sessions.length}`,
        field: 'sessions',
        hint: 'Split your request into smaller batches of up to 100 sessions each'
      });
    }

    const validTypes = ['Cardio', 'Strength', 'Calisthenics', 'Boxing', 'Swimming'];

    // BE-9: Validate each session before starting transaction
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      const sessionIndex = i + 1;

      // Validate required fields
      if (!session.type) {
        logError('bulkCreatePlannedSessions', { userId: req.user.userId, requestData: { sessionIndex, session } },
          new Error(`Session ${sessionIndex}: Missing type field`));
        return res.status(400).json({
          error: `Session ${sessionIndex}: Missing required field`,
          message: 'The "type" field is required for all sessions',
          field: `sessions[${i}].type`
        });
      }

      if (!session.date) {
        logError('bulkCreatePlannedSessions', { userId: req.user.userId, requestData: { sessionIndex, session } },
          new Error(`Session ${sessionIndex}: Missing date field`));
        return res.status(400).json({
          error: `Session ${sessionIndex}: Missing required field`,
          message: 'The "date" field is required for all sessions',
          field: `sessions[${i}].date`
        });
      }

      // BE-9: Validate ISO 8601 date format and date range
      const dateValidation = validateDate(session.date, `sessions[${i}].date`);
      if (!dateValidation.valid) {
        logError('bulkCreatePlannedSessions', { userId: req.user.userId, requestData: { sessionIndex, session } },
          new Error(dateValidation.error));
        return res.status(400).json({
          error: `Session ${sessionIndex}: ${dateValidation.error}`,
          field: `sessions[${i}].date`,
          hint: 'Use ISO 8601 format: YYYY-MM-DD (e.g., 2026-01-15)'
        });
      }

      // Validate training type
      if (!validTypes.includes(session.type)) {
        logError('bulkCreatePlannedSessions', { userId: req.user.userId, requestData: { sessionIndex, session } },
          new Error(`Session ${sessionIndex}: Invalid type "${session.type}"`));
        return res.status(400).json({
          error: `Session ${sessionIndex}: Invalid training type "${session.type}"`,
          field: `sessions[${i}].type`,
          hint: `Must be one of: ${validTypes.join(', ')}`
        });
      }
    }

    // Begin transaction - all or nothing
    await client.query('BEGIN');

    const createdSessions = [];

    // Create all sessions within transaction
    for (const session of sessions) {
      const result = await client.query(
        'INSERT INTO training_sessions (user_id, training_type, session_date, duration, calories, notes, completed) VALUES ($1, $2, $3, NULL, NULL, $4, false) RETURNING *',
        [req.user.userId, session.type, session.date, session.notes || null]
      );

      const createdSession = result.rows[0];
      createdSessions.push({
        id: createdSession.id.toString(),
        type: createdSession.training_type,
        date: createdSession.session_date,
        duration: createdSession.duration,
        calories: createdSession.calories,
        notes: createdSession.notes,
        completed: createdSession.completed,
        exercises: [],
        exerciseCount: 0,
      });
    }

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      sessions: createdSessions,
      count: createdSessions.length,
      message: `Successfully created ${createdSessions.length} planned session${createdSessions.length !== 1 ? 's' : ''}`
    });
  } catch (error) {
    // Rollback transaction on any error
    await client.query('ROLLBACK');
    logError('bulkCreatePlannedSessions', { userId: req.user.userId, requestData: req.body }, error);
    res.status(500).json({
      error: 'Failed to create planned sessions',
      message: 'An internal server error occurred while creating planned sessions. Please try again later.'
    });
  } finally {
    client.release();
  }
};

export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, calories, notes, completed } = req.body;

    // Check if session exists and belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM training_sessions WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`);
      values.push(duration);
    }
    if (calories !== undefined) {
      updates.push(`calories = $${paramCount++}`);
      values.push(calories);
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(notes);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.userId);

    const query = `
      UPDATE training_sessions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const session = result.rows[0];

    res.json({
      id: session.id.toString(),
      type: session.training_type,
      date: session.session_date,
      duration: session.duration,
      calories: session.calories,
      notes: session.notes,
      completed: session.completed,
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
};

export const createSessionExercise = async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log('createSessionExercise - Request body:', req.body);
    const { exerciseName, sets, reps, weight, notes, setsData } = req.body;
    console.log('createSessionExercise - Extracted data:', { sessionId, exerciseName, sets, reps, weight, notes });

    // Verify session exists and belongs to user
    const sessionCheck = await pool.query(
      'SELECT * FROM training_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Insert session exercise
    const result = await pool.query(
      'INSERT INTO session_exercises (session_id, exercise_name, sets, reps, weight, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [sessionId, exerciseName, sets, reps, weight, notes || null]
    );

    const exercise = result.rows[0];

    // Save individual sets data if provided
    if (setsData && Array.isArray(setsData) && setsData.length > 0) {
      console.log(`Saving ${setsData.length} individual sets for exercise ${exercise.id}`);

      for (const set of setsData) {
        try {
          await pool.query(
            `INSERT INTO session_exercise_sets
             (session_exercise_id, set_number, reps, weight, rest_time, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              exercise.id,
              set.setNumber,
              set.reps,
              set.weight,
              set.restTime || 0,
              set.timestamp
            ]
          );
        } catch (setError) {
          console.error(`Failed to save set ${set.setNumber}:`, setError);
          // Continue saving other sets even if one fails
        }
      }

      console.log(`Successfully saved ${setsData.length} sets for exercise ${exercise.id}`);
    }

    res.status(201).json({
      id: exercise.id.toString(),
      sessionId: exercise.session_id.toString(),
      exerciseName: exercise.exercise_name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: parseFloat(exercise.weight) || 0,
      notes: exercise.notes,
    });
  } catch (error) {
    console.error('Create session exercise error:', error);
    res.status(500).json({ error: 'Failed to create session exercise' });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM training_sessions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
};
