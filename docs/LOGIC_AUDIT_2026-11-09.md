# Rà soát logic và nghiệp vụ — 09/11/2026

**Cập nhật sau audit:** Đã triển khai các thay đổi và kiểm thử hồi quy; xem [báo cáo sửa lỗi](LOGIC_FIXES_2026-11-09.md). Các phát hiện/bằng chứng bên dưới mô tả trạng thái trước khi sửa.

## Kết quả và phạm vi

Sau lượt kiểm tra bổ sung, ghi nhận **25 nhóm vấn đề** cần xử lý trong các luồng chính (A01–A25). A13 được đính chính: lớp chưa thanh toán đã có job timeout; lỗi thực tế nằm ở PT được xác nhận trước thanh toán. Đây là audit code và kiểm thử có mục tiêu, không phải chứng nhận toàn bộ hệ thống đã được kiểm tra hết mọi tổ hợp.

Đối chiếu `docs/BUSINESS_RULES.md` với checkout lớp/PT/sân, quota, gói/gia hạn, callback thanh toán, hoàn tiền, điểm danh/check-in, scheduler, dụng cụ, voucher, tài khoản/OTP, hồ sơ/giáo án học viên, nghỉ phép HLV và kiểm soát vai trò. Frontend lint/build và bộ test backend hiện có đã chạy thành công; lint còn cảnh báo. Bộ test sẵn có có kết nối SQL Server và gọi Gemini theo cấu hình. Không thực hiện giao dịch/hoàn tiền thật; toàn bộ probe gateway/repository dùng mock. Không chạy E2E thao tác hàng loạt trên DB hiện có.

**18 probe xác nhận hành vi lỗi đã tái hiện thành công** (11 probe cũ chạy lại + 7 probe bổ sung), gồm 3 test HTTP qua SecurityConfig thật. Các probe bổ sung gọi controller/service trực tiếp với mock, không chứng minh transaction/concurrency trên DB thật. Probe PASS nghĩa là quan sát được lỗi như mô tả, không có nghĩa luồng nghiệp vụ đúng. Mã probe được lưu dạng `.java.txt` để không đưa hành vi sai thành điều kiện phải pass trong bộ regression thường xuyên.

- [Kết quả probe](audit-2026-11-09/probe-results.txt)
- [Mã probe](audit-2026-11-09/AuditProbeTest.java.txt)
- [Mã probe bổ sung](audit-2026-11-09/AuditFollowupProbeTest.java.txt)
- [Kết quả kiểm tra bổ sung](audit-2026-11-09/followup-results.txt)
- P1: ưu tiên cao do ảnh hưởng tiền, quyền thao tác, quyền lợi hoặc lịch bị xác nhận sai.
- P2: lỗi nghiệp vụ cần sửa sau các P1.

## Thứ tự xử lý đề xuất

1. Chặn thao tác vượt vai trò, tự kích hoạt nhân sự, ghi dữ liệu người khác và tự xác nhận tiền; kiểm tra chủ giao dịch, trạng thái hoàn tiền/callback: A01–A04, A18–A23, A25.
2. Bảo vệ slot, quota và quyền lợi đã mua: A05–A10, A17.
3. Đồng nhất check-in, timeout/no-show/hết hạn, lịch thay HLV, dụng cụ và voucher: A11–A16, A24.

## Chi tiết phát hiện

### A01 — [P1] Thiếu phân quyền ở các API đặc quyền

**Vị trí:** [config/SecurityConfig.java:70](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/config/SecurityConfig.java:70); [controller/RefundRequestController.java:200](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/RefundRequestController.java:200); [controller/RefundRequestController.java:206](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/RefundRequestController.java:206); [controller/CheckInController.java:20](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/CheckInController.java:20)

**Bằng chứng:** Đã tái hiện bằng 3 test HTTP qua SecurityConfig thật: token MEMBER nhận HTTP 200 khi xem toàn bộ danh sách hoàn tiền, quyết định từ chối hoàn tiền, và gọi API check-in cũ. URL có chữ manager/reception không tự tạo giới hạn vai trò. EquipmentController, VoucherController và CoachLeaveController cũng thiếu kiểm tra vai trò ở các thao tác tương ứng khi đọc code.

