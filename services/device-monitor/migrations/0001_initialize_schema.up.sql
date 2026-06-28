-- Migration: 0001_initialize_schema.up.sql
-- Description: Khởi tạo cấu trúc bảng cho hệ thống LIT-SOFTWARE

-- Hỗ trợ tạo UUID tự động
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng tài khoản người dùng (users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Bảng cấu hình thiết bị (devices)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hardware_uuid VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    hostname VARCHAR(100) NOT NULL,
    os_type VARCHAR(20) NOT NULL, -- 'linux', 'windows', 'darwin'
    os_name VARCHAR(100) NOT NULL,
    os_version VARCHAR(100),
    cpu_model VARCHAR(150) NOT NULL,
    cpu_cores INTEGER NOT NULL,
    cpu_threads INTEGER NOT NULL,
    ram_total BIGINT NOT NULL,
    disk_total BIGINT NOT NULL,
    ip_address VARCHAR(45),
    secret_key VARCHAR(64) NOT NULL,
    workspace_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'offline' NOT NULL, -- 'online', 'offline', 'maintenance', 'sleeping'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Bảng lịch sử hiệu năng (device_metrics)
CREATE TABLE IF NOT EXISTS device_metrics (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
    cpu_usage NUMERIC(5, 2) NOT NULL,
    ram_usage NUMERIC(5, 2) NOT NULL,
    disk_usage NUMERIC(5, 2) NOT NULL,
    network_rx BIGINT NOT NULL,
    network_tx BIGINT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tạo chỉ mục tối ưu hóa truy vấn theo thời gian cho metrics
CREATE INDEX IF NOT EXISTS idx_metrics_device_time ON device_metrics(device_id, recorded_at DESC);

-- 4. Bảng nhật ký kiểm toán (audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
