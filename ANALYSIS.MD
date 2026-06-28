# BẢN PHÂN TÍCH TỔNG QUAN CHỨC NĂNG HỆ THỐNG
**Dự án**: LIT SOFTWARE PORTAL
**Kiến trúc**: Next.js Portal (Static Export) - Agent-Local Proxy Go - Database PostgreSQL
**Tác giả**: Antigravity - Advanced Agentic Coding Team

---

## 1. Bản Đồ Kiến Trúc Hoạt Động (Architecture Map)
Hệ thống vận hành theo mô hình ba lớp tách biệt đảm bảo hiệu năng và tính bảo mật:

```
[ Frontend Portal ] <--- HTTPS / API (Bearer JWT) ---> [ Go Central Backend ]
  (Next.js Static)                                       (Port 28080)
                                                              ^
                                                              |
                                                     RSA Command / Heartbeat
                                                              |
                                                              v
                                                       [ Local Agent ]
                                                        (systemctl daemon)
```

- **Lớp Frontend**: Sử dụng Next.js build tĩnh (`out`), phục vụ trực tiếp qua Nginx để tối ưu RAM. Thiết kế bo góc dạng Apple (`border-radius: 16px`, `backdrop-filter: blur(24px)`) mang lại giao diện sang trọng.
- **Lớp Central Backend**: Viết bằng Golang (Gin Framework) quản trị database `software`, phát hành JWT Token (hạn 24 giờ) và quản lý khóa mật mã RSA Private Key dùng để ký số lệnh điều khiển trước khi đẩy xuống Agent.
- **Lớp Local Agent**: Viết bằng Golang chạy ngầm dạng daemon systemd trên các VPS cần giám sát. Thực hiện lấy dữ liệu hiệu năng phần cứng thực tế thông qua thư viện `gopsutil` gửi lên Central Backend qua các gói tin Heartbeat định kỳ. Đồng thời nhận lệnh điều khiển, sử dụng RSA Public Key để xác thực chữ ký trước khi thực thi các tác vụ nhạy cảm như Docker, SQL, Reboot, Uninstall.

---

## 2. Phân Tích Chức Năng Chi Tiết (Feature Analysis)

### 2.1. Phân hệ Xác thực & Phân quyền (Authentication & Authorization)
- **Cơ chế**: Sử dụng JSON Web Token (JWT) được lưu trữ phía client (`localStorage`). Hạn sinh tồn của token được nâng lên 24 giờ nhằm tránh ngắt kết nối phiên làm việc của quản trị viên giữa chừng.
- **Phân quyền**:
  - `Admin`: Có toàn quyền truy xuất thông tin của tất cả thiết bị trên hệ thống, thực thi mọi lệnh điều khiển trong tab **ĐIỀU KHIỂN** (Docker, SQL, Reboot, Redis Flush, Uninstall).
  - `User`: Chỉ được quyền xem cấu hình vật lý và hiệu năng các thiết bị thuộc quyền sở hữu của mình, bị giới hạn các lệnh điều khiển hệ thống nhạy cảm.

### 2.2. Phân hệ Giám sát Hiệu năng thời gian thực (Real-time Device Metrics)
- **Tần suất Heartbeat**: Agent gửi gói tin heartbeat báo cáo tài nguyên lên server mỗi 5 giây.
- **Tự động quét ngoại tuyến (Offline Scanner)**: Central Backend duy trì một goroutine chạy ngầm chu kỳ 10 giây quét bảng `devices`. Nếu thiết bị nào không cập nhật heartbeat mới quá 15 giây, trạng thái sẽ tự động đổi từ `online` sang `offline` ngay lập tức.
- **Chỉ số giám sát**:
  - CPU: Phần trăm tải trung bình thực tế.
  - RAM: Dung lượng đã sử dụng trên tổng dung lượng vật lý.
  - Disk: Tỷ lệ sử dụng phân vùng lưu trữ chính.
  - Network Flow: Tốc độ nhận dữ liệu (RX Delta) và truyền dữ liệu (TX Delta) tính theo byte/giây.

### 2.3. Phân hệ Hàng đợi Tác vụ & Thực thi lệnh bảo mật (Secure Task Queue)
- **Cơ chế Ký số RSA**: Để ngăn chặn kẻ xấu chiếm quyền điều khiển hoặc chèn ép API gửi lệnh độc hại xuống Agent:
  - Khi quản trị viên tạo lệnh (Docker, SQL, Reboot, Flush Redis, Uninstall), Central Backend dùng Private Key RSA 2048-bit ký số lên gói tin lệnh để tạo chữ ký số `signature`.
  - Agent kéo lệnh xuống thông qua API bảo mật. Agent dùng Public Key RSA 2048-bit để verify chữ ký này. Nếu chữ ký không trùng khớp hoặc bị chỉnh sửa cấu trúc, lệnh lập tức bị hủy bỏ và ghi log lỗi.
- **Các lệnh điều khiển hỗ trợ**:
  - `DOCKER_OP`: Thao tác Start, Stop, Restart, logs (giới hạn 200 dòng cuối và tự động che giấu thông tin nhạy cảm - Data Masking).
  - `SQL_QUERY`: Chỉ cho phép thực hiện lệnh truy vấn `SELECT` đọc thông tin, tự động từ chối các câu lệnh thay đổi cấu trúc hoặc chỉnh sửa dữ liệu (`INSERT`, `UPDATE`, `DELETE`, `DROP`).
  - `REDIS_FLUSH`: Thực hiện giải phóng bộ nhớ đệm nhanh thông qua lệnh `FLUSHDB` của Redis.
  - `REBOOT`: Ra lệnh khởi động lại hệ thống từ xa một cách an toàn.
  - `UNINSTALL`: Ra lệnh cho Agent tự thu dọn tệp thực thi, vô hiệu hóa service systemd và tự xóa chính mình khỏi hệ thống khi thiết bị ngắt kết nối vĩnh viễn.

---

## 3. Bản Đồ Kiểm Thử & Kiểm Soát Rủi Ro (Testing & Risk Control)

### 3.1. Các Lỗ Hổng Bảo Mật Đã Được Vá
1. **Docker Socket Hijacking**: Giới hạn cổng API Docker cục bộ và không mở cổng Docker ra ngoài Internet. Mọi giao dịch tương tác Docker đều được bao bọc thông qua kênh API cục bộ của Agent đã xác thực chữ ký RSA.
2. **SQL Injection**: Chặn đứng việc cho phép chạy các lệnh thô làm thay đổi cấu trúc bảng. Hệ thống phân tích chuỗi truy vấn SQL tại Agent và trả về mã lỗi nếu chứa các từ khóa ghi dữ liệu.
3. **Data Leaks**: logs Docker trước khi hiển thị lên giao diện được chạy qua bộ lọc regex để che giấu các thông tin kết nối nhạy cảm như DB Password, API Keys, Tokens.

### 3.2. Quy Trình Kiểm Thử Đã Thực Hiện
- **Kiểm thử API Backend**: Gọi các cổng đăng ký, đăng nhập và lấy cấu trúc JSON trả về hợp lệ.
- **Kiểm thử Đồng bộ Agent**: Kiểm tra file nhật ký hệ thống của Agent cho thấy quá trình gửi Heartbeat và verify chữ ký số RSA diễn ra liên tục, không lỗi CPU.
- **Kiểm thử Giao diện (Responsive & Theme)**: Đã giả lập môi trường duyệt mobile của trình duyệt, kiểm tra cấu trúc lưới co giãn tự động và đổi màu nhấn mượt mà.
