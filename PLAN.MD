# KẾ HOẠCH TRIỂN KHAI CHI TIẾT (PLAN.MD)

Tài liệu này phân rã các nhiệm vụ phát triển dự án LIT-SOFTWARE thành các giai đoạn cụ thể để thực hiện lập trình và kiểm thử cuộn chiếu.

---

## GIAI ĐOẠN 1: THIẾT LẬP NỀN TẢNG VÀ XÁC THỰC (DATABASE & AUTH)

Mục tiêu: Hoàn thành cấu trúc lưu trữ và luồng đăng ký, đăng nhập tài khoản bảo mật.

- **Nhiệm vụ 1.1: Khởi tạo Cơ sở dữ liệu (PostgreSQL)**
  - Viết các tệp tin cấu hình cấu trúc bảng (Migration) cho các bảng `users`, `devices`, `device_metrics`, `audit_logs`.
  - Kiểm thử: Chạy lệnh chạy migration và xác minh cấu trúc bảng trong PostgreSQL.
- **Nhiệm vụ 1.2: Xây dựng Backend Server (Golang)**
  - Cấu hình cấu trúc thư mục dự án `/root/SOFTWARE/services/device-monitor/`.
  - Viết API đăng ký tài khoản (`POST /api/v1/auth/register`) và đăng nhập (`POST /api/v1/auth/login`) trả về JWT Token.
  - Kiểm thử: Viết test case kiểm tra tính hợp lệ của mật khẩu băm bcrypt và định dạng token.

---

## GIAI ĐOẠN 2: PHÁT TRIỂN AGENT VÀ THU THẬP THÔNG SỐ (AGENT & HEARTBEAT)

Mục tiêu: Agent hoạt động trên Windows, Linux, macOS và gửi thông số phần cứng về Server.

- **Nhiệm vụ 2.1: Lập trình Agent thu thập thông số (Golang)**
  - Cấu hình thư mục `/root/SOFTWARE/services/agent/`.
  - Viết code thu thập UUID phần cứng, Hostname, CPU Model, tổng dung lượng RAM, dung lượng ổ đĩa.
  - Kiểm thử: Chạy Agent cục bộ trên máy chủ Linux và xuất ra terminal thông số thu được.
- **Nhiệm vụ 2.2: Đồng bộ hóa gói tin định kỳ (Heartbeat)**
  - Viết API nhận báo cáo (`POST /api/v1/agent/report`) phía Server.
  - Viết logic gửi thông số định kỳ mỗi 5 giây phía Agent.
  - Kiểm thử: Kiểm tra dữ liệu được ghi vào bảng `devices` và `device_metrics`.
- **Nhiệm vụ 2.3: Quản lý trạng thái thiết bị (Online/Offline/Sleep)**
  - Viết dịch vụ chạy ngầm quét trạng thái trên Server (chuyển sang offline nếu quá 15 giây không nhận gói tin).
  - Viết logic bắt sự kiện tắt máy trên Agent để gửi trạng thái `sleeping` trước khi tắt.
  - Kiểm thử: Tắt đột ngột Agent để kiểm tra xem Server có tự chuyển sang offline sau 15 giây không.

---

## GIAI ĐOẠN 3: TÍNH NĂNG ĐIỀU KHIỂN VÀ QUẢN TRỊ DỊCH VỤ (COMMANDS ENGINE)

Mục tiêu: Thực hiện điều khiển thiết bị, quản trị Docker, SQL, Redis an toàn.

- **Nhiệm vụ 3.1: Hàng đợi lệnh điều khiển bảo mật**
  - Hiện thực hóa hàng đợi tác vụ trên Server và API lấy nhiệm vụ `/agent/tasks` của Agent.
  - Viết logic ký số RSA trên Server và xác thực chữ ký số trên Agent trước khi chạy lệnh.
  - Kiểm thử: Gửi lệnh giả lập không có chữ ký số để kiểm tra xem Agent có từ chối thực thi không.
- **Nhiệm vụ 3.2: Lập trình điều khiển dịch vụ cục bộ trên Agent**
  - Viết logic tương tác Docker Socket cục bộ (danh sách container, start, stop, lọc che thông tin nhạy cảm logs).
  - Viết logic truy vấn SQL nội bộ (giới hạn 100 dòng, Query Timeout 5 giây) và dọn cache Redis.
  - Viết logic khởi động lại hệ thống (`reboot`) và gỡ cài đặt sạch (`uninstall`).
  - Kiểm thử: Chạy thử các lệnh thông qua API của Agent và kiểm tra log chạy thực tế.

---

## GIAI ĐOẠN 4: GIAO DIỆN CỔNG PORTAL (FRONTEND PORTAL)

Mục tiêu: Xây dựng giao diện Apple Liquid Glass và tích hợp các phân hệ quản trị.

- **Nhiệm vụ 4.1: Khởi tạo giao diện Portal (Next.js)**
  - Thiết lập dự án Next.js tại thư mục `/root/SOFTWARE/portal/`.
  - Cấu hình CSS Variables và bộ màu nhấn linh hoạt (Tím, Cam, Xanh ngọc, Xanh dương) lưu vào LocalStorage.
  - Viết hiệu ứng kính mờ `backdrop-filter` và hiệu ứng biến dạng nước SVG.
- **Nhiệm vụ 4.2: Xây dựng các trang chức năng**
  - Trang Login: Khung kính tối giản, validation form.
  - Trang Dashboard: Danh sách thiết bị (người dùng thường chỉ thấy máy của mình, admin thấy toàn bộ máy).
  - Trang chi tiết thiết bị: Biểu đồ hiệu năng thời gian thực, bảng điều khiển Docker, trình soạn thảo câu lệnh SQL và dọn dẹp Redis.
  - Kiểm thử: Chụp ảnh màn hình giao diện bằng trình duyệt nội bộ để kiểm tra bố cục hiển thị.

---

## GIAI ĐOẠN 5: KIỂM THỬ TÍCH HỢP VÀ PHÁT HÀNH (STRESS TEST & DEPLOY)

Mục tiêu: Đảm bảo khả năng chịu tải và cấu hình tên miền hoạt động ổn định.

- **Nhiệm vụ 5.1: Kiểm thử tải hệ thống**
  - Chạy kịch bản stress test giả lập nhiều Agent gửi dữ liệu đồng thời.
- **Nhiệm vụ 5.2: Cấu hình Nginx và Triển khai thực tế**
  - Xuất bản Frontend Next.js tĩnh (Static Export).
  - Cấu hình Nginx Reverse Proxy điều hướng tên miền `litsoftware.io.vn`.
  - Thiết lập chạy PM2 reload không gián đoạn dịch vụ.
  - Kiểm thử: Truy cập tên miền từ bên ngoài và thực hiện toàn bộ luồng chức năng.
