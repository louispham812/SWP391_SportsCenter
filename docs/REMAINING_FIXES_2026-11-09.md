# Hoàn tất R01–R04 — 09/11/2026

Đối chiếu [báo cáo còn lỗi](REMAINING_LOGIC_2026-11-09.md). Bản sửa trước và các thay đổi có sẵn được giữ lại; không commit/push/deploy.

## R01 — Lần thanh toán và khoản thu gateway

- Tách `payment_attempts` (mỗi link/lần khởi tạo) và `gateway_receipts` (mỗi giao dịch gateway thành công) khỏi payment của đơn.
- Tạo lại link khi attempt còn hiệu lực trả cùng link, không kéo dài hạn giữ chỗ. Khóa payment khi tạo link/xử lý callback.
- Receipt có mã transaction gateway duy nhất tại DB. Callback lặp cùng transaction không cấp lại quyền lợi. Transaction khác trên đơn PAID/REFUNDED được lưu EXCESS và thông báo đối soát, không ghi đè khoản thu chính.
- Manager xem tại **Đối soát thanh toán dư** (`/admin/payment-reconciliation`). Chỉ hoàn chính receipt dư; thành công không hủy đơn hoặc thay đổi quyền lợi đã cấp.
- Gateway không xác nhận hoàn thành công thì receipt chuyển REVIEW_REQUIRED, không được bấm gửi lại một cách mù quáng. Không có nhánh giả lập thành công.
- Lưu thời điểm khởi tạo merchant của attempt để hoàn bằng đúng `vnp_TxnRef`, transaction number và merchant transaction date. Callback legacy có chữ ký hợp lệ vẫn được ghi nhận, nhưng thiếu metadata gốc sẽ yêu cầu đối soát, không suy đoán từ thời gian/số tiền.
- Hàm refund dùng JSON, checksum riêng của refund, HTTPS với kiểm tra chứng chỉ, kiểm tra checksum/amount/reference/status của response. Mã request ổn định riêng cho từng receipt.

Đã đối chiếu định dạng refund với [tài liệu chính thức VNPay](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr%26refund.html). Kiểm thử giao thức dùng HTTP client giả lập, không gửi hoàn tiền thật.

## R02 — Hết hạn và lịch bảo trì

- Không đặt toàn bộ held về 0 khi gói hết hạn.
- Từng booking được quyết toán nguồn giữ quota: lịch bảo trì/buổi bị hủy chuyển CANCELLED + FORFEITED; lịch tương lai hợp lệ chuyển sang giá lẻ; no-show thông thường chuyển sang USED.
- Ghi nhận quota_state cùng trạng thái booking. Xử lý lại không tạo hóa đơn hoặc quyết toán lần hai.
- Orphan hold/dữ liệu lịch sử không khớp được giữ để đối soát và ghi cảnh báo, không tự xóa hoặc tự cộng/trừ để che sai lệch.
- Số dư còn lại của gói EXPIRED chỉ là lịch sử, không có quyền dùng lại.

## R03 — Sửa điểm danh sau hết hạn

- Booking lưu quota_state HELD/USED/RELEASED/FORFEITED độc lập với nhãn điểm danh.
- PRESENT → EXCUSED khi gói hết hạn giữ USED nếu quota chưa được hoàn; đổi ngược lại không khấu trừ thêm.
- Quota đã hoàn trước lúc hết hạn không được chi tiêu lại sau hết hạn chỉ vì sửa nhãn.
- Dữ liệu EXCUSED cũ không có bằng chứng quota đã hoàn hay chưa được chặn với thông báo cần đối soát; không suy đoán từ tổng số dư của các booking khác.
- Audit ghi before/after và trạng thái hạch toán của booking.

## R04 — Điều kiện tại thời điểm check-in

- Sau khi chọn candidate, kiểm tra lại dưới khóa: đúng người, trạng thái, giờ, sân hoạt động, maintenance, payment PAID đúng đơn/loại/số tiền hoặc quota giữ còn hiệu lực và đúng chủ gói.
- Áp dụng cả admission lớp/PT: kiểm tra buổi học, địa điểm và sân liên kết; admission không thay điểm danh của Coach và không tiêu quota lớp/PT.
- Không cập nhật CHECKED_IN hoặc tiêu quota khi điều kiện sai; lượt sân quota thành công chuyển quota_state sang USED một lần.
- Đường cập nhật trạng thái sân/tạo-gia hạn-xóa bảo trì dùng khóa sân tương ứng để đồng bộ với check-in.

## Transaction, schema và chạy test

- Schema thêm hai bảng mới và cột nullable `quota_state` ở bookings/court_bookings, `merchant_date` ở payment_attempts; migration chạy lặp được. Không tự backfill các trạng thái lịch sử chưa chắc chắn.
- Audit/thông báo thành công tham gia transaction nghiệp vụ; tránh đọc member chưa commit qua transaction khác và tránh giữ log thành công khi nghiệp vụ rollback.
- `sporthub.scheduling.enabled=false` tắt cả scheduler và startup scan trong test. Mặc định khi chạy ứng dụng thật vẫn bật.
- `mvn -q test`: **190 tests, 0 failures, 0 errors, 0 skipped**.
- Trong đó: 23 RemainingFixRegressionTest, 4 VNPayRefundProtocolTest và 5 BookingHoldIntegrationTest trên SQL Server. Dữ liệu fixture của integration nằm trong transaction rollback.
- Sau tinh chỉnh cuối về deadline theo clock gateway và hiển thị receipt thiếu metadata: chạy lại 38 test Payment/Protocol/RemainingFix, đều pass.
- Frontend lint: exit 0, còn cảnh báo. Frontend build: exit 0. `git diff --check`: pass.
- Chưa thực hiện thanh toán/hoàn tiền thật, chưa stress test nhiều transaction trên DB riêng hoặc E2E toàn bộ giao diện.

## Lưu ý về lượt chẩn đoán SQL đầu

Lượt integration đầu còn bật cấu hình scheduler cũ, sau đó bị treo ở audit REQUIRES_NEW khi fixture member chưa commit. Đã dừng JVM đó, sửa transaction của audit/thông báo và tắt job/startup scan trong cấu hình test trước khi chạy lại.

Readback chỉ đọc audit log trong cửa sổ 18:31:53–18:38:00 ghi nhận **48 COURT_NO_SHOW và 13 CLASS_NO_SHOW**. Những job dùng transaction riêng có thể đã cập nhật dữ liệu nghiệp vụ cũ, không thuộc rollback của fixture. Chưa tự hoàn nguyên các dòng đó vì không có snapshot trước lượt chạy để bảo đảm việc phục hồi quota/trạng thái chính xác và phân biệt thay đổi đồng thời. Audit nguồn được giữ lại; không xóa hoặc sửa để che dấu lượt chạy này.

Các lượt kiểm thử cuối đã tắt job nền. Không nên hiểu kết quả rollback của fixture là khẳng định toàn bộ dữ liệu hiện có chưa từng thay đổi trong lượt chẩn đoán đầu.

Giới hạn cũ về ghi danh trọn khóa BR-03/04 và đối soát chứng từ lịch sử vẫn giữ nguyên; chúng không được đánh dấu đã triển khai trong lượt R01–R04 này.
