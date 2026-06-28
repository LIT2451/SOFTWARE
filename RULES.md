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

## 2. QUY TRÌNH THU THẬP THÔNG TIN VÀ KIỂM SOÁT ĐỘ MƠ HỒ (REQUIREMENTS ELICITATION)

Để tránh việc sinh ra mã nguồn thiếu tính năng, sai yêu cầu hoặc lập trình mơ hồ, Agent bắt buộc phải thực hiện quy trình khảo sát và thu thập thông tin đa chiều trước khi viết mã nguồn.

### 2.1 Bản đồ câu hỏi khảo sát tính năng (Feature Elicitation Map)
Khi người dùng yêu cầu thực hiện một tính năng (ví dụ: "Trang đăng nhập", "Bộ lọc sản phẩm"), Agent phải tự đối chiếu với danh sách kiểm tra tương ứng dưới đây để đặt câu hỏi thu thập thông tin:

- **Tính năng xác thực / Đăng nhập (Auth)**:
  - Phương thức đăng nhập: Chỉ dùng tài khoản mật khẩu thường hay có bên thứ ba (Google, GitHub)?
  - Bảo mật: Có cần chức năng "Ghi nhớ mật khẩu" (Remember Me), xác thực 2 lớp (2FA), hay mã xác thực captcha không?
  - Xử lý lỗi: Các trường hợp validation (email sai định dạng, mật khẩu quá ngắn) hiển thị ở đâu và như thế nào?
  - Cơ chế lưu trữ phiên: Sử dụng Cookie, LocalStorage hay SessionToken?
- **Tính năng danh sách / Bộ lọc (Filters & Lists)**:
  - Cơ chế phân trang: Phân trang truyền thống (Pagination), nút "Xem thêm" (Load More), hay cuộn vô tận (Infinite Scroll)?
  - Tiêu chí lọc: Tìm kiếm văn bản, khoảng giá, phân loại (category) hay trạng thái?
  - Lưu trạng thái: Có cần đồng bộ bộ lọc lên thanh địa chỉ URL (URL Search Params) để chia sẻ liên kết không?
- **Tính năng biểu mẫu / Dữ liệu (Forms & Submissions)**:
  - Validation: Ràng buộc dữ liệu ở phía client (ngay khi gõ) hay đợi nhấn nút submit gửi lên server mới báo lỗi?
  - Trạng thái gửi: Có cần cơ chế chống nhấn nút gửi nhiều lần (Double Submit Prevention) và hiển thị loader không?

### 2.2 Quy trình 3 câu hỏi bắt buộc (The 3-Question Protocol)
Khi nhận bất kỳ yêu cầu lập trình nào, Agent **không được viết mã nguồn ngay**, mà phải phản hồi bằng một bảng tóm tắt kèm theo đúng 3 câu hỏi kỹ thuật cụ thể gửi cho người dùng:
1. **Câu hỏi về Nghiệp vụ (Business Logic)**: Làm rõ các kịch bản sử dụng thực tế (ví dụ: đăng nhập thành công thì chuyển hướng về đâu, đăng nhập thất bại tối đa mấy lần thì khóa tài khoản).
2. **Câu hỏi về Giao diện & Trải nghiệm (UI/UX)**: Làm rõ các yếu tố hiển thị (ví dụ: có sử dụng thư viện UI nào có sẵn không, bố cục mong muốn là gì).
3. **Câu hỏi về Kỹ thuật & Tích hợp (Technical & Integration)**: Làm rõ các API đầu cuối sẽ giao tiếp hoặc cấu trúc dữ liệu cần trả về.

### 2.3 Định vị và ghi nhận thay đổi cụ thể
- Trước khi thực hiện thay đổi, phải liệt kê rõ ràng:
  - Tên tệp tin (đường dẫn tuyệt đối).
  - Các dòng mã nguồn cũ sẽ bị thay thế (old_string) và đoạn mã nguồn mới tương ứng (new_string).
  - Lý do kỹ thuật tại sao đoạn mã này giải quyết được vấn đề mà không gây ảnh hưởng chéo.

---

## 3. QUY TRÌNH KIỂM THỬ VÀ XÁC THỰC THỰC TẾ (TESTING & VALIDATION)

Mọi thay đổi mã nguồn phải đi kèm với quy trình kiểm thử tương ứng. Nguyên tắc cốt lõi: **Lập trình đến đâu, kiểm thử đến đó (Continuous Unit Testing & Verification).**

