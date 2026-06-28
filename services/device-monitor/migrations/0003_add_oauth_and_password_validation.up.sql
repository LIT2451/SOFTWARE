-- Migration: 0003_add_oauth_and_password_validation.up.sql
-- Description: Cập nhật cấu trúc hỗ trợ Google & GitHub OAuth và đăng ký bảo mật hơn

-- Cho phép password_hash có thể NULL trong trường hợp đăng nhập thuần bằng OAuth
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Thêm thông tin liên kết OAuth
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(100) DEFAULT NULL;

-- Tạo ràng buộc UNIQUE kết hợp oauth_provider + oauth_id
ALTER TABLE users ADD CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_id);

-- Bảng lưu nhật ký phiên đăng nhập (login_logs) phục vụ kiểm tra bảo mật
CREATE TABLE IF NOT EXISTS login_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    status VARCHAR(20) NOT NULL, -- 'success', 'failed_password', 'failed_username', 'oauth_failed'
    reason VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
