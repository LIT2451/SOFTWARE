# ĐẶC TẢ THIẾT KẾ PHÂN HỆ QUẢN TRỊ DỊCH VỤ (DESIGN.MD)

Tài liệu này đặc tả kiến trúc, cấu trúc dữ liệu và giao diện cho phân hệ Quản trị Dịch vụ (Docker, SQL, Redis, Systemd) thuộc hệ thống LIT-SOFTWARE.

---

## 1. PHÂN QUYỀN VÀ KHÔNG GIAN LÀM VIỆC (MULTI-TENANCY & AUTHORIZATION)

Để đáp ứng nhu cầu sử dụng cho cá nhân và cộng đồng, hệ thống áp dụng cơ chế phân quyền dựa trên quyền sở hữu (Ownership-Based Access Control) kết hợp vai trò Quản trị viên tối cao (Super Admin):

### 1.1 Các cấp độ quyền hạn:
- **Người dùng thường (User)**:
  - Chỉ nhìn thấy và quản lý các thiết bị do chính tài khoản của mình tạo ra hoặc đăng ký (bảng `devices` liên kết qua trường `owner_id`).
  - Tuyệt đối không thể nhìn thấy hoặc tương tác với thiết bị của người dùng khác.
- **Quản trị viên tối cao (Admin)**:
  - Có toàn quyền xem danh sách, giám sát thông số và gửi lệnh điều khiển đến tất cả các thiết bị trong toàn hệ thống.
  - Có quyền quản trị các tài khoản người dùng và thiết lập cấu hình hệ thống chung.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Sử dụng cơ sở dữ liệu PostgreSQL. Cần bổ sung bảng người dùng và cập nhật cấu trúc bảng thiết bị.

### 2.1 Bảng tài khoản người dùng (`users`)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Băm bằng bcrypt/argon2
    role VARCHAR(20) DEFAULT 'user' NOT NULL, -- 'user', 'admin'
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### 2.2 Cập nhật bảng cấu hình thiết bị (`devices`)
Bổ sung trường liên kết quyền sở hữu tài khoản:
```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hardware_uuid VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Liên kết người tạo thiết bị
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
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'maintenance', 'sleeping'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### 2.3 Bảng nhật ký kiểm toán (`audit_logs`)
Lưu trữ mọi thao tác điều khiển nguy hiểm để phục vụ truy vết sự cố.
```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Tài khoản thực hiện
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE, -- Thiết bị chịu tác động
    action_type VARCHAR(50) NOT NULL, -- 'DOCKER_RESTART', 'SQL_EXECUTE', 'REDIS_FLUSH', 'REBOOT'
    target_name VARCHAR(100) NOT NULL, -- Tên container, tên bảng hoặc tên dịch vụ bị tác động
    ip_address VARCHAR(45) NOT NULL, -- IP của người dùng thực hiện thao tác trên Frontend
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 3. CƠ CHẾ KẾT NỐI VÀ THỰC THI DỊCH VỤ CỤC BỘ (AGENT-LOCAL PROXY)

Để đảm bảo an toàn tối đa cho hệ thống của cộng đồng, Server trung tâm **không bao giờ kết nối trực tiếp** đến cổng dịch vụ của thiết bị. Mọi thao tác được Agent thực thi cục bộ tại máy đích:

### 3.1 Quản trị Docker (Docker Management Engine)
- Agent kết nối cục bộ thông qua Unix Socket `/var/run/docker.sock` (Linux/macOS) hoặc Named Pipe `\\.\pipe\docker_engine` (Windows) sử dụng Docker SDK chính thức.
- **Lệnh hỗ trợ**:
  - `GET_CONTAINERS`: Lấy danh sách container, trạng thái, và tài nguyên CPU/RAM tiêu thụ.
  - `CONTAINER_OP`: Thực hiện `start`, `stop`, `restart`, `remove` container.
  - `GET_CONTAINER_LOGS`: Đọc 200 dòng nhật ký chạy gần nhất của container.

### 3.2 Quản trị SQL Database (SQL Engine)
- Agent kết nối cục bộ tới máy chủ SQL (PostgreSQL, MySQL, SQLite) thông qua địa chỉ loopback `127.0.0.1` sử dụng thông tin đăng nhập được mã hóa cấu hình cục bộ tại file `config.yaml` của Agent.
- **Lệnh hỗ trợ**:
  - `SQL_INFO`: Lấy danh sách bảng, kích thước đĩa của từng bảng và số lượng kết nối đang hoạt động.
  - `SQL_QUERY`: Thực thi câu lệnh truy vấn dữ liệu (`SELECT`). Giới hạn tối đa 100 dòng kết quả trả về để chống tràn bộ nhớ.
  - `SQL_EXEC`: Thực thi câu lệnh thay đổi dữ liệu (`INSERT`, `UPDATE`, `DELETE`, `CREATE`). **Bắt buộc yêu cầu xác thực OTP/Mật khẩu người dùng tại Frontend trước khi gửi lệnh xuống Agent.**

### 3.3 Quản trị Redis Cache (Redis Engine)
- Agent kết nối tới Redis nội bộ thông qua cổng `127.0.0.1:6379`.
- **Lệnh hỗ trợ**:
  - `REDIS_INFO`: Lấy dung lượng RAM đang chiếm dụng, số lượng key hiện tại.
  - `REDIS_FLUSH`: Thực hiện dọn sạch bộ nhớ cache (`FLUSHDB` hoặc `FLUSHALL`). **Bắt buộc xác thực OTP/Mật khẩu người dùng tại Frontend trước khi gửi.**

---

## 4. GIAO DIỆN ĐIỀU KHIỂN APPLE LIQUID GLASS (UI SPECIFICATIONS)

Bố cục giao diện Frontend (`/`) tuân thủ nghiêm ngặt Design System mờ ảo của Apple:
* **Hộp thoại xác thực kép (MFA Glass Modal)**: Khi thực hiện thao tác nguy hiểm, một hộp thoại có hiệu ứng kính siêu mờ `backdrop-filter: blur(32px) contrast(1.1)` sẽ hiện lên đè toàn màn hình, yêu cầu nhập mật khẩu để ký gói tin lệnh trước khi gửi.
* **Thẻ quản trị dịch vụ (Service Grid)**: Mỗi dịch vụ hiển thị thành một khối kính có quầng sáng spotlight tương ứng theo màu chủ đạo (Docker: Xanh dương; SQL: Xanh ngọc; Redis: Đỏ; Systemd: Tím).
* **Bảng kết quả SQL (SQL Result Grid)**: Thiết kế dạng bảng tối mờ, các hàng có hiệu ứng kính phản chiếu khi rê chuột qua, tiêu đề bảng in hoa bằng phông chữ Oswald đĩnh đạc.
