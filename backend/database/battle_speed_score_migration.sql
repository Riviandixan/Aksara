USE aksara_ai;

ALTER TABLE battle_answers
  ADD COLUMN time_left TINYINT UNSIGNED NOT NULL DEFAULT 0
    COMMENT 'Sisa waktu (detik) saat user menjawab — dipakai untuk bonus skor kecepatan'
  AFTER is_correct;
