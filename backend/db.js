// backend/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Make sure this is at the VERY top!

// Debug: Check if the password is actually loading
console.log('DEBUG - DB User:', process.env.DB_USER);
console.log('DEBUG - DB Password exists?', process.env.DB_PASSWORD ? 'YES' : 'NO');
console.log('DEBUG - DB Name:', process.env.DB_NAME);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test the connection ONCE at startup
pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error acquiring client', err.stack);
  }
  console.log('✅ PostgreSQL connected'); // This should only print ONCE
  release();
});

// EXPORT THE POOL (Not the connection)
module.exports = pool;