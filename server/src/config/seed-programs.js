import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedPrograms() {
  try {
    console.log('🏋️  Seeding default training programs...');

    const seedSQL = fs.readFileSync(
      path.join(__dirname, 'add_default_programs.sql'),
      'utf8'
    );

    await pool.query(seedSQL);

    // Count programs
    const programsResult = await pool.query(
      `SELECT training_type, COUNT(*) as count
       FROM training_programs
       WHERE user_id IS NULL
       GROUP BY training_type
       ORDER BY training_type`
    );

    console.log('✅ Default training programs seeded successfully!\n');
    console.log('Programs by training type:');
    programsResult.rows.forEach(row => {
      console.log(`  ${row.training_type}: ${row.count} programs`);
    });

    const totalPrograms = await pool.query(
      'SELECT COUNT(*) FROM training_programs WHERE user_id IS NULL'
    );
    console.log(`\n📊 Total default programs: ${totalPrograms.rows[0].count}`);

    // Count exercises in programs
    const exercisesResult = await pool.query(
      `SELECT COUNT(*) as count FROM program_exercises pe
       JOIN training_programs tp ON pe.program_id = tp.id
       WHERE tp.user_id IS NULL`
    );
    console.log(`📋 Total exercises in programs: ${exercisesResult.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding programs:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }
}

seedPrograms();
