const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function runMigration() {
  try {
    console.log("Adding weightIn and weightOut to Attendance...");
    await pool.query(`ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "weightIn" NUMERIC(5,2);`);
    await pool.query(`ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "weightOut" NUMERIC(5,2);`);
    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
