-- ============================================================
-- AksaraAI - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS aksara_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aksara_ai;

-- ------------------------------------------------------------
-- 1. USERS
--    avatar_url di-generate dari DiceBear API berdasarkan username
-- ------------------------------------------------------------
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  email       VARCHAR(100) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  avatar_url  VARCHAR(500) NOT NULL,
  xp          INT UNSIGNED NOT NULL DEFAULT 0,
  streak      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  last_activity_date DATE NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. LANGUAGES
--    Daftar bahasa yang tersedia di platform
-- ------------------------------------------------------------
CREATE TABLE languages (
  id        TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code      VARCHAR(10)  NOT NULL UNIQUE,  -- e.g. 'en', 'ja', 'ko'
  name      VARCHAR(50)  NOT NULL,          -- e.g. 'English', 'Japanese'
  flag_emoji VARCHAR(10) NOT NULL
);

INSERT INTO languages (code, name, flag_emoji) VALUES
  ('en', 'English',  '🇬🇧'),
  ('ja', 'Japanese', '🇯🇵'),
  ('ko', 'Korean',   '🇰🇷'),
  ('fr', 'French',   '🇫🇷'),
  ('de', 'German',   '🇩🇪'),
  ('zh', 'Chinese',  '🇨🇳'),
  ('ru', 'Russian',  '🇷🇺'),
  ('es', 'Spanish',  '🇪🇸');

-- ------------------------------------------------------------
-- 3. LEARNING PATHS
--    Satu user bisa punya banyak learning path (per bahasa).
--    AI men-generate path ini saat user memilih bahasa.
-- ------------------------------------------------------------
CREATE TABLE learning_paths (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  language_id TINYINT UNSIGNED NOT NULL,
  base_level  ENUM('beginner', 'intermediate') NOT NULL DEFAULT 'beginner',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_language (user_id, language_id, base_level),
  CONSTRAINT fk_lp_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_lp_language FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 4. LEVELS
--    Topik/level yang di-generate AI untuk setiap learning path.
--    status: 'locked' | 'unlocked' | 'completed'
--    order_index menentukan urutan tampil (Level 1 = index 1)
-- ------------------------------------------------------------
CREATE TABLE levels (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  learning_path_id INT UNSIGNED NOT NULL,
  order_index      TINYINT UNSIGNED NOT NULL,
  title            VARCHAR(100) NOT NULL,   -- e.g. "Greetings & Introductions"
  description      TEXT NULL,
  status           ENUM('locked', 'unlocked', 'completed') NOT NULL DEFAULT 'locked',
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_path_order (learning_path_id, order_index),
  CONSTRAINT fk_level_path FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 5. QUIZZES
--    Soal kuis yang di-generate AI per level (5 soal/sesi).
--    question_data (JSON) menyimpan struktur soal sesuai type:
--      - multiple_choice : { question, options: [], correct_answer }
--      - translate       : { sentence, correct_answer }
--      - word_arrange    : { words: [], correct_answer }
-- ------------------------------------------------------------
CREATE TABLE quizzes (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  level_id      INT UNSIGNED NOT NULL,
  type          ENUM('multiple_choice', 'translate', 'word_arrange') NOT NULL,
  question_data JSON NOT NULL,
  order_index   TINYINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_quiz_level FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 6. USER PROGRESS
--    Rekam jejak setiap kali user menyelesaikan satu level/sesi.
--    xp_earned dihitung backend berdasarkan score.
-- ------------------------------------------------------------
CREATE TABLE user_progress (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  level_id   INT UNSIGNED NOT NULL,
  score      TINYINT UNSIGNED NOT NULL,   -- 0-100 (persentase benar)
  xp_earned  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_up_user  FOREIGN KEY (user_id)  REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_up_level FOREIGN KEY (level_id) REFERENCES levels(id)  ON DELETE CASCADE
);
