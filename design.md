# THIẾT KẾ HỆ THỐNG CỔNG DỊCH VỤ LIT-SOFTWARE (DESIGN.md)

Tài liệu này đặc tả kiến trúc tổng quan và chi tiết thiết kế giao diện Apple Liquid Glass cho cổng dịch vụ tích hợp LIT-SOFTWARE, vận hành tại tên miền `litsoftware.io.vn`.

---

## 1. ĐỊNH HƯỚNG THIẾT KẾ (DESIGN READ)

* **Loại trang**: Cổng tích hợp các hệ thống tiện ích nội bộ (Utility Portal) phục vụ cá nhân và công việc.
* **Đối tượng sử dụng**: Quản trị viên hệ thống (anh LIT).
* **Ngôn ngữ thiết kế**: Giao diện tối sang trọng kiểu Apple (Apple Dark Mode Premium), tập trung vào chất liệu kính chất lỏng (Liquid Glass) và chuyển động vật lý.
* **Cấu hình chỉ số giao diện (The Three Dials)**:
  - `DESIGN_VARIANCE: 7` (Bố cục bất đối xứng nhẹ, tập trung vào trải nghiệm mượt mà).
  - `MOTION_INTENSITY: 8` (Chuyển động có cường độ cao, sử dụng hoạt ảnh spring physics và bộ lọc biến dạng chất lỏng).
  - `VISUAL_DENSITY: 4` (Mật độ hiển thị thoáng đãng, các khối chức năng có khoảng cách rộng để chất liệu kính "thở").

---

## 2. PHÂN TÍCH CHI TIẾT GIAO DIỆN APPLE LIQUID GLASS

Để tái hiện chất liệu kính mờ cao cấp của Apple trên môi trường web và tạo cảm giác như có nước chuyển động bên trong gây biến dạng hình ảnh phía sau khi chuyển đổi trạng thái, giao diện được cấu thành từ 4 lớp kỹ thuật sau:

### 2.1 Cấu trúc khung viền và bề mặt (Frame & Surface)
Bề mặt kính không phải là một màu xám mờ đơn thuần, mà là sự xếp chồng của các lớp phản xạ ánh sáng:
- **Lớp nền (Background)**: Sử dụng các mảng màu tối ấm (`#09090b` hoặc `#121214`) kết hợp lưới mịn mờ (dot grid) màu tím neon với opacity cực thấp (0.03) để làm nổi bật lớp kính phía trên.
- **Lớp khúc xạ (Backdrop Filter)**: Sử dụng tổ hợp lọc `backdrop-filter: blur(24px) saturate(180%) contrast(1.05)`. Lớp này giúp làm mờ và tăng độ bão hòa màu sắc của các vật thể nằm phía sau tấm kính.
- **Lớp màu bề mặt (Fill)**: Hỗn hợp gradient tuyến tính từ trắng đục sang trong suốt ở góc 135 độ với độ mờ rất cao để giả lập ánh sáng phản chiếu trên bề mặt:
  `background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))`
- **Khung viền đa lớp (Layered Borders)**: Viền của khung kính sử dụng đường viền siêu mảnh `1px` với màu trắng trong suốt `rgba(255, 255, 255, 0.12)`. Phía trong viền có một lớp đổ bóng ngược (inset shadow) màu trắng `rgba(255, 255, 255, 0.2)` ở cạnh trên để tạo hiệu ứng vát cạnh vật lý phản chiếu ánh sáng mặt trời.

### 2.2 Nút bấm khúc xạ chất lỏng (Liquid Buttons)
- **Trạng thái tĩnh**: Nút bấm hòa vào bề mặt kính chung nhưng có độ mờ viền cao hơn một chút để phân biệt vùng tương tác.
- **Trạng thái rê chuột (Hover)**: Kích hoạt hiệu ứng thấu kính hội tụ. Sử dụng một quầng sáng tím mờ di chuyển bám đuổi theo tọa độ của con trỏ chuột phía dưới lớp kính bề mặt (Spotlight effect).
- **Trạng thái nhấn (Active)**: Co giãn vật lý theo tỷ lệ `scale(0.97)` bằng thuật toán Spring Physics (độ cứng `stiffness: 120`, độ cản `damping: 14`) để tạo cảm giác đàn hồi chân thực như phím cơ vật lý.

### 2.3 Hiệu ứng biến dạng nước khi chuyển đổi (Liquid Transition Distortion)
Để tạo hiệu ứng như có nước bên trong tấm kính làm biến dạng hình ảnh phía sau khi chuyển trang hoặc hover mạnh, chúng ta không dùng các hoạt ảnh tuyến tính thông thường mà áp dụng bộ lọc nhiễu sóng SVG (SVG Turbulence Filter) kết hợp CSS Displacement Map:
- **Nguyên lý hoạt động**: Định nghĩa một thẻ `<svg>` ẩn chứa bộ lọc nhiễu động tần số thấp:
  ```xml
  <filter id="liquid-distortion">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" result="displacement" />
  </filter>
  ```
- **Kích hoạt chuyển động**: Khi người dùng click chuyển trang hoặc tương tác, giá trị `scale` của `feDisplacementMap` sẽ được đẩy từ `0` lên `30` (tạo độ méo vặn lớn như nước sóng sánh) bằng thư viện Motion, sau đó trả dần về `0` theo đồ thị spring physics để giao diện ổn định trở lại tại trang mới.

