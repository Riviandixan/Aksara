USE aksara_ai;

CREATE TABLE IF NOT EXISTS follows (
  follower_id  INT UNSIGNED NOT NULL,
  following_id INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT fk_follow_follower  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_follow_following FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- type: 'level_complete' | 'battle_win' | 'battle_finish' | 'achievement'
CREATE TABLE IF NOT EXISTS activity_feed (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  type       VARCHAR(30)  NOT NULL,
  data       JSON         NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feed_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_feed_user_created (user_id, created_at DESC)
);
