const { pool }            = require('../config/db');
const { generateContentRaw } = require('../config/ai');
const jwt                 = require('jsonwebtoken');
const { push }            = require('../services/notification.service');
const { checkAchievements } = require('../services/achievement.service');
const { pushFeed }        = require('../services/follow.service');

const roomTimers   = {};  // code → timeout handle
const roomSockets  = {};  // code → Set<socketId>
const socketToRoom = {};  // socketId → code
const socketToUser = {};  // socketId → { id, username, avatar_url }

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function normalize(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;:'"]+$/, '');
}

async function getRoomFromDB(code) {
  const [[room]] = await pool.query('SELECT * FROM battle_rooms WHERE code = ?', [code]);
  return room || null;
}

async function getParticipants(roomId) {
  const [rows] = await pool.query(
    `SELECT bp.user_id, bp.score, bp.correct, bp.\`rank\`, u.username, u.avatar_url
     FROM battle_participants bp
     JOIN users u ON u.id = bp.user_id
     WHERE bp.room_id = ?
     ORDER BY bp.score DESC`,
    [roomId]
  );
  return rows;
}

async function buildAIQuestions(languageId, count) {
  const [[lang]] = await pool.query('SELECT name FROM languages WHERE id = ?', [languageId]);
  if (!lang) throw new Error('Language not found');

  const scriptNote = {
    Japanese: 'Kanji and Kana (e.g. 私は毎日学校に行きます)',
    Korean:   'Hangul (e.g. 저는 매일 학교에 갑니다)',
    Chinese:  'Hanzi (e.g. 我每天去学校)',
    Russian:  'Cyrillic (e.g. Я каждый день хожу в школу)',
  }[lang.name] || `${lang.name} native script`;

  const prompt = `
Generate exactly ${count} ${lang.name}-to-Indonesian translation quiz questions.

Return ONLY a JSON object: { "questions": [ ...${count} items... ] }

Each item MUST follow this EXACT structure — no deviations:
{
  "order_index": 1,
  "type": "multiple_choice",
  "question_data": {
    "question": "<REQUIRED: a sentence written in ${lang.name} native script — ${scriptNote}>",
    "options": ["<Indonesian translation A>", "<Indonesian translation B>", "<Indonesian translation C>", "<Indonesian translation D>"],
    "correct_answer": "<must be one of the 4 options above, exact match>"
  }
}

CRITICAL RULES:
1. "question" field = ${lang.name} sentence using NATIVE SCRIPT ONLY. NEVER empty. NEVER romanization. NEVER Indonesian.
2. "options" = 4 Indonesian translations. All plausible, only one correct.
3. "correct_answer" = exact copy of the correct option string.
4. Use full sentences (6-15 words), not single vocabulary words.
5. Make options deceptive — similar meaning, different nuance.
6. No empty strings in any field.
`.trim();

  let arr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = (await generateContentRaw(prompt)).response.text();
    console.log(`[battle] attempt ${attempt} raw (first 500):`, raw.slice(0, 500));

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) try { parsed = JSON.parse(match[0]); } catch { /* ignore */ }
    }

    if (!parsed) {
      console.error(`[battle] attempt ${attempt}: JSON parse failed`);
      continue;
    }

    console.log(`[battle] attempt ${attempt} parsed keys:`, Object.keys(parsed));

    const candidate = Array.isArray(parsed)
      ? parsed
      : parsed?.questions && Array.isArray(parsed.questions)
        ? parsed.questions
        : Object.values(parsed).find((v) => Array.isArray(v));

    if (!Array.isArray(candidate) || !candidate.length) {
      console.error(`[battle] attempt ${attempt}: no array found. parsed:`, JSON.stringify(parsed).slice(0, 300));
      continue;
    }

    console.log(`[battle] attempt ${attempt}: found ${candidate.length} questions, checking fields...`);
    const badQ = candidate.find(({ question_data: d = {} }) =>
      !d.question || d.question.trim() === '' ||
      (d.options || []).some((o) => !o || o.trim() === '') ||
      !d.correct_answer || d.correct_answer.trim() === ''
    );
    if (badQ) {
      console.error(`[battle] attempt ${attempt}: empty fields in:`, JSON.stringify(badQ));
      continue;
    }

    arr = candidate;
    break;
  }

  if (!arr) throw new Error('Gagal membuat soal battle, silakan coba lagi');

  // Acak posisi correct_answer di dalam options
  function shuffleOptions(questionData) {
    const opts = [...questionData.options]
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { ...questionData, options: opts };
  }

  arr = arr.slice(0, count).map((q, i) => ({
    ...q,
    order_index: i + 1,
    question_data: shuffleOptions({
      ...q.question_data,
      correct_answer: (q.question_data?.correct_answer || '').trim(),
      options: (q.question_data?.options || []).map((o) => (typeof o === 'string' ? o.trim() : String(o))),
    }),
  }));

  console.log(`[battle] Generated ${arr.length} questions for ${lang.name}`);
  return arr;
}