### 2.4 Cơ chế chuyển đổi màu sắc chủ đạo (Dynamic Accent Color Theme)
Để cá nhân hóa trải nghiệm sử dụng các hệ thống riêng biệt một cách trực quan, cổng dịch vụ cung cấp bộ cấu hình đổi màu nhấn linh hoạt (Accent Color Picker):
- **Cấu trúc bảng màu (Color Palette Options)**: Thiết lập danh sách các mã màu nhấn neon có độ tương phản cao, hiển thị hoàn hảo trên nền tối:
  - Tím Neon (Default - Orchid): `rgba(168, 85, 247, 1)` / `--color-accent: #a855f7`
  - Cam Đất (9Router - Clay): `rgba(229, 106, 74, 1)` / `--color-accent: #e56a4a`
  - Xanh Ngọc (Emerald): `rgba(16, 185, 129, 1)` / `--color-accent: #10b981`
  - Xanh Dương Điện (Electric Blue): `rgba(59, 130, 246, 1)` / `--color-accent: #3bf6`
- **Phương thức lưu trữ trạng thái**: Lựa chọn màu nhấn của người dùng được lưu trữ trực tiếp trong `localStorage` dưới khóa `lit-portal-accent` và được đồng bộ thông qua CSS Variable (`--color-accent`). Khi tải trang, một script inline nhỏ ở thẻ `<head>` sẽ đọc giá trị này và ghi trực tiếp thuộc tính CSS variable lên thẻ `<html>` để tránh hiện tượng nháy màu (color flickering).
- **Phản chiếu màu nhấn lên chất liệu kính**: Màu nhấn được cấu hình làm nguồn sáng của hiệu ứng spotlight dưới lớp kính:
  `background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(var(--color-accent-rgb), 0.15) 0%, transparent 80%)`
  Điều này giúp toàn bộ các phần tử tương tác (nút bấm, quầng sáng, đường viền thấu kính) tự động đổi màu mượt mà theo màu nhấn đã chọn.

---

## 3. KIẾN TRÚC HỆ THỐNG VÀ PHÂN LUỒNG CÔNG NGHỆ

Hệ thống LIT-SOFTWARE hoạt động như một cổng điều phối trung tâm (Portal Gateway), kết nối đến các dịch vụ con chạy độc lập:

```
[ Trình duyệt Người dùng ]
          │
          ▼ (HTTPS)
[ Nginx Reverse Proxy ] (litsoftware.io.vn)
          │
          ├─► / (Frontend Cổng chính - Next.js Static Export)
          │
          ├─► /quota (Phân hệ Quản lý Quota AI - Next.js & Golang)
          │
          ├─► /api/v1/tools (Các công cụ tự động hóa chạy Python)
          │
          └─► /api/v1/manager (Dịch vụ quản trị hệ thống chạy NestJS)
```

### 3.1 Phân hệ Frontend chính (`/`)
- **Công nghệ**: Next.js, React, Tailwind v4, Motion (hoạt ảnh và thấu kính).
- **Nhiệm vụ**: Hiển thị bảng chọn hệ thống, quản lý cấu hình giao diện đồng nhất và xử lý các chuyển cảnh Liquid Glass.

### 3.2 Phân hệ Quản lý Quota AI (`/quota`)
- **Backend**: Golang (tối ưu hóa tốc độ xử lý dữ liệu gateway và hạn ngạch token).
- **Màu sắc**: Giữ màu xám ấm `#1a1a1a` đồng bộ với 9Router để tạo sự chuyên nghiệp cho phân hệ quản trị.

### 3.3 Phân hệ Quản lý tác vụ ngầm
- **Backend**: NestJS (Node.js) hoặc kịch bản Python độc lập chạy qua PM2.
- **Nhiệm vụ**: Thực hiện các cron job tự động, đồng bộ dữ liệu và vận hành hệ thống.

---

## 4. QUY TRÌNH KIỂM THỬ XÁC THỰC HIỆU ỨNG (TESTING WORKFLOW)

Do hiệu ứng khúc xạ chất lỏng và biến dạng nước (Liquid Distortion) sử dụng tài nguyên GPU để tính toán bộ lọc SVG, quy trình kiểm thử bắt buộc phải thực hiện các bước sau:
1. **Kiểm tra FPS thực tế**: Sử dụng công cụ giám sát hiệu năng trình duyệt để đảm bảo tốc độ khung hình đạt tối thiểu 60 FPS khi hiệu ứng biến dạng nước hoạt động trên cả trình duyệt máy tính và di động.
2. **Kiểm tra rò rỉ bộ nhớ (Memory Leak)**: Các bộ lọc SVG hoạt hình phải được tắt hoàn toàn (hủy kích hoạt và đưa scale về 0) ngay khi quá trình chuyển cảnh kết thúc, tránh việc GPU liên tục render ngầm gây nóng máy.
3. **Chụp ảnh màn hình đối chiếu**: Chụp ảnh màn hình giao diện ở các mức scale biến dạng khác nhau bằng `browser_vision` để đảm bảo văn bản không bị vỡ hạt (pixelated) hoặc lỗi hiển thị phông chữ tiếng Việt khi bị méo hình.
