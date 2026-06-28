# TIÊU CHUẨN LẬP TRÌNH CHUNG (SOFTWARE RULES)

Tài liệu này định nghĩa các quy tắc và quy trình bắt buộc khi lập trình và chỉnh sửa mã nguồn cho tất cả các dự án con nằm trong thư mục /root/SOFTWARE/.

## 1. QUY TRÌNH CHỈNH SỬA MÃ NGUỒN (BẮT BUỘC)

Mọi tác vụ thay đổi mã nguồn phải tuân thủ nghiêm ngặt 3 bước sau:

1. **Phân tích trước khi sửa**:
   - Sử dụng công cụ đọc file để khảo sát cấu trúc hiện tại.
   - Trình bày giải pháp và các tệp tin sẽ bị ảnh hưởng.
   - Chỉ thực hiện thay đổi sau khi được sự đồng ý của người dùng.

2. **Chỉnh sửa tối giản**:
   - Sử dụng công cụ `patch` để sửa đổi các dòng cụ thể. Tránh ghi đè toàn bộ tệp tin để giảm thiểu rủi ro lỗi cú pháp.
   - Với mô hình Gemini Flash, ưu tiên viết các hàm nhỏ, đơn nhiệm và có logic tường minh.

3. **Kiểm tra sau khi sửa**:
   - Chạy lệnh biên dịch thử hoặc lệnh kiểm tra lỗi cú pháp (linter/compiler) của dự án con ngay lập tức.
   - Xác minh kết quả thực thi trước khi báo cáo hoàn thành.

## 2. QUY TRẮC VIẾT MÃ NGUỒN CHO MÔ HÌNH FLASH

Để khắc phục giới hạn suy luận của mô hình Flash, lập trình viên AI phải tuân thủ:
- **Không tự ý suy đoán**: Nếu thiếu thông tin cấu hình hoặc dữ liệu đầu vào, phải hỏi làm rõ trước khi viết mã nguồn.
- **Xử lý ngoại lệ**: Mọi hàm xử lý logic phải có cơ chế bắt lỗi và ghi log rõ ràng để dễ dàng truy vết khi gặp sự cố.
- **Tận dụng mã nguồn mẫu**: Luôn tìm kiếm các đoạn mã nguồn có sẵn trong dự án để viết mã nguồn mới theo đúng khuôn mẫu và phong cách thiết kế hiện có.

## 3. TIÊU CHUẨN BÁO CÁO KẾT QUẢ

- Trình bày kết quả hoàn toàn bằng tiếng Việt chuẩn.
- Không sử dụng biểu tượng cảm xúc (emoji) hoặc ký tự đặc biệt trang trí.
- Báo cáo rõ ràng: Tệp tin đã sửa, kết quả chạy lệnh kiểm tra lỗi cú pháp và trạng thái hoạt động thực tế.
