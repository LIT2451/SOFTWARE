# TIÊU CHUẨN KỸ THUẬT VÀ QUY TRÌNH PHÁT TRIỂN PHẦN MỀM (SOFTWARE RULES)

Tài liệu này quy định các quy trình bắt buộc, tiêu chuẩn thiết kế kiến trúc, an toàn thông tin và phương pháp kiểm thử dành cho toàn bộ các dự án con nằm trong thư mục `/root/SOFTWARE/`. Tất cả các tác nhân lập trình AI (Agent) và lập trình viên phải tuân thủ nghiêm ngặt để đảm bảo chất lượng phần mềm tốt nhất.

---

## CHƯƠNG 1: QUY TRÌNH PHÁT TRIỂN PHẦN MỀM 5 PHA (5-PHASE SDLC)

Mọi tác vụ phát triển tính năng hoặc sửa đổi hệ thống phải trải qua tuần tự 5 pha sau. Không được phép nhảy pha hoặc bỏ qua bất kỳ bước kiểm tra nào.

### PHA 1: KHẢO SÁT, ĐẶC TẢ VÀ THIẾT KẾ KIẾN TRÚC
Trước khi viết bất kỳ dòng mã nguồn nào, Agent phải thu thập thông tin và lập tài liệu thiết kế:
1. **Khảo sát yêu cầu**: Thực hiện quy trình phỏng vấn người dùng bằng các câu hỏi nghiệp vụ cụ thể.
2. **Xây dựng tài liệu thiết kế sơ bộ**: Tạo tệp tin `DESIGN.md` trong thư mục dự án con, mô tả:
   - Sơ đồ cơ sở dữ liệu (Database Schema) nếu có thay đổi.
   - Đặc tả các API mới (đường dẫn, phương thức, cấu hình tham số đầu vào và cấu trúc JSON đầu ra).
   - Biểu đồ tuần tự (Sequence Diagram) mô tả luồng đi của dữ liệu giữa Frontend, Backend và Cơ sở dữ liệu.
3. **Phê duyệt kiến trúc**: Trình bày thiết kế cho người dùng và chỉ chuyển sang pha tiếp theo sau khi nhận được sự đồng ý.

### PHA 2: LẬP KỊCH BẢN KIỂM THỬ VÀ KẾ HOẠCH THỰC THI
1. **Thiết lập ca kiểm thử (Unit Test Cases)**:
   - Xác định rõ các đầu vào kiểm thử bao gồm: Dữ liệu hợp lệ, dữ liệu không hợp lệ, dữ liệu trống (Null/Empty) và dữ liệu vượt ngưỡng (Edge Cases).
   - Viết trước các tệp tin mã nguồn kiểm thử (ví dụ: các hàm `_test.go` trong Go hoặc tệp test trong Jest/Pytest) chứa các kịch bản kiểm thử này.
2. **Lập lộ trình thực thi**: Liệt kê danh sách các tệp tin sẽ tạo mới hoặc chỉnh sửa theo thứ tự độc lập trước, phụ thuộc sau.

### PHA 3: PHÁT TRIỂN CUỘN CHIẾU VÀ KIỂM THỬ CỤC BỘ
1. **Lập trình cuộn chiếu**:
   - Chỉ chỉnh sửa tối đa 1 đến 2 tệp tin trong một lượt.
   - Sử dụng công cụ `patch` để thực hiện các thay đổi nhỏ. Không ghi đè toàn bộ tệp tin trừ khi tạo mới.
2. **Chạy thử nghiệm ngay lập tức**:
   - Sau khi hoàn thành một hàm hoặc cấu trúc dữ liệu, phải thực hiện chạy các ca kiểm thử cục bộ đã viết ở Pha 2.
   - Sửa đổi mã nguồn cho đến khi tất cả các ca kiểm thử cục bộ đều vượt qua (Pass).

