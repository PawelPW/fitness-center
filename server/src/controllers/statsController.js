import pool from '../config/database.js';

/**
 * Statistics Controller
 * Handles all exercise statistics and analytics endpoints
 */

/**
 * Get exercise progression history for a specific exercise
 * Returns all sessions where the exercise was performed with volume data
 */
export const getExerciseHistory = async (req, res) => {
  try {
    const { exerciseName } = req.params;
    const { limit = 50 } = req.query; // Default last 50 sessions

    console.log(`Fetching history for exercise: ${exerciseName}, limit: ${limit}`);

    const result = await pool.query(
      `SELECT
        ts.session_date,
        ts.id as session_id,
        se.id as session_exercise_id,
        se.exercise_name,
        COUNT(ses.id) as total_sets,
        COALESCE(SUM(ses.reps * ses.weight), 0) as total_volume,
        COALESCE(AVG(ses.weight), 0) as avg_weight,
        COALESCE(MAX(ses.weight), 0) as max_weight,
        COALESCE(AVG(ses.reps), 0) as avg_reps,
        COALESCE(MAX(ses.reps), 0) as max_reps,
        COALESCE(
          json_agg(
            json_build_object(
              'setNumber', ses.set_number,
              'reps', ses.reps,
              'weight', ses.weight,
              'restTime', ses.rest_time,
              'timestamp', ses.timestamp
            ) ORDER BY ses.set_number
          ) FILTER (WHERE ses.id IS NOT NULL),
          '[]'::json
        ) as sets
       FROM training_sessions ts
       JOIN session_exercises se ON ts.id = se.session_id
       LEFT JOIN session_exercise_sets ses ON se.id = ses.session_exercise_id
       WHERE ts.user_id = $1
         AND LOWER(se.exercise_name) = LOWER($2)
         AND ts.completed = true
       GROUP BY ts.session_date, ts.id, se.id, se.exercise_name
       ORDER BY ts.session_date DESC
       LIMIT $3`,
      [req.user.userId, exerciseName, limit]
    );

    console.log(`Found ${result.rows.length} sessions for ${exerciseName}`);

    res.json({
      exerciseName,
      history: result.rows.map(row => ({
        sessionDate: row.session_date,
        sessionId: row.session_id,
        totalSets: parseInt(row.total_sets) || 0,
        totalVolume: parseFloat(row.total_volume) || 0,
        avgWeight: parseFloat(row.avg_weight) || 0,
        maxWeight: parseFloat(row.max_weight) || 0,
        avgReps: parseFloat(row.avg_reps) || 0,
        maxReps: parseFloat(row.max_reps) || 0,
        sets: row.sets || []
      }))
    });
  } catch (error) {
    console.error('Get exercise history error:', error);
    res.status(500).json({ error: 'Failed to fetch exercise history' });
  }
};

/**
 * Get exercise personal records (PRs)
 */
export const getExercisePRs = async (req, res) => {
  try {
    const { exerciseName } = req.params;

    console.log(`Fetching PRs for exercise: ${exerciseName}`);

    // Get max weight PR
    const maxWeightResult = await pool.query(
      `SELECT
        ses.weight as value,
        ts.session_date as achieved_date
       FROM session_exercise_sets ses
       JOIN session_exercises se ON ses.session_exercise_id = se.id
       JOIN training_sessions ts ON se.session_id = ts.id
       WHERE ts.user_id = $1
         AND LOWER(se.exercise_name) = LOWER($2)
         AND ts.completed = true
       ORDER BY ses.weight DESC
       LIMIT 1`,
      [req.user.userId, exerciseName]
    );

    // Get max reps PR
    const maxRepsResult = await pool.query(
      `SELECT
        ses.reps as value,
        ts.session_date as achieved_date
       FROM session_exercise_sets ses
       JOIN session_exercises se ON ses.session_exercise_id = se.id
       JOIN training_sessions ts ON se.session_id = ts.id
       WHERE ts.user_id = $1
         AND LOWER(se.exercise_name) = LOWER($2)
         AND ts.completed = true
       ORDER BY ses.reps DESC
       LIMIT 1`,
      [req.user.userId, exerciseName]
    );

    // Get max volume in a single session
    const maxVolumeResult = await pool.query(
      `SELECT
        SUM(ses.reps * ses.weight) as value,
        ts.session_date as achieved_date
       FROM session_exercise_sets ses
       JOIN session_exercises se ON ses.session_exercise_id = se.id
       JOIN training_sessions ts ON se.session_id = ts.id
       WHERE ts.user_id = $1
         AND LOWER(se.exercise_name) = LOWER($2)
         AND ts.completed = true
       GROUP BY ts.id, ts.session_date
       ORDER BY value DESC
       LIMIT 1`,
      [req.user.userId, exerciseName]
    );

    const prs = {
      maxWeight: maxWeightResult.rows.length > 0 ? {
        value: parseFloat(maxWeightResult.rows[0].value),
        achievedDate: maxWeightResult.rows[0].achieved_date
      } : null,
      maxReps: maxRepsResult.rows.length > 0 ? {
        value: parseInt(maxRepsResult.rows[0].value),
        achievedDate: maxRepsResult.rows[0].achieved_date
      } : null,
      maxVolumeSession: maxVolumeResult.rows.length > 0 ? {
        value: parseFloat(maxVolumeResult.rows[0].value),
        achievedDate: maxVolumeResult.rows[0].achieved_date
      } : null
    };

    console.log(`PRs found for ${exerciseName}:`, prs);

    res.json({
      exerciseName,
      personalRecords: prs
    });
  } catch (error) {
    console.error('Get exercise PRs error:', error);
    res.status(500).json({ error: 'Failed to fetch personal records' });
  }
};