async function buildPackageQuestions(packageId) {
  const [rows] = await pool.query(
    `SELECT qb.type, qb.question_data, pq.order_index
     FROM package_questions pq
     JOIN question_banks qb ON qb.id = pq.question_bank_id
     WHERE pq.quiz_package_id = ?
     ORDER BY pq.order_index`,
    [packageId]
  );
  return rows.map((r) => ({
    order_index:   r.order_index,
    type:          r.type,
    question_data: typeof r.question_data === 'string' ? JSON.parse(r.question_data) : r.question_data,
  }));
}

function safeQuestion(q) {
  const { correct_answer, ...safeData } = q.question_data;
  return { order_index: q.order_index, type: q.type, question_data: safeData };
}

// ── Question flow ─────────────────────────────────────────────
async function startQuestion(io, code, roomId, orderIndex, questions, timePerQuestion) {
  const q = questions.find((q) => q.order_index === orderIndex);
  if (!q) { await finishBattle(io, code, roomId); return; }

  await pool.query(
    'UPDATE battle_rooms SET status = ?, current_question = ? WHERE id = ?',
    ['playing', orderIndex, roomId]
  );

  const safe = safeQuestion(q);
  io.to(code).emit('battle:question', {
    order_index:   safe.order_index,
    total:         questions.length,
    time:          timePerQuestion,
    question_data: safe.question_data,
  });

  roomTimers[code] = setTimeout(async () => {
    io.to(code).emit('battle:reveal', {
      order_index:    orderIndex,
      correct_answer: q.question_data.correct_answer,
    });

    roomTimers[code] = setTimeout(async () => {
      const next = orderIndex + 1;
      if (next <= questions.length) {
        startQuestion(io, code, roomId, next, questions, timePerQuestion);
      } else {
        await finishBattle(io, code, roomId);
      }
    }, 2500);
  }, timePerQuestion * 1000);
}