**Ảnh hưởng:** Có thể can thiệp nghiệp vụ của nhân viên, truy cập thông tin hoàn tiền của người khác; API check-in cũ còn nhận receptionistId do client gửi.

**Hướng sửa:** Đặt quy tắc vai trò ở SecurityConfig/method security và kiểm tra tại ranh giới controller; lấy nhân viên ghi nhận từ Authentication.

### A02 — [P1] Yêu cầu hoàn tiền chưa kiểm tra chủ giao dịch và thanh toán hợp lệ

**Vị trí:** [controller/RefundRequestController.java:109](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/RefundRequestController.java:109); [controller/RefundRequestController.java:154](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/RefundRequestController.java:154)

**Bằng chứng:** Test đã tạo thành công yêu cầu hoàn tiền của user 9 cho payment thuộc user 777. Code chỉ chặn REFUNDED và số tiền vượt giá trị gốc; không kiểm tra memberId hay bắt buộc PAID. Khi không tìm thấy giao dịch gốc, yêu cầu vẫn được lưu.

**Ảnh hưởng:** Đề nghị hoàn tiền sai người, giao dịch chưa thu tiền hoặc giao dịch không tồn tại; lỗi A01 làm mức độ ảnh hưởng lớn hơn.

**Hướng sửa:** Bắt buộc tìm được payment, kiểm tra ownership, trạng thái đã thu tiền, booking và chính sách hoàn; kiểm tra trùng trên payment ở DB thay vì chỉ trong danh sách của người gửi.

### A03 — [P1] Hoàn tiền VNPay thất bại vẫn ghi đã hoàn tiền

**Vị trí:** [controller/RefundRequestController.java:263](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/RefundRequestController.java:263); [controller/RefundRequestController.java:292](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/RefundRequestController.java:292)

**Bằng chứng:** Test mock VNPay trả mã 99: controller vẫn để refund APPROVED và payment REFUNDED. Khi gateway ném exception cũng chỉ ghi decisionNote rồi tiếp tục. Sau đó luồng còn có thể hủy booking/gói và báo đã duyệt cho khách.

**Ảnh hưởng:** Sổ tiền báo đã hoàn trong khi khách chưa nhận tiền; giao dịch không còn ở trạng thái có thể xử lý lại bình thường.

**Hướng sửa:** Tách phê duyệt khỏi kết quả chuyển tiền; chỉ ghi REFUNDED khi gateway xác nhận thành công, lưu trạng thái thất bại/có thể thử lại và bảo vệ idempotency.

### A04 — [P1] Client có thể tự tạo giao dịch PAID bằng phương thức bất kỳ

**Vị trí:** [service/PaymentService.java:117](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/PaymentService.java:117); [service/PaymentService.java:137](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/PaymentService.java:137); [service/BookingService.java:611](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:611)

**Bằng chứng:** Test truyền NOT_A_GATEWAY vào PaymentService và nhận PAID. Mọi phương thức khác VNPAY đều PAID, kể cả CASH_COUNTER, SANDBOX và chuỗi không hợp lệ. Luồng checkout/member purchase nhận phương thức từ client, không có bước nhân viên xác nhận tiền mặt trước khi coi là đã thu.

**Ảnh hưởng:** Booking/giao dịch có thể được ghi nhận đã trả tiền mà không đi qua cổng thanh toán hoặc nhân viên thu tiền.

**Hướng sửa:** Whitelist phương thức; yêu cầu tiền mặt do Member tạo phải PENDING; chỉ nhân viên được xác nhận đã thu và phải ghi audit.

### A05 — [P1] Booking sân PENDING không giữ độc quyền khung giờ

**Vị trí:** [repository/CourtBookingRepository.java:29](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/repository/CourtBookingRepository.java:29); [service/BookingService.java:734](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:734); [service/payment/CourtBookingPaymentHandler.java:49](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/payment/CourtBookingPaymentHandler.java:49)

