const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // REQUIRED for Supabase cloud connection
  }
});

pool.on('connect', () => console.log('✅ PostgreSQL connected (Cloud)'));
pool.on('error', (err) => console.error('❌ DB error:', err));

module.exports = pool;