const { pool } = require('../config/db');

async function getAllLanguages() {
  const [rows] = await pool.query(
    'SELECT id, code, name, flag_emoji FROM languages ORDER BY name'
  );
  return rows;
}

module.exports = { getAllLanguages };