**Bằng chứng:** Đọc code: kiểm tra trùng sân chỉ xét CONFIRMED/CHECKED_IN, trong khi đơn VNPay mới là PENDING. Vì vậy hai yêu cầu tuần tự có thể cùng tạo PENDING cho một sân/giờ. Khi callback đến, handler chỉ gán CONFIRMED, không tái kiểm tra xung đột.

**Ảnh hưởng:** Hai khách có thể cùng trả tiền và được xác nhận cùng sân/giờ; vi phạm giữ chỗ 10 phút BR-07. Chưa chạy thử thanh toán/concurrency trên DB thật.

**Hướng sửa:** Tính PENDING chưa hết hạn vào occupancy, dùng cùng khóa sân trên mọi đường tạo/chuyển trạng thái và xử lý thanh toán đến muộn khi đã mất chỗ.

### A06 — [P1] Gia hạn/nâng gói làm mất hiệu lực gói hiện tại trước khi trả tiền

**Vị trí:** [controller/MemberProfileController.java:398](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/MemberProfileController.java:398); [controller/MemberProfileController.java:412](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/MemberProfileController.java:412); [controller/MemberProfileController.java:422](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/MemberProfileController.java:422); [service/MembershipService.java:64](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/MembershipService.java:64)

**Bằng chứng:** Test mua gia hạn bằng VNPAY: giao dịch mới còn PENDING nhưng chính bản ghi gói cũ ACTIVE đã đổi thành PENDING_APPROVAL. Nâng gói đắt hơn còn đổi gói cũ thành EXPIRED. Khi duyệt, approveMembership lại đặt ngày bắt đầu = hôm nay, ngày kết thúc = hôm nay + duration, bỏ thời hạn đã nối. Luồng cũng so giá giữa mọi loại gói, có thể chặn mua PT/CLASS độc lập khi đang có VIP.

**Ảnh hưởng:** Mất quyền lợi đang trả tiền, mất ngày còn lại; không tuân thủ gói độc lập BR-02 và gia hạn nối tiếp BR-06.

**Hướng sửa:** Tạo UserMembership mới cho lần mua mới; giữ nguyên gói hiện tại; tính kỳ mới theo đúng nhóm gói/HLV/bộ môn và chỉ kích hoạt sau thanh toán + duyệt.

### A07 — [P1] Đổi lịch có thể tăng giờ/đổi sân đắt hơn mà không bù quota hoặc tiền

**Vị trí:** [service/BookingService.java:1952](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:1952)

**Bằng chứng:** Test đổi booking quota 1 giờ thành 3 giờ: thời gian mới được lưu nhưng quotaHoursUsed vẫn 1, không gọi MembershipService. Code không tính chênh giá, không kiểm tra hạn đổi trước 2 giờ của lịch cũ và không kiểm tra trùng lịch lớp của khách.

**Ảnh hưởng:** Nhận thêm giờ/sân với quota hoặc số tiền cũ; có thể đổi lịch sát giờ sang ngày khác rồi hủy để lách hạn hủy.

**Hướng sửa:** Giới hạn loại đổi lịch cho phép hoặc tính lại chênh lệch quota/tiền nguyên tử; áp dụng chính sách 2 giờ và kiểm tra toàn bộ lịch cá nhân.

### A08 — [P1] Chọn gói dùng quota chưa xét đúng loại quyền lợi

**Vị trí:** [service/MembershipService.java:180](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/MembershipService.java:180); [service/BookingService.java:900](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:900); [service/BookingService.java:1003](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:1003); [service/BookingService.java:495](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:495)

**Bằng chứng:** Đọc code: lớp và PT đều gọi cùng getActiveMembershipWithQuota(userId, 1), hàm không biết loại booking, loại package, HLV hay bộ môn. findFirst không sắp theo ngày hết hạn gần nhất. Ngoài ra giá lẻ được giảm 10–50% theo tên gói, dù BR-08 yêu cầu tính 100% giá lẻ khi hết quota.

**Ảnh hưởng:** Quota khóa lớp có thể dùng cho PT/bộ môn khác, thứ tự trừ sai, khách hết quota có thể vẫn được giảm giá ngoài quy định.

