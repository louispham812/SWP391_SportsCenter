# Sửa lỗi logic/nghiệp vụ — 09/11/2026

Đối chiếu [báo cáo audit](LOGIC_AUDIT_2026-11-09.md). Các thay đổi dưới đây áp dụng cho luồng mới; không tự sửa số dư hoặc ghép giao dịch lịch sử bằng suy đoán thời gian.

## Các nhóm thay đổi

| Audit | Thay đổi |
| --- | --- |
| A01 | SecurityConfig giới hạn Manager/Admin, Receptionist và Coach theo nhóm API. Check-in lấy nhân viên từ phiên đăng nhập. |
| A02 | Yêu cầu hoàn tiền phải có giao dịch PAID, đúng chủ sở hữu, đúng số tiền và đủ điều kiện; kiểm tra yêu cầu trùng dưới khóa payment. |
| A03 | Chỉ REFUNDED/APPROVED sau khi gateway trả thành công; bỏ giả lập thành công khi VNPay lỗi. Khóa yêu cầu/giao dịch; dùng mã yêu cầu hoàn ổn định để chống gửi lại thành giao dịch khác. Hoàn thất bại giữ yêu cầu chờ xử lý và ghi chú đối soát. |
| A04 | Whitelist phương thức; tiền mặt do Member đặt là PENDING. Lễ tân thu tiền qua API riêng, có audit. Giao dịch 0đ hợp lệ được PAID. |
| A05 | Tính cả PENDING vào occupancy; khóa sân khi đặt và xác nhận. Callback hết hạn/xung đột hủy lịch, tạo yêu cầu hoàn tiền, không xác nhận hai khách cùng sân. |
| A06 | Mỗi lần mua/gia hạn tạo UserMembership riêng; giữ gói hiện tại. Khi duyệt, kỳ mới nối sau kỳ cũ cùng nhóm và tính đủ durationDays. |
| A07 | Đổi lịch chỉ cùng thời lượng, bộ môn và đơn giá, trong hạn 2 giờ hoặc ngoại lệ bảo trì; kiểm tra cả lịch lớp. Đổi số giờ/đơn giá cần hủy và đặt mới. |
| A08 | Xét loại gói, bộ môn và thứ tự VIP/expiry/id; PT không dùng được quota CLASS hoặc PT bộ môn khác. Giá lẻ không còn giảm theo tên hiển thị gói. Màn đặt lịch hỏi quota theo loại lịch và nhu cầu giờ. |
| A09 | Ngày hiệu lực dùng startDate <= today <= endDate; gói nối kỳ chưa được sử dụng sớm. |
| A10 | Quota được khóa và refresh trước khi thay đổi; kiểm tra đủ nguồn, số dương và công thức không có thành phần âm. Hủy sau hoàn tiền có guard idempotency. |
| A11 | Khách mua lượt lẻ có booking hợp lệ được check-in mà không cần mua gói. |
| A12 | Chỉ check-in trong giờ booking; có bookingId để chọn sân, trường hợp nhiều sân phải chọn rõ. Giao diện hiển thị lịch sân và nút check-in riêng. |
| A13 | PT trả phí là BOOKED khi chưa trả tiền; timeout hủy booking và ClassSession PT, trả lịch cho HLV. |
| A14 | Job xử lý court/class no-show một lần; gói hết hạn chuyển lịch đang giữ quota sang thanh toán lẻ với hold 10 phút. Từng đối tượng được xử lý trong transaction riêng để một dòng lịch sử sai không chặn toàn bộ job. |
| A15 | Cho trả BORROWED/OVERDUE; khóa loan và tồn kho, chặn trả lặp. |
| A16 | Frontend gửi voucherCode; backend kiểm tra phạm vi, ngày, mức giảm, tối thiểu và lượt dùng. Giữ lượt voucher trong checkout, trả lại khi hold thất bại/hết hạn. Chỉ PERCENT/FIXED áp dụng cho lượt đặt; voucher gia hạn không được báo là giảm tiền booking. |
| A17 | Điểm danh lần đầu phải đủ quyền, booking CONFIRMED, đã đến giờ và payment PAID nếu có. Booking đã điểm danh không thể hủy như một hold chưa tiêu quota. |
| A18 | Liên kết payment-membership trực tiếp; thanh toán chỉ chuyển sang PENDING_APPROVAL, không cấp quota. Manager duyệt/từ chối phải có chứng từ PAID. Receipt membership được đồng bộ theo membershipId. |
| A19 | Public registration luôn MEMBER; OTP không kích hoạt nhân sự. Nhân sự PENDING phải qua Manager. |
| A20 | Member chỉ lưu giáo án AI cho chính mình; lưu hộ phải có quyền và quan hệ học viên. |
| A21 | HLV xem/tạo/sửa tiến độ, giáo án và bài tập phải được phân công học viên đó. |
| A22 | Callback khóa payment; PAID/REFUNDED là trạng thái đã xử lý, không bị callback cũ đảo ngược. Lưu gateway_reference để hoàn tiền bằng đúng mã VNPay ban đầu. |
| A23 | Lỗi OTP sai không rollback bộ đếm; token được khóa khi đọc. Có test đi qua Spring transaction proxy xác nhận commit khi trả lỗi. OTP gửi lại khi login tài khoản chờ xác thực cũng được giữ sau phản hồi redirect. |
| A24 | Duyệt nghỉ cần phương án thay khi còn lớp; HLV thay phải hoạt động, đúng chuyên môn, không trùng lịch/nghỉ phép và phù hợp lịch rảnh đã khai báo. Chặn duyệt lại đơn đã xử lý. |
| A25 | API xem/tạo link thanh toán kiểm tra chủ giao dịch hoặc vai trò nhân viên; link chỉ tạo cho PENDING còn thời hạn và số tiền dương. |

