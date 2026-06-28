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
    hardware_uuid VARCHAR(100) UNIQUE NOT NULL, -- UUID phần cứng duy nhất (không đổi khi cài lại OS)
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
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'maintenance', 'sleeping'
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
  *Cơ chế hoạt động*: Cứ mỗi 5 giây, Agent sẽ gửi gói tin chứa thông số CPU, RAM, ổ đĩa và băng thông mạng lên endpoint này. Việc nhận gói tin này thành công sẽ cập nhật trường `updated_at` của thiết bị trong cơ sở dữ liệu.
- **Nhận lệnh điều khiển từ Server (Command Long Polling / WebSocket)**:
  `GET /api/v1/agent/tasks`
  *Cơ chế hoạt động*: Agent duy trì một kết nối dài (Long Polling hoặc WebSocket) để nhận các lệnh thực thi từ Server (như Khởi động lại hoặc Gỡ ứng dụng).

### 3.2 API dành cho Frontend (Xác thực qua JWT Token)
- **Lấy danh sách thiết bị theo Workspace**:
  `GET /api/v1/devices?workspace_id=<uuid>`
- **Lấy thông số thời gian thực của một thiết bị**:
  `GET /api/v1/devices/{id}/realtime`
- **Lấy lịch sử thông số để vẽ biểu đồ**:
  `GET /api/v1/devices/{id}/metrics?range=1h`
- **Gửi lệnh Khởi động lại thiết bị (Reboot)**:
  `POST /api/v1/devices/{id}/reboot`
  *Luồng xử lý*: Server ghi nhận lệnh vào hàng đợi tác vụ của thiết bị -> Agent nhận lệnh qua cổng `/tasks` -> Thực thi lệnh khởi động lại của hệ điều hành (`shutdown /r /t 0` trên Windows, `sudo reboot` trên Linux/macOS).
- **Gửi lệnh Gỡ ứng dụng Agent khỏi thiết bị (Uninstall)**:
  `POST /api/v1/devices/{id}/uninstall`
  *Luồng xử lý*: Server gửi lệnh gỡ cài đặt -> Agent nhận lệnh -> Thực thi đoạn script gỡ bỏ dịch vụ chạy ngầm trên máy vật lý, tự xóa thư mục cài đặt -> Gửi yêu cầu cuối cùng xóa bản ghi thiết bị khỏi database Server -> Tiến trình Agent tự tắt (exit).

---

## 4. XỬ LÝ TRẠNG THÁI ONLINE/OFFLINE VÀ TÁC VỤ ĐIỀU KHIỂN

### 4.1 Cơ chế xác định trạng thái Online/Offline
Để xác định trạng thái hoạt động của thiết bị một cách chính xác mà không làm nghẽn hệ thống:
- **Trạng thái Online**: Thiết bị được coi là Online khi Server nhận được gói tin báo cáo định kỳ (Heartbeat) từ Agent trong vòng 15 giây gần nhất.
- **Trạng thái Offline**: Một tiến trình chạy ngầm định kỳ trên Server (Cronjob quét mỗi 10 giây) sẽ quét bảng `devices`. Nếu thiết bị nào có thời gian cập nhật gói tin cuối cùng (`updated_at`) vượt quá 15 giây so với thời gian hiện tại, Server sẽ tự động cập nhật trường `status` của thiết bị đó thành `offline` và kích hoạt sự kiện cảnh báo mất kết nối nếu được cấu hình.
- **Trạng thái Sleeping**: Khi người dùng chủ động gập màn hình hoặc tắt máy tính (Windows/macOS) ở chế độ ngủ (Sleep Mode), Agent sẽ bắt sự kiện tắt máy của hệ điều hành và gửi yêu cầu khẩn cấp lên Server để cập nhật `status` sang `sleeping` trước khi ngắt mạng hoàn toàn. Điều này giúp Server tạm ngưng gửi cảnh báo mất kết nối sai.
- **Trạng thái Maintenance**: Trạng thái bảo trì do người dùng chủ động bật từ giao diện để tạm ngưng nhận các cảnh báo Offline khi tiến hành nâng cấp hệ thống.

### 4.2 Cơ chế thực thi lệnh Khởi động lại (Reboot)
- **Windows**: Agent gọi lệnh hệ thống bằng quyền Admin: `shutdown.exe /r /f /t 0` (Khởi động lại ngay lập tức và cưỡng chế đóng các ứng dụng đang treo).
- **Linux & macOS**: Agent gọi lệnh hệ thống bằng quyền root/sudoer: `reboot` hoặc `shutdown -r now`.

### 4.3 Cơ chế Gỡ cài đặt sạch (Clean Uninstall)
Khi nhận lệnh Uninstall từ Server, Agent sẽ thực hiện chuỗi hành động dọn dẹp sau trên thiết bị vật lý:
- **Windows**:
  - Dừng dịch vụ Windows Service tương ứng (ví dụ: `lit-monitor-agent`).
  - Chạy lệnh xóa dịch vụ khỏi hệ thống: `sc.exe delete lit-monitor-agent`.
  - Tạo một script tự xóa tạm thời (.bat) để xóa file thực thi Agent chính sau khi tiến trình chính dừng hẳn.
