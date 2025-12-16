import pool from '../database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration Runner
 * Executes SQL migration files in order and tracks applied migrations
 */

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('\n🔄 Starting database migrations...\n');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Schema migrations table ready');

    // Define migrations in order
    const migrations = [
      { version: 1, file: '001_create_session_exercise_sets.sql' },
      // Add future migrations here
    ];

    for (const migration of migrations) {
      // Check if migration has already been applied
      const result = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [migration.version]
      );

      if (result.rows.length === 0) {
        console.log(`\n📝 Running migration ${migration.version}: ${migration.file}`);

        // Read SQL file
        const sqlPath = path.join(__dirname, migration.file);
        if (!fs.existsSync(sqlPath)) {
          throw new Error(`Migration file not found: ${sqlPath}`);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute migration in a transaction
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO schema_migrations (version, filename) VALUES ($1, $2)',
            [migration.version, migration.file]
          );
          await client.query('COMMIT');
          console.log(`✓ Migration ${migration.version} completed successfully`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw new Error(`Failed to apply migration ${migration.version}: ${err.message}`);
        }
      } else {
        console.log(`⏭️  Migration ${migration.version} already applied, skipping`);
      }
    }

    console.log('\n✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

export default runMigrations;