## Luồng tại quầy

- Member chọn tiền mặt: booking giữ 10 phút, giao dịch PENDING.
- Lễ tân mở POS → **Tải danh sách chờ thu**, kiểm tra hội viên/số tiền và bấm **Đã thu đủ tiền mặt** khi đã nhận tiền.
- API `POST /api/v1/receptionist/payments/{id}/confirm-cash` ghi nhận PAID và xác nhận lịch hoặc chuyển gói sang chờ Manager.
- Bán gói trực tiếp bằng tiền mặt tại POS là hành động thu tiền của nhân viên; gói vẫn chờ Manager duyệt.
- Hoàn tiền VNPay thất bại không hiện là đã hoàn; cần đối soát trước khi thử lại. Không dùng mock để che lỗi cổng thanh toán.

## Schema và dữ liệu cũ

`backend/src/main/resources/schema.sql` bổ sung idempotent các cột nullable của payment_transactions: `membership_id`, `voucher_id`, `gateway_reference`. Đã kiểm tra khởi động backend với SQL Server hiện có.

Giao dịch membership cũ chưa có liên kết trực tiếp cần đối soát trước khi duyệt/hoàn tiền; không tự ghép theo khoảng thời gian hoặc số tiền. Số dư quota lịch sử sai không được tự cộng/trừ để che sai lệch. Job ghi lỗi theo đối tượng để xử lý dữ liệu riêng.

Mô hình khóa học trọn khóa (BR-03/04: liên kết một gói với danh sách tất cả buổi) vẫn cần thiết kế dữ liệu riêng; hiện chưa có đủ liên kết để chứng nhận tự ghi danh cả khóa. Bộ chọn entitlement đã chặn dùng chéo loại/bộ môn, nhưng không thay thế việc triển khai mô hình khóa học này.

## Kiểm chứng

- `mvn -q test`: **159 tests, 0 failures, 0 errors, 0 skipped**.
- Trong đó có 22 test LogicAuditRegressionTest, kiểm tra phân quyền qua SecurityConfig và BookingHoldIntegrationTest trên SQL Server. Test hold tạo dữ liệu riêng trong transaction được rollback.
- Test hold xác nhận khách thứ hai không đặt được sân/giờ đã có PENDING; đây là kiểm thử tuần tự, chưa phải stress test nhiều transaction đồng thời.
- Kiểm tra lại nhóm Auth/Refund/Receptionist/Booking/Maintenance/LogicAudit sau chỉnh sửa cuối: đều pass. Regression no-show cũng kiểm tra ngoại lệ sân bảo trì không bị trừ quota.
- `npm run lint`: hoàn thành, còn cảnh báo; `npm run build`: thành công.
- `git diff --check`: không có lỗi whitespace.
- Gateway/email trong regression dùng mock; bộ test sẵn có vẫn có kiểm tra SQL Server/Gemini theo cấu hình. Không thực hiện thanh toán hoặc hoàn tiền thật; chưa chạy toàn bộ 95 màn hình bằng trình duyệt.

Các probe `.java.txt` trong thư mục audit là bằng chứng hành vi trước khi sửa. Không dùng assertion cũ mong đợi hành vi sai làm regression sau khi sửa.

[Kết quả kiểm chứng ngắn gọn](audit-2026-11-09/fix-verification.txt).
