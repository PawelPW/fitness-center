import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedExercises() {
  try {
    console.log('🌱 Seeding default exercises...');

    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'add_default_exercises.sql'),
      'utf8'
    );

    await pool.query(seedSQL);

    // Count exercises
    const result = await pool.query(
      `SELECT training_type, COUNT(*) as count
       FROM exercises
       WHERE is_custom = FALSE
       GROUP BY training_type
       ORDER BY training_type`
    );

    console.log('✅ Default exercises seeded successfully!\n');
    console.log('Exercise breakdown by type:');
    result.rows.forEach(row => {
      console.log(`  ${row.training_type}: ${row.count} exercises`);
    });

    const total = await pool.query('SELECT COUNT(*) FROM exercises WHERE is_custom = FALSE');
    console.log(`\n📊 Total default exercises: ${total.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding exercises:', error.message);
    process.exit(1);
  }
}

seedExercises();
