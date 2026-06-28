# TIÊU CHUẨN VÀ HƯỚNG DẪN KHOẢNG KHÔNG LÀM VIỆC (WORKSPACE-RULES.md)

Tài liệu này quy định cấu trúc tổ chức không gian làm việc (Workspace) để phân tách phân hệ Cổng chính Portal, phân hệ Giám sát Thiết bị và các dịch vụ con bên trong thư mục `/root/SOFTWARE/`.

---

## 1. CẤU TRÚC THƯ MỤC CHUẨN

Thư mục `/root/SOFTWARE/` được phân rã thành các khu vực độc lập, tránh sự chồng chéo mã nguồn và kiểm soát tài nguyên chặt chẽ:

```
/root/SOFTWARE/
├── RULES.md                     # Bộ quy tắc kỹ thuật chung và bảo mật toàn hệ thống
├── design.md                    # Thiết kế giao diện Apple Liquid Glass tổng quan của Portal
│
├── portal/                      # [WORKSPACE 1] Cổng giao diện chính của LIT-SOFTWARE
│   ├── design.md                # Đặc tả chi tiết các màn hình điều hướng của Portal
│   ├── package.json             # Khóa phiên bản Frontend Next.js
│   └── src/                     # Mã nguồn Frontend Portal
│
└── services/                    # [WORKSPACE 2] Chứa các dịch vụ con chạy độc lập
    ├── device-monitor/          # Dịch vụ Giám sát Thiết bị (Backend Server)
    │   ├── design.md            # Đặc tả cơ sở dữ liệu, API và luồng dữ liệu giám sát
    │   ├── go.mod               # Khóa phiên bản backend Go
    │   └── main.go              # Mã nguồn backend giám sát
    │
    └── agent/                   # Mã nguồn Agent cài đặt trên các thiết bị mục tiêu (Go)
        ├── go.mod               # Khóa phiên bản Agent Go
        └── main.go              # Mã nguồn Agent thu thập thông số phần cứng
```

---

## 2. QUY TẮC CÔ LẬP KHÔNG GIAN LÀM VIỆC (WORKSPACE ISOLATION)

Để tránh hiện tượng Agent bị trôi ngữ cảnh hoặc hao tốn token khi thực hiện các nhiệm vụ cụ thể:

1. **Khóa thư mục hoạt động**: Khi anh yêu cầu làm việc trên một phân hệ cụ thể (ví dụ: "chỉnh sửa nút bấm trên Portal"), Agent bắt buộc phải thiết lập thư mục làm việc (`workdir`) của các lệnh shell và công cụ tìm kiếm tại đúng thư mục phân hệ đó (`/root/SOFTWARE/portal/`), tuyệt đối không được đọc hoặc quét tìm kiếm các tệp tin thuộc thư mục `services/`.
2. **Quản lý Dependencies độc lập**:
   - Mỗi dự án con bên trong phải có tệp quản lý phiên bản riêng (`go.mod`, `package.json`, `requirements.txt`).
   - Cấm việc cài đặt thư viện chung ở thư mục gốc `/root/SOFTWARE/`. Tất cả các gói thư viện phải được cài đặt cục bộ bên trong thư mục của từng dự án con để đảm bảo tính cô lập và dễ dàng đóng gói (Dockerize) sau này.
3. **Quy trình chạy thử cục bộ**:
   - Mỗi Workspace phải tự cấu hình môi trường chạy thử cục bộ (ví dụ: chạy mock database hoặc cổng mạng nội bộ riêng) để phục vụ cho Pha 3 (Phát triển cuộn chiếu và kiểm thử cục bộ) mà không làm ảnh hưởng đến các phân hệ đang chạy thực tế trên tên miền `litsoftware.io.vn`.
