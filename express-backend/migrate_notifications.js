const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const recreateTableQuery = `
DROP TABLE IF EXISTS "Notification";

CREATE TABLE "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  "targetRole" VARCHAR(50),
  "targetUserId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  "isRead" BOOLEAN DEFAULT FALSE,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

pool.query(recreateTableQuery)
  .then(() => { console.log('Notification table RECREATED successfully'); process.exit(0); })
  .catch(err => { console.error('Error creating table:', err); process.exit(1); });