async function finishBattle(io, code, roomId) {
  if (roomTimers[code]) { clearTimeout(roomTimers[code]); delete roomTimers[code]; }

  const participants = await getParticipants(roomId);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('UPDATE battle_rooms SET status = ?, finished_at = NOW() WHERE id = ?', ['finished', roomId]);

    for (let i = 0; i < participants.length; i++) {
      const rank    = i + 1;
      const xpBonus = rank === 1 ? 50 : rank === 2 ? 30 : 10;
      await conn.query(
        'UPDATE battle_participants SET `rank` = ?, finished_at = NOW() WHERE room_id = ? AND user_id = ?',
        [rank, roomId, participants[i].user_id]
      );
      await conn.query(
        `UPDATE users SET xp = xp + ?,
           streak = CASE
             WHEN last_activity_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN streak + 1
             WHEN last_activity_date = CURDATE() THEN streak
             ELSE 1
           END,
           last_activity_date = CURDATE()
         WHERE id = ?`,
        [xpBonus, participants[i].user_id]
      );
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
  } finally {
    conn.release();
  }

  // Cek achievement untuk semua peserta
  for (const p of participants) {
    checkAchievements(p.user_id).catch(() => {});
  }

  const final = await getParticipants(roomId);

  // Kirim notifikasi hasil battle ke setiap peserta
  await Promise.all(final.map((p, i) => {
    const rank     = i + 1;
    const rankText = rank === 1 ? '🥇 Juara 1' : rank === 2 ? '🥈 Juara 2' : rank === 3 ? '🥉 Juara 3' : `#${rank}`;

    // Push ke activity feed
    pushFeed(p.user_id, rank === 1 ? 'battle_win' : 'battle_finish', {
      rank,
      score:        p.score,
      correct:      p.correct ?? 0,
      total_players: final.length,
    }).catch(() => {});

    return push(p.user_id, {
      type:    'battle_result',
      title:   rank === 1 ? 'Kamu Menang Battle! 🏆' : 'Battle Selesai',
      message: `${rankText} · Skor: ${p.score} pts · ${p.correct ?? 0} jawaban benar`,
      icon:    'Swords',
    });
  }));

  io.to(code).emit('battle:result', { participants: final });
}

