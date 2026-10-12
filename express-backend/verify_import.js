const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function verify() {
  const usersCount = await pool.query(`SELECT count(*) FROM "User" WHERE role = 'MEMBER'`);
  const memCount = await pool.query(`SELECT count(*) FROM "Membership" WHERE status = 'ACTIVE'`);
  const metricsCount = await pool.query(`SELECT count(*) FROM "PhysicalMetric"`);
  
  console.log('Member users count:', usersCount.rows[0].count);
  console.log('Active memberships count:', memCount.rows[0].count);
  console.log('Physical metrics count:', metricsCount.rows[0].count);

  const sample = await pool.query(`
    SELECT u."membershipId", u."firstName", u."lastName", u.phone, u.address, u.height, u.weight, m.status, m."endDate"
    FROM "User" u
    JOIN "Membership" m ON m."userId" = u.id
    ORDER BY u."joinDate" DESC
    LIMIT 10
  `);
  console.log('\nSample 10 imported members:');
  console.table(sample.rows);

  await pool.end();
}

verify().catch(console.error);