### PHA 4: KIỂM THỰC TÍCH HỢP VÀ XÁC THỰC TOÀN DIỆN
1. **Kiểm thử biên dịch và tích hợp**:
   - Chạy lệnh build toàn bộ dự án để đảm bảo không phát sinh lỗi liên kết hoặc lỗi kiểu dữ liệu.
   - Chạy toàn bộ bộ kiểm thử tích hợp (Integration Tests) của hệ thống.
2. **Xác thực API thực tế**:
   - Khởi động lại dịch vụ Backend và sử dụng các công cụ thực tế để gửi yêu cầu kiểm tra mã phản hồi HTTP và cấu trúc dữ liệu trả về.
3. **Xác thực giao diện thực tế**:
   - Sử dụng trình duyệt nội bộ để điều hướng qua các trang giao diện vừa thay đổi.
   - Chụp ảnh màn hình thực tế và thực hiện phân tích trực quan để phát hiện các lỗi bố cục, tràn viền hoặc lỗi tương phản màu sắc.

### PHA 5: BÀN GIAO VÀ DỌN DẸP
1. **Dọn dẹp mã nguồn**:
   - Xóa bỏ tất cả các tệp tin tạm, các đoạn mã nguồn chú thích dư thừa (commented-out code) và các dòng ghi nhật ký (log) dùng để debug tạm thời.
2. **Cập nhật tài liệu**:
   - Cập nhật hướng dẫn vận hành, cài đặt cấu hình mới vào tệp `README.md` của dự án con.
3. **Báo cáo và cam kết Git**:
   - Tạo commit với thông điệp rõ ràng, đúng chuẩn conventional commits.
   - Đẩy mã nguồn lên kho lưu trữ từ xa (GitHub).

---

## CHƯƠNG 2: TIÊU CHUẨN THIẾT KẾ CƠ SỞ DỮ LIỆU

### 2.1 Cấu trúc bảng và ràng buộc dữ liệu
- **Khóa chính**: Tất cả các bảng phải có khóa chính là `id` sử dụng kiểu dữ liệu UUID hoặc số nguyên tự tăng lớn (BigInt).
- **Ràng buộc toàn vẹn**: Phải định nghĩa rõ ràng các khóa ngoại (Foreign Keys) kèm theo hành động tương ứng (`ON DELETE RESTRICT` hoặc `ON DELETE CASCADE`).
- **Chỉ mục (Indexes)**: Tạo chỉ mục cho các cột thường xuyên xuất hiện trong mệnh đề `WHERE`, `JOIN` hoặc `ORDER BY`. Tránh tạo quá nhiều chỉ mục trên các bảng có tần suất ghi cao.
- **Trường thông tin bắt buộc**: Mọi bảng phải chứa các trường thông tin kiểm toán sau:
  - `created_at` (thời gian tạo, không được null).
  - `updated_at` (thời gian cập nhật mới nhất, không được null).
  - `deleted_at` (hỗ trợ xóa mềm nếu nghiệp vụ yêu cầu).

### 2.2 Quản lý thay đổi cấu trúc (Migrations)
- Tuyệt đối không được chạy các lệnh SQL trực tiếp trên cơ sở dữ liệu production để thay đổi cấu trúc bảng.
- Mọi thay đổi phải được thực hiện thông qua các tệp tin Migration có số thứ tự phiên bản tăng dần theo thời gian (ví dụ: `0001_create_users.sql`, `0002_add_email_to_users.sql`).
- Mỗi tệp tin Migration phải chứa cả hai phần: Luồng cập nhật (`Up`) và luồng khôi phục (`Down`).

---

## CHƯƠNG 3: TIÊU CHUẨN THIẾT KẾ API VÀ AN TOÀN THÔNG TIN

