-- ============================================================
-- Exam Attempts — menyimpan soal ujian server-side
-- Jawaban (correct_answer) tidak pernah dikirim ke frontend
-- attempt dihapus otomatis setelah submit atau expires
-- ============================================================

USE db_aksara_ai;

CREATE TABLE IF NOT EXISTS exam_attempts (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  language_id TINYINT UNSIGNED NOT NULL,
  questions   JSON NOT NULL,              -- soal + correct_answer, disimpan di server
  expires_at  TIMESTAMP NOT NULL,         -- 20 menit setelah generate
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ea_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ea_user (user_id),
  INDEX idx_ea_expires (expires_at)
);
