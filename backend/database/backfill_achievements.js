/**
 * Script: backfill achievements untuk semua user existing
 * Jalankan SEKALI setelah achievements_migration.sql diimport:
 *   node backend/database/backfill_achievements.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../config/db');
const { checkAchievements } = require('../services/achievement.service');

async function run() {
  const [users] = await pool.query('SELECT id, username FROM users');
  console.log(`Memproses ${users.length} user...`);

  for (const user of users) {
    const newBadges = await checkAchievements(user.id);
    if (newBadges.length) {
      console.log(`✅ ${user.username}: +${newBadges.length} badge → ${newBadges.map((b) => b.title).join(', ')}`);
    } else {
      console.log(`— ${user.username}: tidak ada badge baru`);
    }
  }

  console.log('\nSelesai!');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });