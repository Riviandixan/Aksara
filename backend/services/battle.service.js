const { pool } = require('../config/db');

async function getBattleHistory(userId) {
  const [rows] = await pool.query(
    `SELECT br.id, br.code, br.source_type, br.question_count, br.status,
            br.started_at, br.finished_at,
            bp.score, bp.correct, bp.\`rank\`,
            (SELECT COUNT(*) FROM battle_participants WHERE room_id = br.id) AS player_count
     FROM battle_rooms br
     JOIN battle_participants bp ON bp.room_id = br.id AND bp.user_id = ?
     WHERE br.status = 'finished'
     ORDER BY br.finished_at DESC
     LIMIT 20`,
    [userId]
  );
  return rows;
}

async function getRoomByCode(code) {
  const [[room]] = await pool.query(
    'SELECT id, code, host_id, source_type, question_count, time_per_question, status FROM battle_rooms WHERE code = ?',
    [code]
  );
  if (!room) return null;

  const [participants] = await pool.query(
    `SELECT bp.user_id, bp.score, bp.correct, u.username, u.avatar_url
     FROM battle_participants bp JOIN users u ON u.id = bp.user_id
     WHERE bp.room_id = ?`,
    [room.id]
  );
  return { ...room, participants };
}

module.exports = { getBattleHistory, getRoomByCode };
