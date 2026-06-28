-- Migration: 0001_initialize_schema.down.sql
-- Description: Khôi phục cấu trúc bảng (Xóa toàn bộ cấu trúc)

DROP INDEX IF EXISTS idx_metrics_device_time;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS device_metrics;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS users;
