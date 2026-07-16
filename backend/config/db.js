const mysql = require('mysql2/promise');

// Pool lebih efisien dari single connection karena reuse koneksi
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  timezone: '+00:00',
});

// Verifikasi koneksi saat startup
async function testConnection() {
  const conn = await pool.getConnection();
  console.log('✅ MySQL connected');
  conn.release();
}

module.exports = { pool, testConnection };
