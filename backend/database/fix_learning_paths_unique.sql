USE db_aksara_ai;

ALTER TABLE learning_paths
  DROP INDEX uq_user_language,
  ADD UNIQUE KEY uq_user_language (user_id, language_id, base_level);
