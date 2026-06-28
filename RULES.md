# TIÊU CHUẨN LẬP TRÌNH CHUNG & BẢO VỆ CHẤT LƯỢNG MÃ NGUỒN (SOFTWARE RULES)

Tài liệu này quy định các nguyên tắc kỹ thuật chi tiết và quy trình bắt buộc để ngăn chặn hiện tượng mơ hồ, tự suy diễn hoặc bịa đặt thông tin trong suốt quá trình phát triển các dự án con thuộc thư mục `/root/SOFTWARE/`.

---

## 1. NGUYÊN TẮC CHỐNG BỊA ĐẶT THÔNG TIN (ANTI-HALLUCINATION)

Mô hình lập trình tuyệt đối không được tự ý giả lập hoặc suy đoán các yếu tố kỹ thuật sau:

### 1.1 Xác thực sự tồn tại của tài nguyên trước khi hành động
- **Tệp tin và thư mục**: Không được giả định một thư mục hoặc tệp tin cấu hình đã tồn tại. Bắt buộc phải chạy `search_files` hoặc kiểm tra thực tế trước khi thực hiện thao tác đọc/ghi.
- **Thư viện bên thứ ba**: Trước khi thêm lệnh `import` hoặc `require` một thư viện mới, bắt buộc phải kiểm tra `package.json` (Next.js/Node.js), `go.mod` (Go), hoặc `requirements.txt` (Python). Nếu chưa có, phải cài đặt thực tế trước, không được viết code dựa trên giả định thư viện đã có sẵn.
- **Biến môi trường**: Không được tự ý bịa ra các biến môi trường (`process.env.VAR`). Phải kiểm tra tệp cấu hình `.env` hoặc cấu hình hệ thống thực tế để lấy danh sách biến môi trường đang hoạt động.

### 1.2 Dữ liệu và Trạng thái hệ thống
- **Dữ liệu API/Database**: Không được giả lập cấu trúc bảng cơ sở dữ liệu hoặc cấu trúc phản hồi của API. Phải truy vấn cấu trúc bảng thực tế từ cơ sở dữ liệu hoặc gọi thử API để lấy cấu trúc JSON chuẩn trước khi viết mã nguồn xử lý dữ liệu.
- **Cổng mạng và Dịch vụ**: Không được tự ý giả định một cổng mạng (port) đang trống hoặc một dịch vụ đang chạy. Phải sử dụng công cụ kiểm tra cổng mạng thực tế trước khi cấu hình dịch vụ mới.

---

## 2. NGUYÊN TẮC BẢN ĐỒ HOÁ ĐỘ MƠ HỒ (AMBIGUITY CONTROL)

Để tránh việc sinh ra mã nguồn không đúng yêu cầu do hiểu sai ý tưởng:

### 2.1 Làm rõ yêu cầu kỹ thuật
- Khi nhận được yêu cầu từ người dùng, nếu thiếu một trong các thông tin sau, **bắt buộc phải đặt câu hỏi làm rõ**, tuyệt đối không tự ý chọn giá trị mặc định:
  - Kiểu dữ liệu của các trường thông tin quan trọng.
  - Luồng xử lý khi xảy ra lỗi (ví dụ: có cần rollback database không, hiển thị thông báo lỗi cụ thể ra sao).
  - Tác động mong muốn đến các phân hệ đang chạy song song.

### 2.2 Định vị thay đổi cụ thể
- Trước khi thực hiện thay đổi, phải liệt kê rõ ràng:
  - Tên tệp tin (đường dẫn tuyệt đối).
  - Các dòng mã nguồn cũ sẽ bị thay thế (old_string) và đoạn mã nguồn mới tương ứng (new_string).
  - Lý do kỹ thuật tại sao đoạn mã này giải quyết được vấn đề mà không gây ảnh hưởng chéo.

---

## 3. QUY TRÌNH XÁC THỰC THỰC TẾ (REAL-WORLD VALIDATION)

Mọi thay đổi mã nguồn chỉ được coi là hoàn thành khi đã qua kiểm thử thực tế. Nghiêm cấm việc báo cáo hoàn thành chỉ dựa trên suy luận lý thuyết.

### 3.1 Xác thực cú pháp và biên dịch
Ngay sau khi chỉnh sửa tệp tin, bắt buộc phải chạy các lệnh kiểm tra lỗi tương ứng với công nghệ của dự án con:
- **Frontend (Next.js/React)**: Chạy `npm run build` để kiểm tra lỗi biên dịch TypeScript/CSS.
- **Backend (Golang)**: Chạy `go build` hoặc `go vet` để kiểm tra lỗi cú pháp và kiểu dữ liệu.
- **Python**: Chạy `python3 -m py_compile <tên_file>`.

### 3.2 Xác thực hiển thị giao diện (Frontend)
- Không được suy đoán giao diện hiển thị đúng dựa trên mã CSS.
- Bắt buộc phải sử dụng `browser_navigate` để truy cập trang web thực tế trên môi trường chạy thử.
- Sử dụng `browser_vision` để chụp ảnh màn hình và phân tích trực quan: màu nền, bo góc, khoảng cách, font chữ, độ tương phản của chữ so với nền.

### 3.3 Xác thực dịch vụ (Backend/API)
- Sau khi chỉnh sửa logic API hoặc dịch vụ chạy ngầm, bắt buộc phải khởi động lại dịch vụ (ví dụ: qua PM2 hoặc Docker).
- Kiểm tra log chạy thực tế để đảm bảo dịch vụ không bị tắt đột ngột (crash).
- Gọi thử API bằng công cụ dòng lệnh thực tế để kiểm tra mã trạng thái phản hồi (HTTP Status Code) và cấu trúc JSON trả về.

---

## 4. RÀNG BUỘC HIỆU NĂNG CHO MÔ HÌNH FLASH

Mô hình Gemini Flash xử lý thông tin rất nhanh nhưng dễ bị trôi ngữ cảnh khi tệp tin quá dài. Do đó phải tuân thủ:

- **Giới hạn độ dài tệp tin**: Cố gắng giữ các tệp tin mã nguồn tự viết dưới 300 dòng. Nếu logic quá phức tạp, phải chủ động tách nhỏ thành các module/tệp tin helper riêng biệt.
- **Phạm vi chỉnh sửa hẹp**: Trong mỗi phiên làm việc, chỉ thực hiện sửa đổi tối đa trên 2 tệp tin có liên quan trực tiếp đến nhau. Không thực hiện các đợt sửa đổi hàng loạt phân tán trên toàn bộ dự án để tránh mất kiểm soát logic chéo.
- **Sử dụng lệnh `patch` làm chủ đạo**: Chỉ sử dụng `write_file` cho các tệp tin mới tạo. Đối với các tệp tin hiện có, bắt buộc sử dụng `patch` để thay đổi từng vùng nhỏ, giúp khoanh vùng lỗi chính xác.
