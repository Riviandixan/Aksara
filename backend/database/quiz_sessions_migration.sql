-- ============================================================
-- Quiz Sessions — riwayat semua sesi latihan user
-- source_type: 'learning_path' | 'quiz_package'
-- source_id  : level_id (learning_path) atau quiz_package_id
-- ============================================================

USE db_aksara_ai;

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  source_type ENUM('learning_path', 'quiz_package', 'exam') NOT NULL,
  source_id   INT UNSIGNED NOT NULL,
  source_name VARCHAR(200) NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  score       TINYINT UNSIGNED NOT NULL,
  correct     TINYINT UNSIGNED NOT NULL,
  total       TINYINT UNSIGNED NOT NULL,
  xp_earned   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  time_taken  SMALLINT UNSIGNED NULL,
  played_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_qs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_qs_user_played (user_id, played_at DESC)
);

-- Jawaban per soal dalam satu sesi
CREATE TABLE IF NOT EXISTS session_answers (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id      INT UNSIGNED NOT NULL,
  question_ref_id INT UNSIGNED NOT NULL,   -- quiz_id (LP) atau question_bank_id (package)
  question_type   ENUM('multiple_choice', 'translate', 'word_arrange') NOT NULL,
  question_data   JSON NOT NULL,           -- snapshot soal (tanpa correct_answer)
  user_answer     TEXT NULL,
  correct_answer  TEXT NOT NULL,
  is_correct      TINYINT(1) NOT NULL DEFAULT 0,

  CONSTRAINT fk_sa_session FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  INDEX idx_sa_session (session_id)
);
