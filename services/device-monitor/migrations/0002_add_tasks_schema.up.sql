-- Migration: 0002_add_tasks_schema.up.sql
-- Description: Khởi tạo bảng lưu trữ hàng đợi công việc điều khiển (tasks)

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
    command_type VARCHAR(50) NOT NULL, -- 'DOCKER_OP', 'SQL_QUERY', 'SQL_EXEC', 'REDIS_FLUSH', 'REBOOT', 'UNINSTALL'
    payload TEXT NOT NULL, -- Dữ liệu cấu hình lệnh (JSON được mã hóa hoặc ký số)
    signature TEXT NOT NULL, -- Chữ ký số RSA đảm bảo lệnh phát ra từ Server hợp lệ
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'sent', 'completed', 'failed'
    result TEXT, -- Log kết quả trả về từ Agent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Chỉ mục để Agent lấy tác vụ nhanh chóng theo thiết bị
CREATE INDEX IF NOT EXISTS idx_tasks_device_status ON tasks(device_id, status);