### 3.1 Thiết kế API RESTful
- **Phương thức HTTP**: Sử dụng đúng ý nghĩa của các phương thức:
  - `GET`: Truy xuất dữ liệu (không làm thay đổi trạng thái hệ thống).
  - `POST`: Tạo mới dữ liệu.
  - `PUT`: Cập nhật toàn bộ tài nguyên.
  - `PATCH`: Cập nhật một phần tài nguyên.
  - `DELETE`: Xóa tài nguyên.
- **Định dạng phản hồi lỗi thống nhất**: Khi xảy ra lỗi, API phải trả về mã trạng thái HTTP thích hợp (4xx hoặc 5xx) kèm theo cấu trúc JSON lỗi chuẩn:
  ```json
  {
    "error": {
      "code": "MÃ_LỖI_HỆ_THỐNG",
      "message": "Thông điệp lỗi chi tiết bằng tiếng Việt cho người dùng",
      "details": "Mô tả chi tiết kỹ thuật dành cho lập trình viên (chỉ hiển thị ở môi trường phát triển)"
    }
  }
  ```

### 3.2 An toàn thông tin và Quản lý thông tin nhạy cảm (Secrets Management)
- **Xác thực dữ liệu đầu vào (Input Validation)**: Tất cả dữ liệu gửi lên từ người dùng phải được lọc và xác thực kiểu dữ liệu, độ dài, định dạng trước khi xử lý. Sử dụng các thư viện validation chuẩn để tránh lỗi SQL Injection và Cross-Site Scripting (XSS).
- **Lưu trữ mật khẩu**: Mật khẩu của người dùng phải được băm (hash) bằng các thuật toán an toàn như bcrypt hoặc argon2 trước khi lưu vào cơ sở dữ liệu. Không bao giờ lưu mật khẩu dưới dạng văn bản rõ.
- **Quản lý phiên đăng nhập (Session/Token)**:
  - Nếu sử dụng JWT: Token phải có thời gian hết hạn ngắn (dưới 15 phút) và sử dụng Refresh Token được lưu trữ an toàn trong HttpOnly Cookie để tránh bị đánh cắp qua mã JavaScript.
  - Không bao giờ hiển thị thông tin nhạy cảm của người dùng (như mật khẩu đã băm, khóa bí mật) trong các phản hồi API.
- **Quản lý thông tin nhạy cảm (Secrets Management)**:
  - Tuyệt đối không được ghi cứng (hardcode) mật khẩu, khóa bí mật (Secret Keys), JWT Keys, hoặc API Keys của các dịch vụ liên kết vào trong mã nguồn.
  - Mọi thông tin nhạy cảm phải được khai báo trong tệp tin môi trường cục bộ `.env` (hoặc `config.yaml`) và được gọi thông qua biến môi trường của hệ thống.
  - Tạo tệp tin `.env.example` chứa danh sách các khóa trống để làm mẫu cấu hình.
  - Tất cả các tệp chứa thông tin cấu hình thực tế hoặc khóa bí mật (ví dụ: `.env`, các tệp `.pem`, `.key`, `id_rsa`) phải được thêm vào tệp `.gitignore` trước khi thực hiện commit đầu tiên lên Git.

---

## CHƯƠNG 4: TIÊU CHUẨN FRONTEND VÀ TRẢI NGHIỆM NGƯỜI DÙNG

### 4.1 Quản lý trạng thái giao diện (UI States)
Giao diện không được phép ở trạng thái đơ hoặc trống rỗng khi đang xử lý dữ liệu. Bắt buộc phải thiết kế đầy đủ các trạng thái sau cho mọi thành phần giao diện gọi API:
- **Trạng thái tải dữ liệu (Loading State)**: Hiển thị bộ xương khung (Skeleton loader) tương ứng với bố cục dữ liệu thực tế, hoặc hiển thị thanh tiến trình rõ ràng.
- **Trạng thái dữ liệu trống (Empty State)**: Khi không có dữ liệu trả về, hiển thị thông điệp rõ ràng hướng dẫn người dùng cách tạo dữ liệu mới.
- **Trạng thái lỗi (Error State)**: Khi API gặp sự cố, hiển thị thông báo lỗi thân thiện kèm theo nút thử lại (Retry).

