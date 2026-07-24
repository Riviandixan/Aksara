-- ============================================================
-- AksaraAI - Achievements Migration
-- ============================================================
USE aksara_ai;

CREATE TABLE IF NOT EXISTS achievements (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  title       VARCHAR(100) NOT NULL,
  description VARCHAR(255) NOT NULL,
  icon        VARCHAR(10)  NOT NULL,
  category    ENUM('xp', 'streak', 'level', 'exam', 'battle', 'language') NOT NULL,
  threshold   INT UNSIGNED NOT NULL
);

INSERT INTO achievements (code, title, description, icon, category, threshold) VALUES
  -- XP
  ('xp_100',    'Pemula XP',        'Kumpulkan 100 XP',           'Zap',        'xp',       100),
  ('xp_500',    'Pejuang XP',       'Kumpulkan 500 XP',           'BatteryMedium', 'xp',    500),
  ('xp_1000',   'Master XP',        'Kumpulkan 1.000 XP',         'BatteryFull','xp',      1000),
  ('xp_5000',   'Legenda XP',       'Kumpulkan 5.000 XP',         'Crown',      'xp',      5000),
  -- Streak
  ('streak_3',  'Konsisten',        'Streak 3 hari berturut',     'Flame',      'streak',     3),
  ('streak_7',  'Seminggu Penuh',   'Streak 7 hari berturut',     'CalendarCheck', 'streak', 7),
  ('streak_30', 'Bulan Berdedikasi','Streak 30 hari berturut',    'Trophy',     'streak',    30),
  -- Level
  ('level_1',   'Langkah Pertama',  'Selesaikan 1 level',         'MapPin',     'level',      1),
  ('level_10',  'Rajin Belajar',    'Selesaikan 10 level',        'BookOpen',   'level',     10),
  ('level_50',  'Penjelajah',       'Selesaikan 50 level',        'Map',        'level',     50),
  -- Exam
  ('exam_1',    'Ujian Pertama',    'Selesaikan 1 ujian',         'ClipboardList', 'exam',    1),
  ('exam_ace',  'Nilai Sempurna',   'Raih grade A di ujian',      'GraduationCap', 'exam',    1),
  -- Battle
  ('battle_1',  'Petarung',         'Ikuti 1 battle',             'Swords',     'battle',     1),
  ('battle_win','Pemenang',         'Menangkan 1 battle',         'Medal',      'battle',     1),
  ('battle_10', 'Gladiator',        'Ikuti 10 battle',            'Shield',     'battle',    10),
  -- Language
  ('lang_2',    'Poliglot Muda',    'Belajar 2 bahasa',           'Globe',      'language',   2),
  ('lang_5',    'Poliglot Sejati',  'Belajar 5 bahasa',           'Globe2',     'language',   5);

CREATE TABLE IF NOT EXISTS user_achievements (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  achievement_id TINYINT UNSIGNED NOT NULL,
  unlocked_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_achievement (user_id, achievement_id),
  CONSTRAINT fk_ua_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ua_ach  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
);
