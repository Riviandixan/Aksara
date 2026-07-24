USE aksara_ai;

CREATE TABLE IF NOT EXISTS notifications (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(50)  NOT NULL,  -- 'achievement', 'battle_result', 'streak', 'level_up', 'quiz_complete'
  title      VARCHAR(100) NOT NULL,
  message    TEXT NOT NULL,
  icon       VARCHAR(50)  NOT NULL DEFAULT 'Bell',
  is_read    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user_read (user_id, is_read),
  INDEX idx_notif_created (created_at)
);
