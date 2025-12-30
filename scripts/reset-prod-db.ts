import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface WaitlistRow {
  id: string;
  email: string;
  created_at: string;
  has_access: string;
  ip_address: string | null;
  position: string | null;
}

function parseCSV(csvContent: string): WaitlistRow[] {
  const lines = csvContent.trim().split('\n');
  const rows: WaitlistRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: WaitlistRow = {
      id: values[0]?.replace(/"/g, '') || '',
      email: values[1]?.replace(/"/g, '') || '',
      created_at: values[2]?.replace(/"/g, '') || '',
      has_access: values[3]?.replace(/"/g, '') || 'false',
      ip_address: values[4]?.replace(/"/g, '') || null,
      position: values[5]?.replace(/"/g, '') || null,
    };

    if (row.id && row.email) {
      rows.push(row);
    }
  }

  return rows;
}

async function dumpDatabase() {
  console.log('📦 Creating database dump...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dumpPath = path.join(process.cwd(), `db-dump-${timestamp}.sql`);

  try {
    // Use pg_dump to create a backup
    const dbUrl = new URL(process.env.DATABASE_URL!);
    const dbName = dbUrl.pathname.slice(1);
    const dbHost = dbUrl.hostname;
    const dbPort = dbUrl.port || '5432';
    const dbUser = dbUrl.username;
    const dbPassword = dbUrl.password;

    // Set PGPASSWORD environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: dbPassword };

    execSync(
      `pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${dumpPath}"`,
      { stdio: 'inherit', env }
    );

    console.log(`✅ Database dump saved to: ${dumpPath}`);
    return dumpPath;
  } catch (error) {
    console.warn('⚠️  Could not create database dump (pg_dump may not be installed)');
    console.warn('   Continuing without backup...');
    return null;
  }
}

async function dropAllTables() {
  console.log('🗑️  Dropping all tables...');

  try {
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    const tables = tablesResult.rows.map((row) => row.tablename);

    if (tables.length === 0) {
      console.log('  ℹ️  No tables found');
      return;
    }

    console.log(`  Found ${tables.length} tables to drop`);

    // Drop all tables with CASCADE
    await pool.query('DROP SCHEMA public CASCADE;');
    await pool.query('CREATE SCHEMA public;');
    
    // Try to grant permissions, but don't fail if roles don't exist
    try {
      await pool.query('GRANT ALL ON SCHEMA public TO postgres;');
    } catch (error) {
      // Ignore if postgres role doesn't exist (common in managed databases)
      console.log('  ℹ️  Skipping postgres role grant (role may not exist)');
    }
    
    try {
      await pool.query('GRANT ALL ON SCHEMA public TO public;');
    } catch (error) {
      // Ignore if this fails
      console.log('  ℹ️  Skipping public role grant');
    }

    console.log('✅ All tables dropped');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
}

async function recreateSchema() {
  console.log('🏗️  Recreating schema with db:push...');

  try {
    execSync('bun run db:push', { stdio: 'inherit', cwd: process.cwd() });
    console.log('✅ Schema recreated');
  } catch (error) {
    console.error('❌ Error recreating schema:', error);
    throw error;
  }
}

async function importWaitlist() {
  console.log('📥 Importing waitlist data...');

  const csvPath = path.join(process.cwd(), 'waitlist.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found: ${csvPath}`);
    throw new Error('waitlist.csv not found');
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  if (rows.length === 0) {
    console.log('⚠️  No rows found in CSV');
    return;
  }

  console.log(`  Parsed ${rows.length} rows from CSV`);

  let imported = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      await pool.query(
        `INSERT INTO waitlist (
          id, email, created_at, has_access, ip_address, position,
          otp_code, otp_expires_at, otp_attempts, email_verified,
          bounty_title, bounty_description, bounty_amount, bounty_deadline,
          bounty_github_issue_url, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          row.id,
          row.email,
          row.created_at,
          row.has_access === 'true',
          row.ip_address || null,
          row.position ? parseInt(row.position, 10) : null,
          null,
          null,
          0,
          false,
          null,
          null,
          null,
          null,
          null,
          null,
        ]
      );

      imported++;
      if (imported % 50 === 0) {
        console.log(`  ... imported ${imported} rows`);
      }
    } catch (error) {
      errors++;
      console.error(`  ❌ Error importing row ${row.id}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`✅ Imported ${imported} rows`);
  if (errors > 0) {
    console.log(`⚠️  ${errors} errors occurred`);
  }
}

async function resetDatabase() {
  try {
    console.log('🚀 Starting database reset process...\n');

    // Step 1: Dump database (optional)
    const dumpPath = await dumpDatabase();
    if (dumpPath) {
      console.log('');
    }

    // Step 2: Drop all tables
    await dropAllTables();
    console.log('');

    // Step 3: Recreate schema
    await recreateSchema();
    console.log('');

    // Step 4: Import waitlist
    await importWaitlist();
    console.log('');

    console.log('✨ Database reset complete!');
    if (dumpPath) {
      console.log(`📦 Backup saved to: ${dumpPath}`);
    }
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Confirm before proceeding
const confirm = process.argv[2];

if (confirm !== '--confirm') {
  console.log('⚠️  WARNING: This will DROP ALL TABLES in your production database!');
  console.log('A backup will be created first, but make sure you have DATABASE_URL set correctly.\n');
  console.log('To proceed, run: bun run db:reset-prod --confirm');
  process.exit(0);
}

resetDatabase()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  });

