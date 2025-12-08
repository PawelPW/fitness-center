import pool from '../config/database.js';

export const getAllExercises = async (req, res) => {
  try {
    // Get both system exercises (user_id IS NULL) and user's custom exercises
    const result = await pool.query(
      'SELECT * FROM exercises WHERE user_id = $1 OR user_id IS NULL ORDER BY training_type, is_custom DESC, name',
      [req.user.userId]
    );

    // Group by training type
    const grouped = result.rows.reduce((acc, exercise) => {
      if (!acc[exercise.training_type]) {
        acc[exercise.training_type] = [];
      }
      acc[exercise.training_type].push({
        id: exercise.id.toString(),
        name: exercise.name,
        description: exercise.description,
        isCustom: exercise.is_custom,
        lastWeight: exercise.last_weight,
        lastDate: exercise.last_date,
        lastRepetitions: exercise.last_repetitions,
        lastSeries: exercise.last_series,
      });
      return acc;
    }, {});

    res.json(grouped);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
};

export const getExercisesByType = async (req, res) => {
  try {
    const { type } = req.params;
    // Get both system exercises and user's custom exercises for this type
    const result = await pool.query(
      'SELECT * FROM exercises WHERE (user_id = $1 OR user_id IS NULL) AND training_type = $2 ORDER BY is_custom DESC, name',
      [req.user.userId, type]
    );

    const exercises = result.rows.map(ex => ({
      id: ex.id.toString(),
      name: ex.name,
      description: ex.description,
      isCustom: ex.is_custom,
      lastWeight: ex.last_weight,
      lastDate: ex.last_date,
      lastRepetitions: ex.last_repetitions,
      lastSeries: ex.last_series,
    }));

    res.json(exercises);
  } catch (error) {
    console.error('Get exercises by type error:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
};

export const createExercise = async (req, res) => {
  try {
    const { name, trainingType, description } = req.body;

    if (!name || !trainingType) {
      return res.status(400).json({ error: 'Name and training type are required' });
    }

    // Check if exists
    const exists = await pool.query(
      'SELECT * FROM exercises WHERE user_id = $1 AND name = $2 AND training_type = $3',
      [req.user.userId, name, trainingType]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Exercise already exists' });
    }

    const result = await pool.query(
      'INSERT INTO exercises (user_id, name, training_type, description, is_custom) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, name, trainingType, description || null, true]
    );

    const exercise = result.rows[0];
    res.status(201).json({
      id: exercise.id.toString(),
      name: exercise.name,
      description: exercise.description,
      isCustom: exercise.is_custom,
      lastWeight: exercise.last_weight,
      lastDate: exercise.last_date,
      lastRepetitions: exercise.last_repetitions,
      lastSeries: exercise.last_series,
    });
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
};

export const updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, lastWeight, lastDate, lastRepetitions, lastSeries } = req.body;

    // Check if exercise exists and belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM exercises WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (lastWeight !== undefined) {
      updates.push(`last_weight = $${paramCount++}`);
      values.push(lastWeight);
    }
    if (lastDate !== undefined) {
      updates.push(`last_date = $${paramCount++}`);
      values.push(lastDate);
    }
    if (lastRepetitions !== undefined) {
      updates.push(`last_repetitions = $${paramCount++}`);
      values.push(lastRepetitions);
    }
    if (lastSeries !== undefined) {
      updates.push(`last_series = $${paramCount++}`);
      values.push(lastSeries);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, req.user.userId);

    const query = `
      UPDATE exercises
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const exercise = result.rows[0];

    res.json({
      id: exercise.id.toString(),
      name: exercise.name,
      description: exercise.description,
      isCustom: exercise.is_custom,
      lastWeight: exercise.last_weight,
      lastDate: exercise.last_date,
      lastRepetitions: exercise.last_repetitions,
      lastSeries: exercise.last_series,
    });
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
};

export const deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM exercises WHERE id = $1 AND user_id = $2 AND is_custom = true RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found or cannot be deleted' });
    }

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
};