### 3.1 Quy trình phát triển hướng kiểm thử (TDD / Test-First Mentality)
- **Tác vụ tạo mới tính năng**: Phải xác định trước các kịch bản kiểm thử (Test Cases). Trước khi viết code logic xử lý, phải viết các hàm kiểm thử tương ứng (Unit Test) cho tính năng đó.
- **Tác vụ sửa lỗi (Bug Fix)**: Phải tạo ra một ca kiểm thử tái hiện lại lỗi trước khi viết code sửa lỗi. Đoạn code sửa lỗi chỉ được chấp nhận khi ca kiểm thử này chuyển sang trạng thái thành công (Pass).

### 3.2 Quy trình chạy thử nghiệm cục bộ ngay lập tức (Immediate Execution Loop)
- **Lập trình hàm nào, chạy thử hàm đó**: Sau khi viết xong một hàm hoặc module logic, cấm viết tiếp các phần khác nếu chưa thực hiện chạy thử độc lập hàm đó bằng một script nhỏ hoặc thông qua framework test của dự án.
- **Xác thực kết quả tức thì**: Kiểm tra kiểu dữ liệu đầu ra và tính chính xác của thuật toán bằng các giá trị đầu vào biên (Edge Cases), giá trị rỗng (Nil/Null/Empty) và dữ liệu không hợp lệ để đảm bảo hệ thống không bị lỗi crash.

### 3.3 Xác thực cú pháp và biên dịch
Ngay sau khi chỉnh sửa tệp tin, bắt buộc phải chạy các lệnh kiểm tra lỗi tương ứng với công nghệ của dự án con:
- **Frontend (Next.js/React)**: Chạy `npm run build` để kiểm tra lỗi biên dịch TypeScript/CSS.
- **Backend (Golang)**: Chạy `go test ./...` để chạy toàn bộ các ca kiểm thử, kèm theo lệnh `go build` hoặc `go vet` để kiểm tra lỗi cú pháp và kiểu dữ liệu.
- **Python**: Chạy bộ kiểm thử tự động của dự án (ví dụ: `pytest` hoặc `unittest`), kèm theo lệnh `python3 -m py_compile <tên_file>`.

### 3.4 Xác thực hiển thị giao diện (Frontend)
- Không được suy đoán giao diện hiển thị đúng dựa trên mã CSS.
- Bắt buộc phải sử dụng `browser_navigate` để truy cập trang web thực tế trên môi trường chạy thử.
- Sử dụng `browser_vision` để chụp ảnh màn hình và phân tích trực quan: màu nền, bo góc, khoảng cách, font chữ, độ tương phản của chữ so với nền.

### 3.5 Xác thực dịch vụ (Backend/API)
- Sau khi chỉnh sửa logic API hoặc dịch vụ chạy ngầm, bắt buộc phải khởi động lại dịch vụ (ví dụ: qua PM2 hoặc Docker).
- Kiểm tra log chạy thực tế để đảm bảo dịch vụ không bị tắt đột ngột (crash).
- Gọi thử API bằng công cụ dòng lệnh thực tế để kiểm tra mã trạng thái phản hồi (HTTP Status Code) và cấu trúc JSON trả về. Có thể viết kịch bản gọi thử tự động bằng Python thông qua `execute_code` để gửi hàng loạt yêu cầu kiểm tra hiệu năng hoặc tải lớn.

---

## 4. RÀNG BUỘC HIỆU NĂNG CHO MÔ HÌNH FLASH

Mô hình Gemini Flash xử lý thông tin rất nhanh nhưng dễ bị trôi ngữ cảnh khi tệp tin quá dài. Do đó phải tuân thủ:

- **Giới hạn độ dài tệp tin**: Cố gắng giữ các tệp tin mã nguồn tự viết dưới 300 dòng. Nếu logic quá phức tạp, phải chủ động tách nhỏ thành các module/tệp tin helper riêng biệt.
- **Phạm vi chỉnh sửa hẹp**: Trong mỗi phiên làm việc, chỉ thực hiện sửa đổi tối đa trên 2 tệp tin có liên quan trực tiếp đến nhau. Không thực hiện các đợt sửa đổi hàng loạt phân tán trên toàn bộ dự án để tránh mất kiểm soát logic chéo.
- **Sử dụng lệnh `patch` làm chủ đạo**: Chỉ sử dụng `write_file` cho các tệp tin mới tạo. Đối với các tệp tin hiện có, bắt buộc sử dụng `patch` để thay đổi từng vùng nhỏ, giúp khoanh vùng lỗi chính xác.
