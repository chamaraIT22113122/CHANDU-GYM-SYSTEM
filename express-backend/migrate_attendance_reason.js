const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const alterTableQuery = `
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "checkoutReason" TEXT;
`;

pool.query(alterTableQuery)
  .then(() => { console.log('Attendance table altered successfully'); process.exit(0); })
  .catch(err => { console.error('Error altering table:', err); process.exit(1); });
