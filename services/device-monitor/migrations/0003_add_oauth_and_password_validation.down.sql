-- Migration: 0003_add_oauth_and_password_validation.down.sql
-- Description: Hoàn tác các cập nhật cấu trúc OAuth và phiên đăng nhập

DROP TABLE IF EXISTS login_logs;

ALTER TABLE users DROP CONSTRAINT IF EXISTS unique_oauth;
ALTER TABLE users DROP COLUMN IF EXISTS oauth_id;
ALTER TABLE users DROP COLUMN IF EXISTS oauth_provider;
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;
