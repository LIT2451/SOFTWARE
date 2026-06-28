# ĐẶC TẢ THIẾT KẾ CHƯƠNG TRÌNH ĐIỀU PHỐI THIẾT BỊ (DESIGN.MD)

Tài liệu này đặc tả thiết kế kỹ thuật, cấu trúc thư mục, tệp cấu hình và quy trình thu thập thông số cho chương trình Agent chạy ngầm trên thiết bị mục tiêu (Windows, MacBook, Linux).

---

## 1. CÔNG NGHỆ VÀ THƯ VIỆN SỬ DỤNG (TECHNOLOGY STACK)

Chương trình Agent được viết bằng ngôn ngữ Golang để biên dịch trực tiếp ra tệp tin thực thi binary độc lập cho từng nền tảng mà không cần cài đặt thêm runtime:
- **Hệ điều hành hỗ trợ**: Windows (amd64/arm64), macOS (Intel/Apple Silicon), Linux (amd64/arm64).
- **Thư viện thu thập thông số phần cứng**: `github.com/shirou/gopsutil/v3` (thư viện chuẩn, hỗ trợ đa nền tảng tốt nhất để đọc CPU, RAM, Disk, Network).
- **Thư viện mã hóa và ký số**: Sử dụng gói chuẩn `crypto/rsa` và `crypto/sha256` của Golang.
- **Thư viện giao tiếp API**: `net/http` chuẩn của Golang để tối ưu dung lượng tệp tin build.

---

## 2. CẤU TRÚC TỆP CẤU HÌNH CỤC BỘ (CONFIG.YAML)

Mỗi Agent sau khi cài đặt sẽ có một tệp cấu hình `config.yaml` lưu trữ cục bộ tại thư mục cài đặt của thiết bị:

```yaml
server_url: "https://litsoftware.io.vn" # Địa chỉ máy chủ trung tâm
workspace_id: "uuid-cua-workspace-he-thong" # ID không gian làm việc
secret_key: "key-xac-thuc-duoc-cap-khi-enroll" # Khóa xác thực riêng biệt của thiết bị
heartbeat_interval: 5 # Tần suất gửi báo cáo (giây)
enable_docker: true # Bật/tắt giám sát Docker
enable_db: false # Bật/tắt giám sát SQL Database
enable_redis: false # Bật/tắt giám sát Redis
public_key_path: "./server_public.pem" # Đường dẫn lưu khóa công khai của Server để xác thực lệnh
```

---

## 3. CƠ CHẾ THU THẬP ĐỊNH DANH DUY NHẤT (UNIQUE HARDWARE IDENTIFIER)

Để chống trùng lặp thiết bị (Identity Collision), Agent sử dụng các phương thức đọc UUID phần cứng trực tiếp từ bo mạch chủ của từng hệ điều hành:
- **Windows**: Thực thi lệnh truy vấn WMI:
  `wmic csproduct get uuid`
- **Linux**: Đọc tệp tin định danh hệ thống duy nhất:
  `/sys/class/dmi/id/product_uuid` hoặc `/etc/machine-id`
- **macOS**: Chạy lệnh hệ thống đọc thuộc tính phần cứng:
  `ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID`

---

## 4. XỬ LÝ SỰ KIỆN TẮT MÁY/ĐI NGỦ (OS SHUTDOWN & SLEEP DETECTION)

Để ngăn chặn việc máy chủ Server phát cảnh báo mất kết nối sai khi người dùng chủ động tắt máy hoặc gập màn hình:
- **Windows**: Agent đăng ký lắng nghe sự kiện `WM_QUERYENDSESSION` và `WM_POWERBROADCAST` (sự kiện `PBT_APMSUSPEND` khi máy chuẩn bị đi vào chế độ ngủ).
- **Linux**: Đăng ký bắt tín hiệu `SIGTERM`, `SIGINT` từ Systemd daemon.
- **macOS**: Đăng ký lắng nghe sự kiện từ `IOPMconnection` của IOKit framework.
- **Hành động**: Khi nhận được tín hiệu này, Agent sẽ thực thi một yêu cầu HTTP gửi nhanh gói tin `POST /api/v1/agent/status` với nội dung `status=sleeping` (hoặc `status=offline` khi tắt máy chủ động) lên Server trung tâm trước khi tắt tiến trình hoàn toàn.

---

## 5. KỊCH BẢN KIỂM THỬ XÁC THỰC (TEST CASES)

### 5.1 Kiểm thử thu thập thông số (Unit Test Hardware Specs)
- Chạy thử hàm quét phần cứng trên cả 3 nền tảng thực tế.
- Kết quả mong muốn: Lấy chính xác tên chip xử lý, dung lượng RAM vật lý thực tế của máy, dung lượng của các phân vùng ổ đĩa và hiển thị đúng địa chỉ IP.

### 5.2 Kiểm thử khả năng chịu lỗi (Network Tolerance Test)
- Gặp sự cố mất kết nối internet (ngắt mạng giả lập trên máy chạy Agent).
- Kết quả mong muốn: Agent không được crash tiến trình. Phải lưu trữ tối đa 120 gói tin hiệu năng (tương đương 10 phút dữ liệu) vào bộ nhớ RAM tạm thời và tự động gửi bù (flush) về Server ngay khi kết nối mạng được khôi phục.
