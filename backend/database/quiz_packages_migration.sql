-- ============================================================
-- AksaraAI - Quiz Package Feature Migration
-- Jalankan setelah schema.sql
-- ============================================================

USE aksara_ai;

-- ------------------------------------------------------------
-- 7. QUESTION BANKS
--    Bank soal individual yang dibuat user secara manual.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_banks (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  language_id   TINYINT UNSIGNED NOT NULL,
  type          ENUM('multiple_choice', 'translate', 'word_arrange') NOT NULL,
  question_data JSON NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_qb_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_qb_language FOREIGN KEY (language_id) REFERENCES languages(id)  ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 8. QUIZ PACKAGES
--    Paket soal yang dikumpulkan dari bank soal.
--    is_public: bisa dilihat semua user atau hanya pembuat.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_packages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  language_id TINYINT UNSIGNED NOT NULL,
  title       VARCHAR(150) NOT NULL,
  description TEXT NULL,
  is_public   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_qp_user     FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  CONSTRAINT fk_qp_language FOREIGN KEY (language_id) REFERENCES languages(id)  ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 9. PACKAGE QUESTIONS
--    Relasi many-to-many antara paket dan soal bank.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS package_questions (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  quiz_package_id   INT UNSIGNED NOT NULL,
  question_bank_id  INT UNSIGNED NOT NULL,
  order_index       SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  UNIQUE KEY uq_pkg_q (quiz_package_id, question_bank_id),
  CONSTRAINT fk_pq_package  FOREIGN KEY (quiz_package_id)  REFERENCES quiz_packages(id)   ON DELETE CASCADE,
  CONSTRAINT fk_pq_question FOREIGN KEY (question_bank_id) REFERENCES question_banks(id)  ON DELETE CASCADE
);