**Hướng sửa:** Xây bộ chọn entitlement có bookingType, sport/coach và kỳ hiệu lực; sắp đúng ưu tiên BR-08; lấy chính sách giá từ cấu hình đã thống nhất.

### A09 — [P2] Quota mất hiệu lực sớm một ngày và thiếu kiểm tra ngày bắt đầu

**Vị trí:** [service/MembershipService.java:180](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/MembershipService.java:180); [service/MembershipService.java:457](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/MembershipService.java:457)

**Bằng chứng:** Test membership endDate = hôm nay và còn quota: cả selector lớp và sân đều trả null, vì dùng endDate.isAfter(today). Hai selector cũng không kiểm tra startDate, nên có thể chọn gói tương lai nếu nó mang status ACTIVE.

**Ảnh hưởng:** Khách bị từ chối dùng quota trong ngày cuối còn hạn; gói nối kỳ có thể dùng sớm. Khác với scheduler chỉ hết hạn khi endDate < today.

**Hướng sửa:** Dùng startDate <= today <= endDate, thống nhất múi giờ và thêm test ngày biên.

### A10 — [P1] Quota có thể âm và cập nhật đồng thời thiếu khóa

**Vị trí:** [service/MembershipService.java:470](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/MembershipService.java:470); [service/MembershipService.java:502](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/MembershipService.java:502); [repository/UserMembershipRepository.java:8](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/repository/UserMembershipRepository.java:8)

**Bằng chứng:** Test gọi releaseCourtQuota hai lần từ remaining=9, held=1, initial=10: nhận remaining=11, held=-1 nhưng validateCourtQuotaFormula vẫn thành công vì tổng vẫn bằng 10. Repository đọc membership không khóa và entity không có @Version; các booking ở sân/lớp khác nhau có thể đọc cùng số quota. Nhánh cancelBookingAfterRefund cũng chưa có guard đã CANCELLED trước khi hoàn lại quota.

**Ảnh hưởng:** Số dư sai, hoàn quota trùng hoặc dùng vượt hạn mức. Phần giá trị âm đã tái hiện; nguy cơ race đọc từ cấu trúc code, chưa chạy stress test.

**Hướng sửa:** Kiểm tra mọi thành phần >= 0, held đủ để release/consume, cập nhật có khóa/atomic hoặc @Version và idempotency theo booking.

### A11 — [P2] Lễ tân từ chối khách mua lượt lẻ có booking hợp lệ

**Vị trí:** [controller/ReceptionistController.java:188](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/ReceptionistController.java:188)

**Bằng chứng:** Đọc code: isValid bắt buộc ACTIVE user và hasActiveMembership, trước khi gọi checkInBooking. Khách vãng lai không mua gói, dù đã trả tiền và có court booking CONFIRMED, vẫn bị lưu REJECTED.

**Ảnh hưởng:** Khách thanh toán giá lẻ không vào được sân; hai API check-in có điều kiện khác nhau.

**Hướng sửa:** Xác định đủ điều kiện theo booking đã xác nhận và entitlement/payment của booking; không bắt buộc gói hội viên cho lượt lẻ.

### A12 — [P2] Check-in chưa xác định đúng giờ và đúng booking/sân

**Vị trí:** [repository/CourtBookingRepository.java:18](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/repository/CourtBookingRepository.java:18); [service/CheckInService.java:71](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/CheckInService.java:71)

**Bằng chứng:** Đọc code: truy vấn chỉ giới hạn ngày và endTime > now, không có điều kiện startTime <= now/cửa sổ check-in. Quét buổi sáng có thể đánh CHECKED_IN lịch tối. Request chỉ có memberId, service tự chọn lịch sớm nhất và các sân cùng giờ; không cho lễ tân chỉ rõ booking/sân thực tế.

**Ảnh hưởng:** Ghi nhận có mặt và tiêu quota sai thời điểm/sai sân; chưa đáp ứng kiểm tra khung giờ BR-09. Đây là phần còn thiếu của bản sửa check-in trước trong chat này.