### 4.2 Hiệu năng và Đồng bộ giao diện
- **Tránh Render dư thừa**: Sử dụng các phương pháp tối ưu hóa render của React (như `useMemo`, `useCallback`, chia nhỏ component) để tránh việc giao diện bị giật lag trên thiết bị di động.
- **Kiểm soát góc bo và màu sắc**: Tuân thủ chính xác hệ thống thiết kế (Design System) của dự án. Không sử dụng các giá trị bo góc hoặc mã màu ngẫu nhiên không nằm trong tệp cấu hình CSS toàn cục.

---

## CHƯƠNG 5: XỬ LÝ CÁC TÌNH HUỐNG BIÊN CỰC HẠN (EDGE CASES & FAILURE MODES)

Lập trình viên AI phải chủ động viết mã nguồn để xử lý các tình huống lỗi hệ thống sau:

### 5.1 Lỗi mạng và Timeout
- Mọi yêu cầu gọi API từ Frontend hoặc kết nối dịch vụ bên ngoài từ Backend phải có cấu hình thời gian chờ tối đa (Timeout). Không để tiến trình rơi vào trạng thái chờ vô hạn.
- Thiết lập cơ chế tự động thử lại (Retry) với khoảng thời gian tăng dần (Exponential Backoff) đối với các yêu cầu gọi dịch vụ bên thứ ba quan trọng.

### 5.2 Tranh chấp dữ liệu và Khóa chết (Concurrency & Deadlocks)
- **Tranh chấp dữ liệu**: Khi có nhiều tiến trình cùng ghi vào một bản ghi cơ sở dữ liệu, phải sử dụng cơ chế khóa thích hợp (Optimistic Locking hoặc Pessimistic Locking) để tránh mất mát dữ liệu.
- **Khóa chết (Deadlocks)**: Khi truy vấn nhiều bảng trong một giao dịch (Transaction), phải luôn truy cập các bảng theo một thứ tự nhất định trên toàn bộ hệ thống để ngăn ngừa lỗi khóa chết.

### 5.3 Tràn bộ nhớ và Quá tải dữ liệu
- **Truy vấn cơ sở dữ liệu lớn**: Cấm sử dụng các truy vấn lấy toàn bộ dữ liệu của bảng mà không có giới hạn (`LIMIT` và `OFFSET`). Bắt buộc phải áp dụng phân trang ở mức cơ sở dữ liệu.
- **Xử lý tệp tin lớn**: Khi xử lý tải lên hoặc ghi tệp tin lớn, phải sử dụng cơ chế luồng dữ liệu (Stream) thay vì đọc toàn bộ tệp tin vào bộ nhớ đệm RAM để tránh gây tràn bộ nhớ hệ thống.

---

## CHƯƠNG 6: QUẢN LÝ DỰ PHÒNG PHỤ THUỘC VÀ KIỂM TRA MÃ NGUỒN TĨNH

### 6.1 Quản lý môi trường ảo và dependencies khóa phiên bản
- **Đối với dự án Next.js / Node.js**:
  - Không cài đặt các gói thư viện ngẫu nhiên không có mục đích rõ ràng.
  - Khi cài đặt trên môi trường Production hoặc CI, bắt buộc sử dụng lệnh `npm ci` (hoặc `yarn install --frozen-lockfile`) để đảm bảo các gói thư viện được tải đúng với cấu trúc và phiên bản lưu giữ trong tệp `package-lock.json` hoặc `yarn.lock`.
- **Đối với dự án Golang**:
  - Sau khi thêm hoặc bớt thư viện, bắt buộc phải chạy `go mod tidy` để đồng bộ tệp tin mô tả dependencies `go.mod` và tệp khóa phiên bản `go.sum`.