- **Linux (Systemd)**:
  - Dừng và vô hiệu hóa dịch vụ: `systemctl stop lit-agent && systemctl disable lit-agent`.
  - Xóa tệp cấu hình dịch vụ `/etc/systemd/system/lit-agent.service`.
  - Chạy lệnh `systemctl daemon-reload`.
  - Tự xóa file thực thi và thư mục cấu hình `/etc/lit-agent/`.
- **macOS (Launchd)**:
  - Vô hiệu hóa launch agent: `launchctl unload ~/Library/LaunchAgents/io.litsoftware.agent.plist`.
  - Xóa tệp cấu hình plist tương ứng.
  - Tự xóa file thực thi và thư mục cấu hình.

---

## 5. QUẢN LÝ RỦI RO VÀ THIẾT SÓT HỆ THỐNG (RISK & MITIGATION)

### 5.1 Quản lý phình to dữ liệu (Data Retention & Downsampling)
Để tránh hiện tượng cơ sở dữ liệu bị phình to dung lượng ổ đĩa khi nhận thông số liên tục từ hàng ngàn thiết bị:
- **Dữ liệu dưới 24 giờ**: Giữ nguyên tần suất chi tiết 5 giây phục vụ vẽ biểu đồ thời gian thực.
- **Dữ liệu từ 2 đến 7 ngày**: Tiến hành chạy tác vụ gộp dữ liệu định kỳ (Downsampling) mỗi giờ. Tính toán trung bình cộng các thông số CPU, RAM, ổ đĩa trong mỗi 5 phút để chuyển đổi thành một bản ghi tổng hợp duy nhất, sau đó xóa toàn bộ các bản ghi chi tiết cũ để giải phóng dung lượng đĩa.
- **Dữ liệu trên 30 ngày**: Chỉ lưu lại giá trị trung bình cộng theo ngày và tự động xóa bỏ hoàn toàn dữ liệu thô.

### 5.2 Bảo mật luồng thực thi lệnh (Secure Command Execution)
Để ngăn chặn nguy cơ tin tặc chiếm quyền điều khiển Server và gửi lệnh độc hại xuống thiết bị người dùng:
- **Cấm truyền chuỗi lệnh thô (No raw commands)**: Server cấm tuyệt đối việc gửi các chuỗi lệnh shell tự do (ví dụ: `rm -rf /`).
- **Danh sách lệnh trắng (Command Whitelist)**: Thiết lập một danh mục các mã lệnh hợp lệ được lập trình sẵn trên Agent (ví dụ: mã `CMD_REBOOT`, `CMD_UNINSTALL`). Agent chỉ thực thi các hàm logic tương ứng với mã lệnh này.
- **Ký số gói lệnh (Digital Signature Verification)**:
  - Máy chủ Server giữ một Private Key. Mỗi khi gửi lệnh điều khiển, Server phải thực hiện ký số vào gói dữ liệu (chứa ID thiết bị, mã lệnh, timestamp hết hạn).
  - Agent được cấu hình lưu sẵn Public Key của Server từ khi cài đặt. Agent bắt buộc phải xác thực chữ ký của gói lệnh trước khi tiến hành thực thi. Lệnh hết hạn (timestamp quá 60 giây) hoặc chữ ký không khớp sẽ bị hủy bỏ ngay lập tức.

### 5.3 Tránh trùng lặp định danh thiết bị (Unique Identity)
- Agent bắt buộc phải truy vấn mã UUID phần cứng duy nhất của thiết bị (ví dụ: UUID của bo mạch chủ qua lệnh `wmic csproduct get uuid` trên Windows, hoặc `/etc/machine-id` trên Linux) để gửi lên Server làm khóa định danh duy nhất (`hardware_uuid`).
- Mọi trường hợp đăng ký trùng Hostname sẽ được phân biệt dựa trên mã `hardware_uuid` này.

### 5.4 Cơ chế Tự động Cập nhật Agent (Auto-Update)
- Agent định kỳ kiểm tra phiên bản mới nhất bằng cách gọi API Server: `GET /api/v1/agent/version`.
- Nếu phát hiện phiên bản mới hơn, Agent sẽ tải tệp tin thực thi binary mới từ Server, xác thực mã băm SHA-256 để đảm bảo tính toàn vẹn của tệp tin, sau đó chạy script khởi động lại dịch vụ để cài đặt phiên bản mới đè lên phiên bản cũ.

---

## 6. KỊCH BẢN KIỂM THỬ VÀ XÁC THỰC (TEST CASES)

### 4.1 Kiểm thử Agent thu thập thông số (Unit Test)
- **Đo lường chính xác**: Viết các test case xác thực hàm đọc tài nguyên hệ thống trả về đúng thông số thực tế của CPU, RAM trên từng hệ điều hành riêng biệt (sử dụng thư viện `shirou/gopsutil` trên Go).
- **Xử lý mất kết nối mạng**: Kiểm thử hành vi của Agent khi máy chủ Server bị tắt đột ngột. Agent phải tự động lưu đệm thông số (buffering) vào bộ nhớ tạm cục bộ và gửi bù lại khi kết nối được khôi phục, tránh làm mất dữ liệu biểu đồ.

### 4.2 Kiểm thử hiệu năng API (Stress Test)
- Chạy kịch bản giả lập 1,000 Agent gửi thông số đồng thời mỗi 5 giây để kiểm tra khả năng chịu tải của Backend Go và đảm bảo không xảy ra hiện tượng khóa chết (deadlock) khi ghi dữ liệu liên tục vào cơ sở dữ liệu PostgreSQL.