**Hướng sửa:** Cho chọn bookingId hoặc QR booking; kiểm tra sân, giờ hoạt động và cửa sổ check-in được thống nhất trước khi đổi trạng thái.

### A13 — [P1] PT chưa thanh toán được xác nhận ngay và không bị timeout

**Vị trí:** [service/BookingService.java:645](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:645); [service/BookingService.java:708](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:708); [service/PaymentTimeoutScheduler.java:60](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/PaymentTimeoutScheduler.java:60)

**Bằng chứng:** Probe `unpaidPtIsConfirmedAndExcludedFromTimeoutScan` xác nhận checkout PT/VNPAY tạo booking CONFIRMED dù payment PENDING. PaymentTimeoutScheduler chỉ truy vấn bookings trạng thái BOOKED, nên không lấy các PT này. ClassSession PT vẫn SCHEDULED và ngăn HLV nhận lịch trùng. Đính chính kết luận cũ: lớp BOOKED chưa thanh toán có được quét bởi PaymentTimeoutScheduler; không giữ kết luận lớp chiếm chỗ vô thời hạn.

**Ảnh hưởng:** Khách bỏ thanh toán vẫn giữ ca PT/HLV, lịch hiển thị đã xác nhận dù chưa thu tiền, trái BR-07/16.

**Hướng sửa:** PT trả phí chỉ được xác nhận sau PAID, có hold 10 phút; khi hủy hold phải giải phóng cả booking và ClassSession PT để HLV nhận lịch mới. Không hủy booking quota 0đ hoặc booking đã trả tiền.

### A14 — [P1] Thiếu xử lý vòng đời no-show và booking giữ quota khi gói hết hạn

**Vị trí:** [service/SystemAutomationScheduler.java:127](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/SystemAutomationScheduler.java:127); [service/CheckInService.java:94](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/CheckInService.java:94)

**Bằng chứng:** Đọc các scheduler/caller quota: hết hạn gói mới chỉ đổi status EXPIRED, chưa chuyển booking tương lai sang giá lẻ/hold 10 phút như BR-05. Không thấy tác vụ sân kết thúc mà chưa check-in để chuyển held sang used/no-show như BR-09. consumeCourtQuota hiện chỉ được gọi ở check-in.

**Ảnh hưởng:** Quota có thể treo ở held và booking vẫn CONFIRMED sau thời điểm gói hết hạn; vắng không check-in không được xử lý đúng quy định.

**Hướng sửa:** Bổ sung job có idempotency và audit cho hết hạn/no-show, thống nhất chuyển đổi payment/booking/quota trong transaction.

### A15 — [P2] Dụng cụ OVERDUE không thể trả

**Vị trí:** [controller/EquipmentController.java:159](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/EquipmentController.java:159); [service/SystemAutomationScheduler.java:178](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/SystemAutomationScheduler.java:178)

**Bằng chứng:** Test equipment loan status OVERDUE gọi returnEquipment: HTTP 409 vì hàm chỉ cho BORROWED. Trong khi scheduler và getLoans tự chuyển BORROWED quá 7 ngày thành OVERDUE.

**Ảnh hưởng:** Khách càng trả trễ càng không thể hoàn trả trên hệ thống; tồn kho không được cộng lại.

**Hướng sửa:** Cho phép BORROWED và OVERDUE được trả; chặn RETURNED; tính phí/phạt và hoàn kho một lần.

### A16 — [P2] Voucher hiển thị giảm giá nhưng checkout không áp dụng

**Vị trí:** [controller/VoucherController.java:45](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/VoucherController.java:45); [dto/CheckoutRequest.java:5](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/dto/CheckoutRequest.java:5); [service/BookingService.java:611](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:611)

**Bằng chứng:** Đọc code frontend MemberBookingFlowPage tính finalRetailPrice từ appliedVoucher, nhưng lời gọi checkoutBooking retail không truyền voucher. CheckoutRequest có voucherCode nhưng BookingService không đọc trường này; không thấy cập nhật usedCount trong các service. validateVoucher cũng không đối chiếu appliesTo với loại đơn.