- **Đối với dự án Python**:
  - Bắt buộc chạy ứng dụng trong môi trường ảo (venv hoặc uv).
  - Cập nhật danh sách thư viện và phiên bản chính xác vào tệp `requirements.txt` bằng công cụ quản lý gói tương ứng.

### 6.2 Công cụ kiểm tra mã nguồn tĩnh (Static Analysis & Linting)
- Agent và lập trình viên phải chạy các công cụ linter tương ứng của dự án trước khi tạo commit hoặc yêu cầu gộp mã nguồn (Pull Request):
  - **Next.js / TypeScript**: Chạy `npm run lint` (ESLint) và sửa toàn bộ lỗi liên quan đến kiểu dữ liệu (`any`), biến chưa sử dụng.
  - **Golang**: Chạy `golangci-lint run` (nếu dự án cấu hình) hoặc `go vet`.
- Mọi cảnh báo (warnings) hoặc lỗi về cấu trúc của linter phải được khắc phục triệt để. Tuyệt đối không được bỏ qua bằng cách sử dụng các thẻ tắt cảnh báo ép buộc (như `// eslint-disable-next-line` hay `//no-lint`) trừ trường hợp bất khả kháng và có giải thích kỹ thuật rõ ràng.

---

## CHƯƠNG 7: QUY TRÌNH TRIỂN KHAI VÀ KHÔI PHỤC (DEPLOYMENT & ROLLBACK)

### 7.1 Triển khai mã nguồn an toàn (Deployment)
- **Kiểm tra trước khi Deploy (Pre-flight Checks)**:
  - Dự án Frontend phải biên dịch thành công (`npm run build`).
  - Dự án Backend phải vượt qua toàn bộ các ca kiểm thử kiểm tra (`go test ./...` hoặc `pytest`).
  - Xác nhận các tệp tin cấu hình môi trường `.env` trên máy chủ đã khai báo đầy đủ các khóa mới cần thiết của bản phát hành mới.
- **Triển khai giảm thiểu thời gian chết (Zero-downtime Deployment)**:
  - Đối với dịch vụ chạy qua PM2, sử dụng lệnh `pm2 reload <tên_ứng_dụng>` thay vì `pm2 restart` để hệ thống tự động tải lại cấu hình và mã nguồn mới mà không làm đứt quãng các yêu cầu API đang xử lý của người dùng.
  - Đối với Frontend tĩnh (Static Export) phục vụ trực tiếp qua Nginx: Sau khi đẩy bản build mới vào thư mục đích, bắt buộc phải xóa cache của các dịch vụ CDN (nếu có) và kiểm tra lại thuộc tính HTTP header `Cache-Control: no-store, no-cache, must-revalidate` để trình duyệt người dùng không bị lưu trữ cache bản build cũ.

### 7.2 Quy trình khôi phục nhanh (Rollback)
Khi phiên bản mới triển khai trên production gặp sự cố nghiêm trọng (crash hệ thống, rò rỉ dữ liệu, lỗi logic nghiêm trọng không thể sửa ngay):
- **Bước 1**: Xác định nhanh phiên bản hoạt động ổn định gần nhất thông qua mã băm commit của Git (`git log`).
- **Bước 2**: Thực hiện khôi phục mã nguồn bằng lệnh:
  ```bash
  git checkout <commit_sha_gần_nhất_ổn_định>
  ```
- **Bước 3**: Tiến hành biên dịch lại và thực hiện `pm2 reload` hoặc nạp lại thư mục static của Nginx tương tự như quy trình triển khai ở phần 7.1.
- **Bước 4**: Kiểm tra trạng thái hoạt động của hệ thống qua nhật ký log để xác nhận hệ thống đã trở lại trạng thái an toàn trước khi bắt đầu tiến trình điều tra nguyên nhân sự cố của bản build lỗi.
