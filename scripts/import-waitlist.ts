import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

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

async function importWaitlist() {
  try {
    console.log('📥 Importing waitlist data...\n');

    const csvPath = path.join(process.cwd(), 'waitlist.csv');

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(csvContent);

    if (rows.length === 0) {
      console.log('⚠️  No rows found in CSV');
      return;
    }

    console.log(`✅ Parsed ${rows.length} rows from CSV\n`);

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'waitlist'
    `);

    if (tableCheck.rows.length === 0) {
      console.error('❌ waitlist table does not exist. Run db:push first!');
      process.exit(1);
    }

    console.log('📦 Importing data...\n');

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        // Check if row already exists
        const exists = await pool.query('SELECT id FROM waitlist WHERE id = $1', [row.id]);

        if (exists.rows.length > 0) {
          skipped++;
          continue;
        }

        // Insert row
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
            null, // otp_code
            null, // otp_expires_at
            0, // otp_attempts
            false, // email_verified
            null, // bounty_title
            null, // bounty_description
            null, // bounty_amount
            null, // bounty_deadline
            null, // bounty_github_issue_url
            null, // user_id
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

    console.log('\n✨ Import complete!');
    console.log(`  ✅ Imported: ${imported}`);
    console.log(`  ⏭️  Skipped (already exists): ${skipped}`);
    if (errors > 0) {
      console.log(`  ❌ Errors: ${errors}`);
    }
  } catch (error) {
    console.error('❌ Error importing waitlist:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

importWaitlist()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });

