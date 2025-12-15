import pool from './database.js';

async function cleanupDuplicates() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🧹 Cleaning up duplicate records...\n');

    // 1. Remove duplicate exercises (keep oldest for each name/type combo)
    console.log('Removing duplicate exercises...');
    const exerciseDuplicates = await client.query(`
      DELETE FROM exercises e1
      WHERE user_id IS NULL
      AND id > (
        SELECT MIN(id)
        FROM exercises e2
        WHERE e2.name = e1.name
        AND e2.training_type = e1.training_type
        AND e2.user_id IS NULL
      )
    `);
    console.log(`✓ Removed ${exerciseDuplicates.rowCount} duplicate exercises`);

    // 2. Remove duplicate training programs (keep oldest for each name)
    console.log('Removing duplicate training programs...');
    const programDuplicates = await client.query(`
      DELETE FROM training_programs tp1
      WHERE user_id IS NULL
      AND id > (
        SELECT MIN(id)
        FROM training_programs tp2
        WHERE tp2.name = tp1.name
        AND tp2.user_id IS NULL
      )
    `);
    console.log(`✓ Removed ${programDuplicates.rowCount} duplicate programs`);

    await client.query('COMMIT');

    // Show final counts
    const exerciseCount = await pool.query(
      'SELECT COUNT(*) FROM exercises WHERE user_id IS NULL'
    );
    const programCount = await pool.query(
      'SELECT COUNT(*) FROM training_programs WHERE user_id IS NULL'
    );

    console.log('\n✅ Cleanup complete!');
    console.log(`📊 System exercises: ${exerciseCount.rows[0].count}`);
    console.log(`📊 System programs: ${programCount.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

cleanupDuplicates();
