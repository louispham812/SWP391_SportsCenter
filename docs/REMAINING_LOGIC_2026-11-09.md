# Rà lại sau bản sửa — 09/11/2026

**Cập nhật:** R01–R04 đã được sửa và kiểm chứng; xem [báo cáo hoàn tất](REMAINING_FIXES_2026-11-09.md). Nội dung dưới đây và các probe mô tả hành vi trước bản sửa này.

Phát hiện 4 điểm logic còn cần xử lý; ngoài ra mô hình ghi danh trọn khóa và đối soát dữ liệu cũ vẫn là giới hạn đã nêu trong báo cáo sửa lỗi. Lượt này không thay đổi production code.

Ba probe mock đã chạy: 3 tests, 0 failures/errors. Probe mong đợi hành vi lỗi, nên PASS là tái hiện được lỗi, không phải chứng nhận nghiệp vụ đúng. Mã lưu tại `audit-2026-11-09/RemainingLogicAuditTest.java.txt`, ngoài bộ regression thường xuyên.

## R01 — P1: Chưa đối soát giao dịch gateway khác nhau trên cùng payment

- `service/gateway/VNPayGateway.java:153` tạo TxnRef mới theo timestamp mỗi lần generate link; `controller/PaymentController.java:59` chưa lưu/quản lý từng lần thanh toán.
- `controller/VNPayWebhookController.java:291` coi mọi callback sau PAID là đã xử lý, không phân biệt cùng giao dịch gateway hay một giao dịch thứ hai.
- Probe: một payment đã nhận transaction_one, callback có chữ ký được mock hợp lệ cho transaction_two vẫn được trả RspCode=00 mà không lưu/đối soát giao dịch thứ hai.
- Điều này chưa chứng minh đã có khách bị trừ tiền hai lần ngoài thực tế. Rủi ro là nếu hai link được thanh toán thành công, hệ thống không nhận diện khoản thu thứ hai để xử lý.
- Cần lưu payment attempt/gateway transaction riêng; chỉ bỏ qua callback trùng cùng transaction, còn khoản thu khác phải được ghi nhận và đối soát/hoàn dư.

## R02 — P1: Hết hạn xóa held của booking bảo trì còn CONFIRMED

- `service/BookingLifecycleService.java:68` bỏ qua no-show nếu sân bảo trì, đúng chủ đích tránh phạt khách.
- Nhưng `expire` tại dòng 88 chỉ chuyển lịch chưa kết thúc; cuối hàm dòng 118 lại đặt toàn bộ held về 0.
- Probe: gói EXPIRED có 1 giờ đang giữ cho booking quá giờ bị bảo trì. Sau reconcile, booking vẫn CONFIRMED và usesMembershipQuota=true nhưng held=0; không có hủy/đổi/settlement tương ứng.
- Sau đó hủy/tiêu quota có thể báo không đủ held. Cần giải quyết từng booking và trạng thái quota trước khi kết thúc gói, bao gồm lịch quá giờ bị miễn no-show do bảo trì.

## R03 — P2: Sửa điểm danh lịch sử sau khi gói hết hạn không nhất quán

- `service/MembershipService.java:364` không hoàn used khi gói đã hết hạn.
- `service/BookingService.java` vẫn chuyển attendance sang EXCUSED_ABSENCE; nếu sửa ngược về PRESENT/UNEXCUSED thì gọi consumeQuotaFromRemaining.
- Hàm này tại `MembershipService.java:413` từ chối vì gói hết hạn, dù quota trước đó vẫn đang used, chưa từng được hoàn.
- Probe xác nhận used giữ nguyên sau thao tác hoàn cho vắng có phép, rồi thao tác chuyển từ remaining sang used bị từ chối.
- Cần tính thay đổi dựa trên quota thực tế của booking; sửa nhãn điểm danh không được tiêu lần hai hoặc yêu cầu số dư đã mất hiệu lực.

## R04 — P1: Check-in chưa tái kiểm tra bảo trì và chứng từ/quyền lợi

- `repository/CourtBookingRepository.java:18` chỉ lọc booking CONFIRMED và thời gian; không xét sân hoạt động/bảo trì.
- `service/CheckInService.java:74` kiểm tra tài khoản và giờ, sau đó đổi CHECKED_IN/consume quota; không tái kiểm tra sân bảo trì, payment PAID hoặc gói còn hiệu lực.
- Khi sân bị đóng sau lúc đặt mà booking được giữ CONFIRMED để khách chọn phương án xử lý, check-in vẫn có đường đi đến thành công. Dữ liệu cũ có trạng thái booking và payment lệch nhau cũng chưa được chặn bằng chứng từ thực tế.
- Đây là phát hiện đọc code, chưa probe HTTP/DB cho tình huống bảo trì. Cần kiểm tra điều kiện tại thời điểm check-in dưới cùng transaction/khóa, và trả hướng xử lý thay vì tiêu quota.

## Giới hạn còn lại

- BR-03/04: cần mô hình liên kết khóa học với tất cả buổi và cơ chế giữ/ghi danh trọn khóa.
- Giao dịch membership lịch sử thiếu membership_id/gateway_reference và quota sai cần đối soát, không tự ghép bằng suy đoán.
- Kiểm thử đồng thời trên DB riêng và E2E toàn bộ màn hình chưa hoàn tất. Các điểm này là khoảng trống kiểm chứng/tính năng, không tự động được tính là lỗi đã tái hiện.