// ── Register socket events ────────────────────────────────────
module.exports = function registerBattleSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      const [[user]] = await pool.query('SELECT id, username, avatar_url FROM users WHERE id = ?', [socket.userId]);
      if (!user) { socket.disconnect(); return; }
      socketToUser[socket.id] = user; 
    } catch {
      socket.disconnect(); return;
    }

    // CREATE ROOM
    socket.on('battle:create', async ({ source_type, source_id, language_id, question_count, time_per_question }, cb) => {
      try {
        const user   = socketToUser[socket.id];
        let   code   = genCode();
        while (await getRoomFromDB(code)) code = genCode();

        const qCount = Math.min(Math.max(Number(question_count) || 10, 3), 30);
        const tpq    = Math.min(Math.max(Number(time_per_question) || 15, 5), 60);

        const [res] = await pool.query(
          `INSERT INTO battle_rooms (code, host_id, source_type, source_id, language_id, question_count, time_per_question)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [code, user.id, source_type, source_id || null, language_id || null, qCount, tpq]
        );
        const roomId = res.insertId;
        await pool.query('INSERT INTO battle_participants (room_id, user_id) VALUES (?, ?)', [roomId, user.id]);

        socket.join(code);
        roomSockets[code] = new Set([socket.id]);
        socketToRoom[socket.id] = code;

        const lobbyData = {
          code, host_id: user.id, question_count: qCount, time_per_question: tpq, status: 'waiting',
          participants: [{ user_id: user.id, username: user.username, avatar_url: user.avatar_url, score: 0, correct: 0 }],
        };
        cb({ ok: true, code, room: lobbyData });
        io.to(code).emit('battle:lobby', lobbyData);
      } catch (err) {
        cb({ ok: false, error: err.message });
      }
    });

    // JOIN ROOM
    socket.on('battle:join', async ({ code }, cb) => {
      try {
        const user = socketToUser[socket.id];
        const room = await getRoomFromDB(code);
        if (!room)                     return cb({ ok: false, error: 'Room tidak ditemukan' });
        if (room.status !== 'waiting') return cb({ ok: false, error: 'Battle sudah dimulai' });

        await pool.query(
          'INSERT INTO battle_participants (room_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE joined_at = joined_at',
          [room.id, user.id]
        );

        socket.join(code);
        if (!roomSockets[code]) roomSockets[code] = new Set();
        roomSockets[code].add(socket.id);
        socketToRoom[socket.id] = code;

        const participants = await getParticipants(room.id);
        const lobbyData = {
          code, host_id: room.host_id,
          question_count: room.question_count, time_per_question: room.time_per_question,
          status: 'waiting', participants,
        };
        cb({ ok: true, room: lobbyData });
        io.to(code).emit('battle:lobby', lobbyData);
      } catch (err) {
        cb({ ok: false, error: err.message });
      }
    });

    // START BATTLE (host only)
    socket.on('battle:start', async ({ code }, cb) => {
      try {
        const user = socketToUser[socket.id];
        const room = await getRoomFromDB(code);
        if (!room)                     return cb({ ok: false, error: 'Room tidak ditemukan' });
        if (room.host_id !== user.id)  return cb({ ok: false, error: 'Hanya host yang bisa memulai' });
        if (room.status !== 'waiting') return cb({ ok: false, error: 'Battle sudah dimulai' });

        cb({ ok: true });
        io.to(code).emit('battle:generating', {});

        let questions;
        try {
          if (room.source_type === 'package') {
            questions = await buildPackageQuestions(room.source_id);
          } else {
            questions = await buildAIQuestions(room.language_id, room.question_count);
          }
        } catch (genErr) {
          io.to(code).emit('battle:error', { message: genErr.message || 'Gagal membuat soal' });
          await pool.query('UPDATE battle_rooms SET status = ? WHERE id = ?', ['waiting', room.id]);
          return;
        }

        await pool.query(
          'UPDATE battle_rooms SET status = ?, questions = ? WHERE id = ?',
          ['countdown', JSON.stringify(questions), room.id]
        );

        io.to(code).emit('battle:countdown', { seconds: 3 });
        roomTimers[code] = setTimeout(
          () => startQuestion(io, code, room.id, 1, questions, room.time_per_question),
          3000
        );
      } catch (err) {
        cb({ ok: false, error: err.message });
      }
    });

    // SUBMIT ANSWER
    socket.on('battle:answer', async ({ code, order_index, answer, time_left }, cb) => {
      try {
        const user = socketToUser[socket.id];
        const room = await getRoomFromDB(code);
        if (!room || room.status !== 'playing') return cb?.({ ok: false });

        const questions = typeof room.questions === 'string' ? JSON.parse(room.questions) : room.questions;
        const q         = questions.find((q) => q.order_index === Number(order_index));
        if (!q) return cb?.({ ok: false });

        const [[existing]] = await pool.query(
          'SELECT id FROM battle_answers WHERE room_id = ? AND user_id = ? AND order_index = ?',
          [room.id, user.id, order_index]
        );
        if (existing) return cb?.({ ok: false, error: 'Sudah dijawab' });

        const isCorrect = !!q.question_data.correct_answer &&
          normalize(answer) === normalize(q.question_data.correct_answer);

        // Sisa waktu yang valid: 0 - time_per_question
        const safeTimeLeft = Math.min(Math.max(Number(time_left) || 0, 0), room.time_per_question);
        // Skor: 100 base + bonus sisa waktu (maks +time_per_question poin)
        const points = isCorrect ? 100 + safeTimeLeft : 0;

        await pool.query(
          'INSERT INTO battle_answers (room_id, user_id, order_index, user_answer, is_correct, time_left) VALUES (?,?,?,?,?,?)',
          [room.id, user.id, order_index, answer || null, isCorrect ? 1 : 0, safeTimeLeft]
        );

        if (isCorrect) {
          await pool.query(
            'UPDATE battle_participants SET score = score + ?, correct = correct + 1 WHERE room_id = ? AND user_id = ?',
            [points, room.id, user.id]
          );
        }

        const participants = await getParticipants(room.id);
        io.to(code).emit('battle:scores', { participants });
        cb?.({ ok: true, is_correct: isCorrect, points });
      } catch (err) {
        cb?.({ ok: false, error: err.message });
      }
    });

    // DISCONNECT
    socket.on('disconnect', () => {
      const code = socketToRoom[socket.id];
      if (code) {
        if (roomSockets[code]) roomSockets[code].delete(socket.id);
        io.to(code).emit('battle:player_left', { user_id: socketToUser[socket.id]?.id });
      }
      delete socketToRoom[socket.id];
      delete socketToUser[socket.id];
    });
  });
};
