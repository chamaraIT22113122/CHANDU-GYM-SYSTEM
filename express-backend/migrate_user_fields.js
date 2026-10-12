const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  await pool.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT;`);
  await pool.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dob" DATE;`);
  console.log('Successfully ensured address and dob columns in User table.');
  await pool.end();
}

migrate().catch(console.error);
