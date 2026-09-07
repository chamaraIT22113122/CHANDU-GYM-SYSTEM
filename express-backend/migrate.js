const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const createTableQuery = `
CREATE TABLE IF NOT EXISTS "WorkoutHistory" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "date" DATE NOT NULL,
  "dayName" VARCHAR(50) NOT NULL,
  "completedSets" JSONB NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "date")
);
`;

pool.query(createTableQuery)
  .then(() => { console.log('WorkoutHistory table created successfully'); process.exit(0); })
  .catch(err => { console.error('Error creating table:', err); process.exit(1); });
