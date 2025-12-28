import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');

    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

    if (sqlFiles.length === 0) {
      console.log('📁 No migration files found');
      return;
    }

    for (const file of sqlFiles) {
      console.log(`\n📄 Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');

      try {
        await pool.query(sql);
        console.log(`✅ Successfully applied: ${file}`);
      } catch (error) {
        console.error(`❌ Error applying ${file}:`, error.message);
        throw error;
      }
    }

    console.log('\n✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
