const { pool } = require('../config/db')

// ── PACKAGES ─────────────────────────────────────────────────

async function listPackages({ userId, mine = false, languageId, search }) {
  let sql = `
    SELECT qp.id, qp.title, qp.description, qp.is_public, qp.created_at,
           u.username AS author, u.avatar_url AS author_avatar,
           lang.name AS language_name, lang.code AS language_code,
           COUNT(pq.id) AS question_count,
           (qp.user_id = ?) AS is_mine
    FROM quiz_packages qp
    JOIN users u ON u.id = qp.user_id
    JOIN languages lang ON lang.id = qp.language_id
    LEFT JOIN package_questions pq ON pq.quiz_package_id = qp.id
    WHERE (qp.is_public = 1 OR qp.user_id = ?)
  `
  const params = [userId, userId]

  if (mine) { sql += ' AND qp.user_id = ?'; params.push(userId) }
  if (languageId) { sql += ' AND qp.language_id = ?'; params.push(languageId) }
  if (search) { sql += ' AND qp.title LIKE ?'; params.push(`%${search}%`) }

  sql += ' GROUP BY qp.id ORDER BY qp.created_at DESC'

  const [rows] = await pool.query(sql, params)
  return rows
}

async function getPackage(packageId, userId) {
  const [[pkg]] = await pool.query(
    `SELECT qp.*, u.username AS author, lang.name AS language_name, lang.code AS language_code,
            (qp.user_id = ?) AS is_mine
     FROM quiz_packages qp
     JOIN users u ON u.id = qp.user_id
     JOIN languages lang ON lang.id = qp.language_id
     WHERE qp.id = ? AND (qp.is_public = 1 OR qp.user_id = ?)`,
    [userId, packageId, userId]
  )
  if (!pkg) { const e = new Error('Package not found'); e.status = 404; throw e }

  const [questions] = await pool.query(
    `SELECT qb.id, qb.type, qb.question_data, pq.order_index
     FROM package_questions pq
     JOIN question_banks qb ON qb.id = pq.question_bank_id
     WHERE pq.quiz_package_id = ?
     ORDER BY pq.order_index`,
    [packageId]
  )
  return { ...pkg, questions }
}

async function createPackage(userId, { title, description, language_id, is_public = true, question_ids = [] }) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [res] = await conn.query(
      'INSERT INTO quiz_packages (user_id, language_id, title, description, is_public) VALUES (?,?,?,?,?)',
      [userId, language_id, title, description || null, is_public ? 1 : 0]
    )
    const packageId = res.insertId

    if (question_ids.length) {
      const values = question_ids.map((qid, i) => [packageId, qid, i + 1])
      await conn.query('INSERT INTO package_questions (quiz_package_id, question_bank_id, order_index) VALUES ?', [values])
    }

    await conn.commit()
    return getPackage(packageId, userId)
  } catch (e) {
    await conn.rollback(); throw e
  } finally {
    conn.release()
  }
}

async function updatePackage(packageId, userId, { title, description, is_public, question_ids }) {
  const [[pkg]] = await pool.query('SELECT id FROM quiz_packages WHERE id = ? AND user_id = ?', [packageId, userId])
  if (!pkg) { const e = new Error('Package not found'); e.status = 404; throw e }

  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.query(
      'UPDATE quiz_packages SET title=?, description=?, is_public=? WHERE id=?',
      [title, description || null, is_public ? 1 : 0, packageId]
    )
    if (question_ids !== undefined) {
      await conn.query('DELETE FROM package_questions WHERE quiz_package_id = ?', [packageId])
      if (question_ids.length) {
        const values = question_ids.map((qid, i) => [packageId, qid, i + 1])
        await conn.query('INSERT INTO package_questions (quiz_package_id, question_bank_id, order_index) VALUES ?', [values])
      }
    }
    await conn.commit()
    return getPackage(packageId, userId)
  } catch (e) {
    await conn.rollback(); throw e
  } finally {
    conn.release()
  }
}

async function deletePackage(packageId, userId) {
  const [res] = await pool.query('DELETE FROM quiz_packages WHERE id = ? AND user_id = ?', [packageId, userId])
  if (!res.affectedRows) { const e = new Error('Package not found'); e.status = 404; throw e }
}

async function getPackageQuestions(packageId, userId) {
  // Verifikasi akses
  const [[pkg]] = await pool.query(
    'SELECT id FROM quiz_packages WHERE id = ? AND (is_public = 1 OR user_id = ?)',
    [packageId, userId]
  )
  if (!pkg) { const e = new Error('Package not found'); e.status = 404; throw e }

  const [questions] = await pool.query(
    `SELECT qb.id, qb.type, qb.question_data, pq.order_index
     FROM package_questions pq
     JOIN question_banks qb ON qb.id = pq.question_bank_id
     WHERE pq.quiz_package_id = ?
     ORDER BY pq.order_index`,
    [packageId]
  )
  // Hapus correct_answer sebelum dikirim ke client
  return questions.map((q) => {
    const data = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data
    const { correct_answer, ...safeData } = data
    return { id: q.id, type: q.type, order_index: q.order_index, question_data: safeData }
  })
}