**Ảnh hưởng:** Giá khách thấy có thể thấp hơn payment tạo ở backend; lượt dùng và phạm vi voucher không được thực thi ở checkout.

**Hướng sửa:** Truyền mã và tính lại trên server, trả quote/confirmation thống nhất; reserve/consume lượt dùng nguyên tử theo kết quả thanh toán.

### A17 — [P1] Điểm danh lớp có thể áp dụng cho buổi tương lai/chưa thanh toán

**Vị trí:** [service/BookingService.java:1386](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:1386); [service/BookingService.java:1645](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/BookingService.java:1645)

**Bằng chứng:** Đọc code: updateAttendance cho BOOKED và CONFIRMED, không xác minh payment hoặc buổi đã đến giờ. BOOKED từ checkout VNPay chưa trả tiền vẫn có thể được ghi PRESENT. Booking quota đã điểm danh sớm có thể còn được hủy trước giờ; cancelClassBooking vẫn release từ held thay vì xét quota đã chuyển used.

**Ảnh hưởng:** Điểm danh/tiêu quota trước buổi học, hoặc hoàn nhầm nguồn quota sau khi đã tiêu; có thể tạo held âm.

**Hướng sửa:** Ràng buộc lần điểm danh đầu theo payment, thời gian buổi và quyền; hủy/đổi attendance phải dựa vào trạng thái quota thực tế.

### A18 — [P1] Luồng kích hoạt gói còn bỏ qua duyệt và xác nhận thanh toán

**Vị trí:** [service/payment/MembershipPaymentHandler.java:69](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/payment/MembershipPaymentHandler.java:69); [service/MembershipService.java:49](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/MembershipService.java:49); [controller/MemberProfileController.java:445](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/MemberProfileController.java:445)

**Bằng chứng:** Đọc code: MembershipPaymentHandler tìm ReceptionPayment gần thời gian rồi tự gán ACTIVE khi nhận thanh toán; không chờ Manager như BR-04. Nhánh đó chỉ reset quotaSessions theo initial có sẵn, không cấp quotaCourts từ package. approveMembership chỉ kiểm tra PENDING/PENDING_APPROVAL, không kiểm tra payment PAID; purchase tạo PENDING_APPROVAL cả trước thanh toán.

**Ảnh hưởng:** Gói có thể ACTIVE sai luồng hoặc không đủ quota ở nhánh VNPay, dù nhánh Manager duyệt đã sửa quota sân. Gói chưa trả tiền cũng có thể được đưa vào duyệt và kích hoạt.

**Hướng sửa:** Thanh toán chỉ chuyển PENDING_PAYMENT -> PENDING_APPROVAL; dùng liên kết payment-membership trực tiếp, Manager chỉ duyệt gói đã thanh toán và dùng một hàm kích hoạt/quota thống nhất.

### A19 — [P1] Nhân sự tự kích hoạt qua OTP, bỏ qua Manager

**Vị trí:** [service/AuthService.java:205](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/AuthService.java:205); [service/AuthService.java:783](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/AuthService.java:783); [service/AuthService.java:705](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/AuthService.java:705)

**Bằng chứng:** Public register chấp nhận role COACH/RECEPTIONIST và tạo PENDING chờ Manager. Nhưng resendOtp chỉ xét PENDING, không phân biệt nhân sự chờ duyệt với Member chờ xác thực. verifyEmail cũng chỉ xét PENDING rồi đặt ACTIVE và tạo session. Probe đi qua resendOtp -> verifyEmail cho RECEPTIONIST và nhận ACTIVE + token, không có Manager.

**Ảnh hưởng:** Người tự đăng ký có thể trở thành nhân viên hoạt động; mở ra các nghiệp vụ nhân viên hợp lệ ngay cả sau khi sửa A01.

**Hướng sửa:** Public register luôn tạo MEMBER theo BR-01; tách trạng thái/xác thực email khỏi phê duyệt nhân sự. OTP không có quyền duyệt nhân sự.

### A20 — [P1] Member ghi giáo án AI vào tài khoản người khác

