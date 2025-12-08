import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

async function setupDatabase() {
  console.log('🚀 Starting cloud database setup...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL not found in environment variables');
    console.error('Please set DATABASE_URL in your .env.production file or environment');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to database
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✓ Connected successfully\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'init_production_db.sql');
    console.log('📄 Reading SQL file:', sqlFilePath);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute SQL
    console.log('⚙️  Executing database initialization...\n');
    await client.query(sql);

    console.log('✓ Database initialization completed successfully!\n');

    // Verify setup
    const result = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_custom = FALSE) as default_exercises,
        COUNT(*) FILTER (WHERE is_custom = TRUE) as custom_exercises,
        COUNT(*) as total_exercises
      FROM exercises;
    `);

    console.log('📊 Database Statistics:');
    console.log('   - Default exercises:', result.rows[0].default_exercises);
    console.log('   - Custom exercises:', result.rows[0].custom_exercises);
    console.log('   - Total exercises:', result.rows[0].total_exercises);

    console.log('\n✓ Cloud database is ready to use! 🎉\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