/**
 * Get volume statistics over time period
 */
export const getVolumeStats = async (req, res) => {
  try {
    const { exerciseName } = req.params;
    const { period = 'month', groupBy = 'week' } = req.query;

    console.log(`Fetching volume stats for ${exerciseName}: period=${period}, groupBy=${groupBy}`);

    // Determine date filter
    let dateFilter = "ts.session_date >= CURRENT_DATE - INTERVAL '1 month'";
    if (period === 'year') {
      dateFilter = "ts.session_date >= CURRENT_DATE - INTERVAL '1 year'";
    } else if (period === 'all') {
      dateFilter = '1=1';
    }

    // Determine grouping
    let groupByClause = "DATE_TRUNC('week', ts.session_date)";
    if (groupBy === 'month') {
      groupByClause = "DATE_TRUNC('month', ts.session_date)";
    } else if (groupBy === 'day') {
      groupByClause = "DATE_TRUNC('day', ts.session_date)";
    }

    const result = await pool.query(
      `SELECT
        ${groupByClause} as period_start,
        COUNT(DISTINCT ts.id) as session_count,
        COALESCE(SUM(ses.reps * ses.weight), 0) as total_volume,
        COALESCE(AVG(ses.weight), 0) as avg_weight,
        COALESCE(MAX(ses.weight), 0) as max_weight
       FROM training_sessions ts
       JOIN session_exercises se ON ts.id = se.session_id
       LEFT JOIN session_exercise_sets ses ON se.id = ses.session_exercise_id
       WHERE ts.user_id = $1
         AND LOWER(se.exercise_name) = LOWER($2)
         AND ts.completed = true
         AND ${dateFilter}
       GROUP BY period_start
       ORDER BY period_start ASC`,
      [req.user.userId, exerciseName]
    );

    console.log(`Found ${result.rows.length} periods for ${exerciseName}`);

    res.json({
      exerciseName,
      period,
      groupBy,
      data: result.rows.map(row => ({
        periodStart: row.period_start,
        sessionCount: parseInt(row.session_count),
        totalVolume: parseFloat(row.total_volume) || 0,
        avgWeight: parseFloat(row.avg_weight) || 0,
        maxWeight: parseFloat(row.max_weight) || 0
      }))
    });
  } catch (error) {
    console.error('Get volume stats error:', error);
    res.status(500).json({ error: 'Failed to fetch volume statistics' });
  }
};

/**
 * Get all exercises with statistics (for overview)
 */
export const getAllExerciseStats = async (req, res) => {
  try {
    console.log(`Fetching all exercise stats for user ${req.user.userId}`);

    const result = await pool.query(
      `SELECT
        se.exercise_name,
        COUNT(DISTINCT ts.id) as total_sessions,
        COUNT(ses.id) as total_sets,
        COALESCE(SUM(ses.reps * ses.weight), 0) as total_volume,
        COALESCE(MAX(ses.weight), 0) as max_weight,
        MAX(ts.session_date) as last_performed
       FROM session_exercises se
       JOIN training_sessions ts ON se.session_id = ts.id
       LEFT JOIN session_exercise_sets ses ON se.id = ses.session_exercise_id
       WHERE ts.user_id = $1 AND ts.completed = true
       GROUP BY se.exercise_name
       ORDER BY last_performed DESC`,
      [req.user.userId]
    );

    console.log(`Found ${result.rows.length} exercises with stats`);

    res.json({
      exercises: result.rows.map(row => ({
        exerciseName: row.exercise_name,
        totalSessions: parseInt(row.total_sessions) || 0,
        totalSets: parseInt(row.total_sets) || 0,
        totalVolume: parseFloat(row.total_volume) || 0,
        maxWeight: parseFloat(row.max_weight) || 0,
        lastPerformed: row.last_performed
      }))
    });
  } catch (error) {
    console.error('Get all exercise stats error:', error);
    res.status(500).json({ error: 'Failed to fetch exercise statistics' });
  }
};