**Vị trí:** [controller/WorkoutProgressController.java:156](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/WorkoutProgressController.java:156)

**Bằng chứng:** Nhánh source=AI nhận targetMemberId từ request mà không kiểm tra bằng actorId. Probe Member 9 tạo thành công plan cho Member 777.

**Ảnh hưởng:** Hội viên có thể chèn giáo án/kết quả/nhận xét vào hồ sơ tập luyện người khác; nội dung do client cung cấp được gắn nhãn AI.

**Hướng sửa:** Member chỉ được lưu cho chính mình; người có quyền lưu hộ phải được kiểm tra vai trò và quan hệ với học viên trên server.

### A21 — [P1] HLV truy cập và sửa hồ sơ học viên ngoài phạm vi phụ trách

**Vị trí:** [controller/WorkoutProgressController.java:110](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/WorkoutProgressController.java:110); [controller/WorkoutProgressController.java:214](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/WorkoutProgressController.java:214); [controller/WorkoutProgressController.java:341](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/WorkoutProgressController.java:341)

**Bằng chứng:** Probe HLV 9 đọc thành công tiến độ của học viên 777 mà không có quan hệ lớp/PT. Controller chỉ xét role COACH; createPlan, togglePlanExercise và recordBodyProgress cũng không kiểm tra HLV được phân công cho học viên/giáo án mục tiêu.

**Ảnh hưởng:** Lộ dữ liệu thể chất và có thể sửa tiến độ ngoài lớp phụ trách, trái BR-13.

**Hướng sửa:** Dùng kiểm tra phân công lớp/PT thống nhất cho cả đọc và ghi; kiểm tra chủ giáo án khi thao tác theo planId.

### A22 — [P1] Callback phát lại có thể đổi giao dịch REFUNDED về PAID

**Vị trí:** [controller/VNPayWebhookController.java:285](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/VNPayWebhookController.java:285); [controller/VNPayWebhookController.java:201](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/VNPayWebhookController.java:201)

**Bằng chứng:** verifyPayment chỉ chặn PAID, không chặn REFUNDED. Probe với signature được mock hợp lệ và callback thành công cũ khiến payment REFUNDED được lưu lại PAID. Đây là lỗi chuyển trạng thái với callback có chữ ký hợp lệ, không phải kết luận có thể giả chữ ký.

**Ảnh hưởng:** Trạng thái sau hoàn tiền bị đảo ngược; doanh thu/đối soát sai và có thể mở lại điều kiện hoàn tiền. Callback cũng chưa có khóa chống xử lý đồng thời.

**Hướng sửa:** Xây state machine/idempotency theo giao dịch gateway và lần thanh toán; REFUNDED là trạng thái kết thúc, callback cũ chỉ được ghi nhận hoặc bỏ qua, không được đổi về PAID. Khóa/atomic update khi xử lý.

### A23 — [P1] Bộ đếm nhập sai OTP bị rollback cùng exception

**Vị trí:** [service/AuthService.java:484](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/AuthService.java:484); [service/AuthService.java:520](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/AuthService.java:520); [service/AuthService.java:705](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/AuthService.java:705); [service/AuthService.java:752](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/service/AuthService.java:752)

**Bằng chứng đọc code (chưa probe transaction trên DB):** verifyCode và verifyEmail có @Transactional mặc định. Khi OTP sai, cả hai save failedAttempts rồi ném IllegalArgumentException/RuntimeException ra khỏi service. Transaction sẽ rollback thay đổi counter/locked; request tiếp theo không nhận được số lần sai đã tăng. Unit test gọi service trực tiếp với mock không thể phát hiện việc rollback này.

**Ảnh hưởng:** Giới hạn 5 lần nhập sai không được bảo đảm dù response nói đã tăng/khóa; mã OTP có thể bị thử nhiều lần trong thời gian còn hiệu lực.

**Hướng sửa:** Commit việc tăng counter/khóa trong transaction riêng hoặc trả kết quả xác thực rồi ném lỗi ngoài transaction; kiểm thử qua Spring proxy và DB riêng để xác nhận counter tồn tại qua các request.

