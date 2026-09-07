import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend directory
dotenv.config();

// Create a new pool using the connection string from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Successfully connected to the database with pg');
    release();
  }
});

export default pool;
