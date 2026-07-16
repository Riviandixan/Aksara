USE aksara_ai;

CREATE TABLE IF NOT EXISTS battle_rooms (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(8)   NOT NULL UNIQUE,
  host_id       INT UNSIGNED NOT NULL,
  source_type   ENUM('ai', 'package') NOT NULL DEFAULT 'ai',
  source_id     INT UNSIGNED NULL,          -- quiz_package id jika source_type='package'
  language_id   TINYINT UNSIGNED NULL,      -- jika source_type='ai'
  question_count TINYINT UNSIGNED NOT NULL DEFAULT 10,
  time_per_question TINYINT UNSIGNED NOT NULL DEFAULT 15, -- detik
  status        ENUM('waiting','countdown','playing','finished') NOT NULL DEFAULT 'waiting',
  questions     JSON NULL,                  -- soal disimpan di sini setelah generate
  current_question TINYINT UNSIGNED NOT NULL DEFAULT 0,
  started_at    TIMESTAMP NULL,
  finished_at   TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_br_host     FOREIGN KEY (host_id)     REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_br_language FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS battle_participants (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id    INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  score      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  correct    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `rank`     TINYINT UNSIGNED NULL,
  joined_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP NULL,

  UNIQUE KEY uq_room_user (room_id, user_id),
  CONSTRAINT fk_bp_room FOREIGN KEY (room_id) REFERENCES battle_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_bp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS battle_answers (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id      INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  order_index  TINYINT UNSIGNED NOT NULL,
  user_answer  TEXT NULL,
  is_correct   TINYINT(1) NOT NULL DEFAULT 0,
  answered_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ba_room FOREIGN KEY (room_id) REFERENCES battle_rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_ba_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
