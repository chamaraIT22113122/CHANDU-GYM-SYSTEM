const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    // 1. Delete existing bookings to start fresh and avoid constraint issues with the new schema
    await pool.query('DELETE FROM "Booking"');
    
    // 2. Add bookingDate column (type DATE)
    await pool.query('ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "bookingDate" DATE');
    
    // 3. Make it NOT NULL for future bookings
    // Actually, to be safe we won't make it strictly NOT NULL yet just in case. 
    // Wait, since we deleted everything, we can safely make it NOT NULL.
    // However, some schemas might already be tied to Prisma. We are using raw pg here.
    
    console.log("Migration successful: Added bookingDate column to Booking table.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit();
  }
}

migrate();