### A24 — [P1] Duyệt HLV thay thế có thể tạo hai ca dạy trùng giờ

**Vị trí:** [controller/CoachLeaveController.java:140](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/CoachLeaveController.java:140); [controller/CoachLeaveController.java:169](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/CoachLeaveController.java:169)

**Bằng chứng:** Probe gán HLV 20 thay HLV 10 cho ca 10h–11h trong khi HLV 20 đã có ca cùng giờ: API vẫn APPROVED, cả hai ClassSession cùng coachId. Nhánh duyệt chỉ kiểm tra role COACH, không kiểm tra lịch trống, ACTIVE, chuyên môn hay đơn nghỉ đã duyệt. Khi không chọn HLV thay, đơn vẫn được duyệt nhưng lịch cũ không bị dời/hủy.

**Ảnh hưởng:** Một HLV phải dạy hai buổi cùng lúc; khách nhận thông báo thay HLV dù việc sắp lịch chưa hợp lệ, không đáp ứng BR-12.

**Hướng sửa:** Kiểm tra lịch trống/hoạt động/chuyên môn/nghỉ phép của HLV thay trước khi duyệt, giữ khóa phù hợp; bắt buộc có phương án thay thế hoặc dời/hủy và xử lý quyền lợi cho từng ca.

### A25 — [P2] API thanh toán thiếu kiểm tra chủ giao dịch và trạng thái được trả tiền

**Vị trí:** [controller/PaymentController.java:59](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/PaymentController.java:59); [controller/PaymentController.java:129](C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/backend/src/main/java/com/sporthub/backend/controller/PaymentController.java:129)

**Bằng chứng:** getPaymentStatus/generatePayment chỉ tìm paymentId, không nhận Authentication hay đối chiếu memberId; SecurityConfig chỉ bắt đăng nhập. Probe đọc thông tin giao dịch Member 777 thành công mà không qua ownership. generatePayment cũng không chặn PAID/REFUNDED hoặc booking đã hủy và không đối chiếu lần thanh toán còn hiệu lực.

**Ảnh hưởng:** Người đăng nhập có thể xem số tiền, phương thức/mã giao dịch của người khác và tạo link thanh toán cho đơn ngoài quyền hạn hoặc đã kết thúc; kết hợp A22 gây rủi ro đối soát.

**Hướng sửa:** Kiểm tra chủ giao dịch hoặc quyền nhân viên phù hợp; chỉ tạo payment URL cho đơn chờ trả tiền còn hiệu lực, liên kết lần thanh toán với booking và hold cụ thể.

## Phần cần xác nhận thêm

- BR-03/04 yêu cầu ghi danh trọn khóa và giữ chỗ tất cả buổi. Nhánh approveMembership hiện cấp quota, chưa thấy liên kết khóa học/sinh booking hàng loạt. Cần xác nhận mô hình khóa học thực tế trước khi coi đây là một tính năng đã hoàn thiện.
- Các tình huống đồng thời: thanh toán return/IPN cùng lúc, dùng quota ở hai sân khác nhau, duyệt hoàn tiền hai lần và mượn/trả tồn kho song song cần test transaction/concurrency với DB riêng.
- Chưa kiểm chứng toàn bộ 95 màn hình bằng trình duyệt, gửi email thật hoặc kết nối tài khoản thanh toán thật.

## Tái chạy probe

Copy hai file `AuditProbeTest.java.txt` và `AuditFollowupProbeTest.java.txt` trong `docs/audit-2026-11-09/` thành file `.java` tương ứng ở `backend/src/test/java/com/sporthub/backend/`, chạy `mvn -f backend/pom.xml test "-Dtest=AuditProbeTest,AuditFollowupProbeTest"`, rồi xóa hai bản copy trong src/test. Không dùng các assertion ghi nhận hành vi sai này thay cho regression test sau khi sửa.

Các thay đổi production code từ lượt sửa trước được giữ nguyên; lượt audit này chỉ bổ sung báo cáo và bằng chứng kiểm thử.
