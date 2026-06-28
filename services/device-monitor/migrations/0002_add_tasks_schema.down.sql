-- Migration: 0002_add_tasks_schema.down.sql
-- Description: Xóa bảng lưu trữ hàng đợi công việc

DROP INDEX IF EXISTS idx_tasks_device_status;
DROP TABLE IF EXISTS tasks;
