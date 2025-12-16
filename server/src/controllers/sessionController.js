import pool from '../config/database.js';

export const getAllSessions = async (req, res) => {
  try {
    const sessionsResult = await pool.query(
      'SELECT * FROM training_sessions WHERE user_id = $1 ORDER BY session_date DESC',
      [req.user.userId]
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
    let dateFilter = "session_date >= CURRENT_DATE - INTERVAL '7 days'";

    if (period === 'month') {
      dateFilter = "session_date >= CURRENT_DATE - INTERVAL '1 month'";
    } else if (period === 'year') {
      dateFilter = "session_date >= CURRENT_DATE - INTERVAL '1 year'";
    }

    const result = await pool.query(
      `SELECT COUNT(*) as count, SUM(duration) as total_duration, SUM(calories) as total_calories
       FROM training_sessions
       WHERE user_id = $1 AND completed = true AND ${dateFilter}`,
      [req.user.userId]
    );

    res.json({
      count: parseInt(result.rows[0].count) || 0,
      totalDuration: parseInt(result.rows[0].total_duration) || 0,
      totalCalories: parseInt(result.rows[0].total_calories) || 0,
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

export const createSession = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { type, date, duration, calories, notes, exercises, completed } = req.body;

    const sessionResult = await client.query(
      'INSERT INTO training_sessions (user_id, training_type, session_date, duration, calories, notes, completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user.userId, type, date, duration, calories, notes, completed !== false]
    );

    const session = sessionResult.rows[0];

    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        await client.query(
          'INSERT INTO session_exercises (session_id, exercise_name, sets, reps, weight, duration, distance, calories, avg_heart_rate, rounds, round_duration, rest_between_rounds, laps, rest_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
          [session.id, ex.name, ex.sets, ex.reps, ex.weight, ex.duration, ex.distance, ex.calories, ex.avgHeartRate, ex.rounds, ex.roundDuration, ex.restBetweenRounds, ex.laps, ex.restTime]
        );
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
