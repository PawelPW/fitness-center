import pool from '../config/database.js';

export const getAllPrograms = async (req, res) => {
  try {
    // Fetch both system programs (user_id IS NULL) and user's custom programs
    const programsResult = await pool.query(
      'SELECT * FROM training_programs WHERE user_id IS NULL OR user_id = $1 ORDER BY user_id NULLS FIRST, created_at DESC',
      [req.user.userId]
    );

    const programs = await Promise.all(
      programsResult.rows.map(async (program) => {
        const exercisesResult = await pool.query(
          'SELECT * FROM program_exercises WHERE program_id = $1 ORDER BY order_index',
          [program.id]
        );

        return {
          id: program.id.toString(),
          name: program.name,
          type: program.training_type,
          description: program.description,
          isSystem: program.user_id === null, // True for default programs, false for user custom
          exercises: exercisesResult.rows.map(ex => ({
            id: ex.id.toString(),
            exerciseId: ex.exercise_id.toString(),
            exerciseName: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps,
            weight: parseFloat(ex.weight) || 0,
            duration: ex.duration,
            restTime: ex.rest_time,
          })),
          createdAt: program.created_at,
          updatedAt: program.updated_at,
          isActive: program.is_active,
        };
      })
    );

    res.json(programs);
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
};

export const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    // Allow fetching both system programs and user's own programs
    const result = await pool.query(
      'SELECT * FROM training_programs WHERE id = $1 AND (user_id IS NULL OR user_id = $2)',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const program = result.rows[0];
    const exercisesResult = await pool.query(
      'SELECT * FROM program_exercises WHERE program_id = $1 ORDER BY order_index',
      [id]
    );

    res.json({
      id: program.id.toString(),
      name: program.name,
      type: program.training_type,
      description: program.description,
      isSystem: program.user_id === null,
      exercises: exercisesResult.rows.map(ex => ({
        id: ex.id.toString(),
        exerciseId: ex.exercise_id.toString(),
        exerciseName: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        weight: parseFloat(ex.weight) || 0,
        duration: ex.duration,
        restTime: ex.rest_time,
      })),
      createdAt: program.created_at,
      updatedAt: program.updated_at,
      isActive: program.is_active,
    });
  } catch (error) {
    console.error('Get program error:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
};

export const createProgram = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { name, type, description, exercises } = req.body;

    const programResult = await client.query(
      'INSERT INTO training_programs (user_id, name, training_type, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, name, type, description]
    );

    const program = programResult.rows[0];

    if (exercises && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await client.query(
          'INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, weight, duration, rest_time, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [program.id, ex.exerciseId, ex.exerciseName, ex.sets, ex.reps, ex.weight, ex.duration, ex.restTime, i]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: program.id.toString(),
      name: program.name,
      type: program.training_type,
      description: program.description,
      exercises: exercises || [],
      createdAt: program.created_at,
      updatedAt: program.updated_at,
      isActive: program.is_active,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create program error:', error);
    res.status(500).json({ error: 'Failed to create program' });
  } finally {
    client.release();
  }
};

export const updateProgram = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { name, type, description, exercises } = req.body;

    const result = await client.query(
      'UPDATE training_programs SET name = $1, training_type = $2, description = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND user_id = $5 RETURNING *',
      [name, type, description, id, req.user.userId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Program not found' });
    }

    await client.query('DELETE FROM program_exercises WHERE program_id = $1', [id]);

    if (exercises && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await client.query(
          'INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, weight, duration, rest_time, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [id, ex.exerciseId, ex.exerciseName, ex.sets, ex.reps, ex.weight, ex.duration, ex.restTime, i]
        );
      }
    }

    await client.query('COMMIT');

    const program = result.rows[0];
    res.json({
      id: program.id.toString(),
      name: program.name,
      type: program.training_type,
      description: program.description,
      exercises: exercises || [],
      createdAt: program.created_at,
      updatedAt: program.updated_at,
      isActive: program.is_active,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update program error:', error);
    res.status(500).json({ error: 'Failed to update program' });
  } finally {
    client.release();
  }
};

export const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM training_programs WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
};

export const cloneProgram = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Fetch the program to clone (must be a system program)
    const programResult = await client.query(
      'SELECT * FROM training_programs WHERE id = $1 AND user_id IS NULL',
      [id]
    );

    if (programResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'System program not found' });
    }

    const originalProgram = programResult.rows[0];

    // Create a copy for the user
    const newProgramResult = await client.query(
      'INSERT INTO training_programs (user_id, name, training_type, description, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, `${originalProgram.name} (My Copy)`, originalProgram.training_type, originalProgram.description, true]
    );

    const newProgram = newProgramResult.rows[0];

    // Copy all exercises from the original program
    const exercisesResult = await client.query(
      'SELECT * FROM program_exercises WHERE program_id = $1 ORDER BY order_index',
      [id]
    );

    for (const ex of exercisesResult.rows) {
      await client.query(
        'INSERT INTO program_exercises (program_id, exercise_id, exercise_name, sets, reps, weight, duration, rest_time, order_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newProgram.id, ex.exercise_id, ex.exercise_name, ex.sets, ex.reps, ex.weight, ex.duration, ex.rest_time, ex.order_index]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: newProgram.id.toString(),
      name: newProgram.name,
      type: newProgram.training_type,
      description: newProgram.description,
      isSystem: false,
      exercises: exercisesResult.rows.map(ex => ({
        id: ex.id.toString(),
        exerciseId: ex.exercise_id.toString(),
        exerciseName: ex.exercise_name,
        sets: ex.sets,
        reps: ex.reps,
        weight: parseFloat(ex.weight) || 0,
        duration: ex.duration,
        restTime: ex.rest_time,
      })),
      createdAt: newProgram.created_at,
      updatedAt: newProgram.updated_at,
      isActive: newProgram.is_active,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Clone program error:', error);
    res.status(500).json({ error: 'Failed to clone program' });
  } finally {
    client.release();
  }
};
