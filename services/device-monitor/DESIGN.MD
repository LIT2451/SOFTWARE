# ĐẶC TẢ THIẾT KẾ PHÂN HỆ GIÁM SÁT THIẾT BỊ (DESIGN.MD)

Tài liệu này đặc tả thiết kế kiến trúc, cấu trúc dữ liệu và giao diện cho phân hệ Giám sát Thiết bị Đa nền tảng (VPS, Windows, MacBook) thuộc hệ thống LIT-SOFTWARE.

---

## 1. KIẾN TRÚC TỔNG QUAN (ARCHITECTURE OVERVIEW)

Để giám sát đa dạng hệ điều hành nằm ở các môi trường mạng khác nhau (bao gồm cả máy tính cá nhân nằm sau NAT/mạng nội bộ), hệ thống sử dụng mô hình **Agent-Server (Pull/Push hybrid)**:

```
[ Thiết bị cần giám sát: Linux / Windows / macOS ]
                      │
                      ▼ (Đẩy thông số định kỳ - HTTPS / WebSocket)
         [ Backend API Gateway (Go) ]
                      │
                      ├─► [ Database: PostgreSQL ] (Lưu cấu hình & lịch sử)
                      │
                      └─► [ Redis ] (Lưu cache trạng thái Realtime)
                      ▲
                      │ (Truy xuất dữ liệu hiển thị)
            [ Frontend (Next.js) ]
```

### 1.1 Các thành phần hệ thống:
1. **LIT-Monitor-Agent**: Chương trình nhỏ chạy ngầm (Daemon/Service) trên từng thiết bị mục tiêu (viết bằng Golang để biên dịch ra file thực thi chạy trực tiếp không cần runtime phụ thuộc trên Windows/macOS/Linux).
2. **LIT-Monitor-Server (Backend)**: Dịch vụ trung tâm xử lý nhận dữ liệu từ các Agent, lưu trữ vào cơ sở dữ liệu và cung cấp API cho Frontend (viết bằng Golang để đạt hiệu năng xử lý cao).
3. **LIT-Portal-Frontend (Frontend)**: Giao diện web hiển thị danh sách thiết bị và biểu đồ tài nguyên thời gian thực theo phong cách Apple Liquid Glass.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Sử dụng cơ sở dữ liệu PostgreSQL để quản lý cấu hình và trạng thái thiết bị.

### 2.1 Bảng cấu hình thiết bị (`devices`)
Lưu trữ thông tin định danh, cấu hình phần cứng vật lý cố định và phân quyền của từng thiết bị.

```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- Tên thiết bị do người dùng đặt hoặc tự động lấy từ Hostname
    hostname VARCHAR(100) NOT NULL, -- Tên máy tính thực tế trong hệ điều hành
    os_type VARCHAR(20) NOT NULL, -- 'linux', 'windows', 'darwin'
    os_name VARCHAR(100) NOT NULL, -- Tên chi tiết hệ điều hành (ví dụ: 'Windows 11 Pro', 'macOS Sonoma', 'Ubuntu 22.04.3 LTS')
    os_version VARCHAR(100), -- Số phiên bản hệ điều hành
    cpu_model VARCHAR(150) NOT NULL, -- Tên model chip xử lý (ví dụ: 'Apple M2 Pro', 'Intel Core i9-13900K')
    cpu_cores INTEGER NOT NULL, -- Số nhân vật lý
    cpu_threads INTEGER NOT NULL, -- Số luồng logic
    ram_total BIGINT NOT NULL, -- Tổng dung lượng RAM vật lý (bytes)
    disk_total BIGINT NOT NULL, -- Tổng dung lượng ổ cứng (bytes)
    ip_address VARCHAR(45), -- Địa chỉ IP công cộng (Public IP) hoặc IP nội bộ (Private IP) của Agent
    secret_key VARCHAR(64) NOT NULL, -- Mã khóa dùng để Agent xác thực với Server
    workspace_id UUID NOT NULL, -- Định danh không gian làm việc (Cá nhân / Cộng đồng)
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'maintenance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### 2.2 Bảng lịch sử hiệu năng (`device_metrics`)
Lưu trữ các thông số phần cứng theo thời gian để vẽ biểu đồ.

```sql
CREATE TABLE device_metrics (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    cpu_usage NUMERIC(5, 2) NOT NULL, -- % sử dụng CPU
    ram_usage NUMERIC(5, 2) NOT NULL, -- % sử dụng RAM
    disk_usage NUMERIC(5, 2) NOT NULL, -- % sử dụng ổ đĩa
    network_rx BIGINT NOT NULL, -- Dung lượng nhận (bytes)
    network_tx BIGINT NOT NULL, -- Dung lượng gửi (bytes)
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Chỉ mục tối ưu hóa truy vấn theo thời gian
CREATE INDEX idx_metrics_device_time ON device_metrics(device_id, recorded_at DESC);
```

---

## 3. THIẾT KẾ API ENDPOINTS

Tất cả API sử dụng định dạng JSON thống nhất và yêu cầu khóa xác thực.

### 3.1 API dành cho Agent (Xác thực qua `X-Agent-Secret`)
- **Đăng ký thiết bị ban đầu (Auto-Enrollment)**:
  `POST /api/v1/agent/enroll`
- **Gửi thông số hiệu năng định kỳ (Heartbeat & Metrics)**:
  `POST /api/v1/agent/report`
  *Cơ chế hoạt động*: Cứ mỗi 5 giây, Agent sẽ gửi gói tin chứa thông số CPU, RAM, ổ đĩa và băng thông mạng lên endpoint này.

### 3.2 API dành cho Frontend (Xác thực qua JWT Token)
- **Lấy danh sách thiết bị theo Workspace**:
  `GET /api/v1/devices?workspace_id=<uuid>`
- **Lấy thông số thời gian thực của một thiết bị**:
  `GET /api/v1/devices/{id}/realtime`
- **Lấy lịch sử thông số để vẽ biểu đồ**:
  `GET /api/v1/devices/{id}/metrics?range=1h`

---

## 4. KỊCH BẢN KIỂM THỬ VÀ XÁC THỰC (TEST CASES)

### 4.1 Kiểm thử Agent thu thập thông số (Unit Test)
- **Đo lường chính xác**: Viết các test case xác thực hàm đọc tài nguyên hệ thống trả về đúng thông số thực tế của CPU, RAM trên từng hệ điều hành riêng biệt (sử dụng thư viện `shirou/gopsutil` trên Go).
- **Xử lý mất kết nối mạng**: Kiểm thử hành vi của Agent khi máy chủ Server bị tắt đột ngột. Agent phải tự động lưu đệm thông số (buffering) vào bộ nhớ tạm cục bộ và gửi bù lại khi kết nối được khôi phục, tránh làm mất dữ liệu biểu đồ.

### 4.2 Kiểm thử hiệu năng API (Stress Test)
- Chạy kịch bản giả lập 1,000 Agent gửi thông số đồng thời mỗi 5 giây để kiểm tra khả năng chịu tải của Backend Go và đảm bảo không xảy ra hiện tượng khóa chết (deadlock) khi ghi dữ liệu liên tục vào cơ sở dữ liệu PostgreSQL.