async function submitPackageAnswers(packageId, userId, answers, timeTaken = null) {
  const [[pkg]] = await pool.query(
    `SELECT qp.title, lang.code AS language_code
     FROM quiz_packages qp
     JOIN languages lang ON lang.id = qp.language_id
     WHERE qp.id = ?`,
    [packageId]
  )
  if (!pkg) { const e = new Error('Package not found'); e.status = 404; throw e }

  const [questions] = await pool.query(
    `SELECT qb.id, qb.type, qb.question_data
     FROM package_questions pq
     JOIN question_banks qb ON qb.id = pq.question_bank_id
     WHERE pq.quiz_package_id = ?
     ORDER BY pq.order_index`,
    [packageId]
  )
  if (!questions.length) { const e = new Error('No questions found'); e.status = 404; throw e }

  const questionMap = Object.fromEntries(
    questions.map((q) => {
      const data = typeof q.question_data === 'string' ? JSON.parse(q.question_data) : q.question_data
      return [q.id, { type: q.type, data, correct_answer: data.correct_answer?.trim() }]
    })
  )

  const normalize = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/, '')
  let correct = 0
  const results = answers.map(({ question_id, answer }) => {
    const q = questionMap[question_id]
    const isCorrect = q && normalize(answer) === normalize(q.correct_answer)
    if (isCorrect) correct++
    return { question_id, is_correct: isCorrect, correct_answer: q?.correct_answer }
  })

  const score    = Math.round((correct / questions.length) * 100)
  const xpEarned = correct * 5

  const today = new Date().toISOString().slice(0, 10)
  await pool.query(
    `UPDATE users SET
       xp = xp + ?,
       streak = CASE
         WHEN last_activity_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN streak + 1
         WHEN last_activity_date = CURDATE() THEN streak
         ELSE 1
       END,
       last_activity_date = ?
     WHERE id = ?`,
    [xpEarned, today, userId]
  )

  const [sessionRes] = await pool.query(
    `INSERT INTO quiz_sessions (user_id, source_type, source_id, source_name, language_code, score, correct, total, xp_earned, time_taken)
     VALUES (?, 'quiz_package', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, packageId, pkg.title, pkg.language_code, score, correct, questions.length, xpEarned, timeTaken]
  )
  const sessionId = sessionRes.insertId

  if (answers.length) {
    const answerValues = answers.map(({ question_id, answer }) => {
      const q = questionMap[question_id]
      const { correct_answer, ...safeData } = q?.data || {}
      return [
        sessionId, question_id, q?.type || 'multiple_choice',
        JSON.stringify(safeData), answer || null, q?.correct_answer || '',
        results.find((r) => r.question_id === question_id)?.is_correct ? 1 : 0,
      ]
    })
    await pool.query(
      'INSERT INTO session_answers (session_id, question_ref_id, question_type, question_data, user_answer, correct_answer, is_correct) VALUES ?',
      [answerValues]
    )
  }

  const [[user]] = await pool.query('SELECT xp, streak FROM users WHERE id = ?', [userId])
  return { score, correct, total: questions.length, xp_earned: xpEarned, session_id: sessionId, results, user }
}

// ── QUESTION BANK ─────────────────────────────────────────────

async function listQuestions({ userId, languageId, type }) {
  let sql = `
    SELECT qb.id, qb.type, qb.question_data, qb.created_at,
           lang.name AS language_name, lang.code AS language_code
    FROM question_banks qb
    JOIN languages lang ON lang.id = qb.language_id
    WHERE qb.user_id = ?
  `
  const params = [userId]
  if (languageId) { sql += ' AND qb.language_id = ?'; params.push(languageId) }
  if (type) { sql += ' AND qb.type = ?'; params.push(type) }
  sql += ' ORDER BY qb.created_at DESC'

  const [rows] = await pool.query(sql, params)
  return rows
}

async function createQuestion(userId, { language_id, type, question_data }) {
  const [res] = await pool.query(
    'INSERT INTO question_banks (user_id, language_id, type, question_data) VALUES (?,?,?,?)',
    [userId, language_id, type, JSON.stringify(question_data)]
  )
  const [[row]] = await pool.query(
    `SELECT qb.*, lang.name AS language_name FROM question_banks qb
     JOIN languages lang ON lang.id = qb.language_id WHERE qb.id = ?`,
    [res.insertId]
  )
  return row
}

async function deleteQuestion(questionId, userId) {
  const [res] = await pool.query('DELETE FROM question_banks WHERE id = ? AND user_id = ?', [questionId, userId])
  if (!res.affectedRows) { const e = new Error('Question not found'); e.status = 404; throw e }
}

module.exports = { listPackages, getPackage, createPackage, updatePackage, deletePackage, getPackageQuestions, submitPackageAnswers, listQuestions, createQuestion, deleteQuestion }
