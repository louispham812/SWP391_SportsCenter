# TÀI LIỆU QUY TẮC NGHIỆP VỤ HỆ THỐNG (BUSINESS RULES - BR)
**Dự án:** Hệ thống Quản lý Trung tâm Thể thao (Sports Center Management System)
**Mã nhóm:** Group 3.0 | **Số lượng quy tắc:** 23 Business Rules (BR-01 đến BR-23)
**Phạm vi áp dụng:** 6 Luồng nghiệp vụ cốt lõi & 95 màn hình chức năng

## MỤC LỤC TỔNG QUAN
| Mã BR | Phân hệ / Luồng | Tên quy tắc nghiệp vụ | Vai trò áp dụng | Màn hình liên quan |
| :--- | :--- | :--- | :--- | :--- |
| **BR-01** | Flow 1 | [Khởi tạo tài khoản & Xác thực người dùng](#br-01-kh-i-t-o-t-i-kho-n---x-c-th-c-ng--i-d-ng) | `Member, Receptionist, Manager, System` | `MEM-01, MEM-02, MEM-10, REC-01, REC-02, REC-08, MGR-01` |
| **BR-02** | Flow 1 | [Phân loại & Đặc tính 3 nhóm gói tập](#br-02-ph-n-lo-i-----c-t-nh-3-nh-m-g-i-t-p) | `Member, Receptionist, Manager` | `MEM-06, MEM-07, REC-05, MGR-04, MGR-05` |
| **BR-03** | Flow 1 | [Điều kiện mở bán Khóa lớp & Cơ chế giữ chỗ](#br-03--i-u-ki-n-m--b-n-kh-a-l-p---c--ch--gi--ch-) | `Member, Receptionist, System` | `MEM-07, REC-05, MGR-04, MGR-16` |
| **BR-04** | Flow 1 | [Quy trình phê duyệt kích hoạt gói tập & Nâng hạng hội viên](#br-04-quy-tr-nh-ph--duy-t-k-ch-ho-t-g-i-t-p---n-ng-h-ng-h-i-vi-n) | `Manager, System` | `MEM-07, MEM-08, REC-07, MGR-16, MGR-23` |
| **BR-05** | Flow 1 | [Vòng đời gói, Quản lý Quota & Xử lý hết hạn](#br-05-v-ng---i-g-i--qu-n-l--quota---x--l--h-t-h-n) | `Member, Receptionist, System` | `MEM-08, MEM-09, REC-07, MGR-05` |
| **BR-06** | Flow 1 | [Quy tắc Gia hạn gói tập & Nối tiếp thời hạn](#br-06-quy-t-c-gia-h-n-g-i-t-p---n-i-ti-p-th-i-h-n) | `Member, Receptionist, Manager, System` | `MEM-09, REC-06, MGR-05, MGR-23` |
| **BR-07** | Flow 2 | [Giữ chỗ tạm thời & Chống trùng lịch](#br-07-gi--ch--t-m-th-i---ch-ng-tr-ng-l-ch) | `Member, Receptionist, System` | `MEM-15, MEM-29, MEM-31, REC-15, REC-25, MGR-21` |
| **BR-08** | Flow 2 | [Thứ tự ưu tiên xét quyền lợi & Khấu trừ Quota](#br-08-th--t---u-ti-n-x-t-quy-n-l-i---kh-u-tr--quota) | `System` | `MEM-15, MEM-29, MEM-31, REC-15, REC-25, MGR-05` |
| **BR-09** | Flow 2 | [Quy trình & Thẩm quyền Check-in sân thể thao](#br-09-quy-tr-nh---th-m-quy-n-check-in-s-n-th--thao) | `Receptionist, Manager, Member` | `MEM-10, MEM-29, REC-11, REC-12, MGR-22, MGR-25` |
| **BR-10** | Flow 2 | [Quy định Hủy lịch, Đổi lịch & Xử lý Vắng mặt](#br-10-quy---nh-h-y-l-ch----i-l-ch---x--l--v-ng-m-t) | `Member, Receptionist, Manager, System` | `MEM-17, MEM-30, REC-16, MGR-21` |
| **BR-11** | Flow 2 | [Xử lý Ngoại lệ Bảo trì Sân bãi](#br-11-x--l--ngo-i-l--b-o-tr--s-n-b-i) | `Manager, Member, System` | `MEM-25, MEM-30, MGR-19, MGR-21` |
| **BR-12** | Flow 2 | [Quản lý Lịch trống & Quy trình Xin nghỉ / Thay thế Huấn luyện viên](#br-12-qu-n-l--l-ch-tr-ng---quy-tr-nh-xin-ngh----thay-th--hu-n-luy-n-vi-n) | `Coach, Manager, System` | `COA-12, COA-14, COA-16, MGR-09, MGR-24` |
| **BR-13** | Flow 2 | [Quản lý Bảo mật Hồ sơ Học viên cho Huấn luyện viên](#br-13-qu-n-l--b-o-m-t-h--s--h-c-vi-n-cho-hu-n-luy-n-vi-n) | `Coach, System` | `COA-02, COA-03, COA-04` |
| **BR-14** | Flow 2 | [Mượn/Trả Đồ, Tủ Locker & Cho thuê Dụng cụ Thể thao](#br-14-m--n-tr------t--locker---cho-thu--d-ng-c--th--thao) | `Receptionist, System` | `REC-13, REC-24, MGR-06` |
| **BR-15** | Flow 3 | [Tạo Hóa đơn, Giao dịch Đối soát 0đ & Quản lý Voucher](#br-15-t-o-h-a---n--giao-d-ch---i-so-t-0----qu-n-l--voucher) | `Manager, Receptionist, Member, System` | `MEM-11, MEM-12, REC-05, REC-18, REC-19, MGR-10, MGR-18` |
| **BR-16** | Flow 3 | [Thu tiền, Xác nhận Thanh toán & Chuyển trạng thái](#br-16-thu-ti-n--x-c-nh-n-thanh-to-n---chuy-n-tr-ng-th-i) | `Member, Receptionist, System` | `MEM-11, REC-18, REC-19, REC-20, MGR-10` |
| **BR-17** | Flow 3 | [Chính sách & Thẩm quyền Phê duyệt Hoàn tiền / Hủy giao dịch](#br-17-ch-nh-s-ch---th-m-quy-n-ph--duy-t-ho-n-ti-n---h-y-giao-d-ch) | `Manager, Receptionist, Member, System` | `MEM-12, REC-21, MGR-16` |
| **BR-18** | Flow 3 | [Kiểm toán Hệ thống & Bắt buộc Lưu vết Audit Log](#br-18-ki-m-to-n-h--th-ng---b-t-bu-c-l-u-v-t-audit-log) | `System, Manager` | `MGR-01, MGR-02, MGR-14, MGR-25` |
| **BR-19** | Flow 4 | [Quy trình Điểm danh Lớp/PT & 3 Trạng thái Tham gia](#br-19-quy-tr-nh--i-m-danh-l-p-pt---3-tr-ng-th-i-tham-gia) | `Coach, System` | `COA-05, COA-06, MEM-18, MEM-19` |
| **BR-20** | Flow 4 | [Phân cấp Thẩm quyền & Quy tắc Tính lại Quota khi Sửa điểm danh](#br-20-ph-n-c-p-th-m-quy-n---quy-t-c-t-nh-l-i-quota-khi-s-a--i-m-danh) | `Coach, Receptionist, Manager, Member, System` | `MEM-19, MEM-26, REC-26, COA-05, COA-06, MGR-17, MGR-25` |
| **BR-21** | Flow 5 | [Quy trình Sinh Kế hoạch Tập luyện Cá nhân hóa bằng AI](#br-21-quy-tr-nh-sinh-k--ho-ch-t-p-luy-n-c--nh-n-h-a-b-ng-ai) | `Coach, AI System` | `MEM-05, COA-07, COA-11, MGR-15` |
| **BR-22** | Flow 5 | [Cơ chế Kiểm duyệt & Lưu trữ Giáo án của Huấn luyện viên](#br-22-c--ch--ki-m-duy-t---l-u-tr--gi-o--n-c-a-hu-n-luy-n-vi-n) | `Coach, Member, System` | `MEM-20, COA-07, COA-11` |
| **BR-23** | Flow 6 | [Phạm vi Hoạt động, An toàn & Cơ chế Chuyển tiếp của Trợ lý ảo AI](#br-23-ph-m-vi-ho-t---ng--an-to-n---c--ch--chuy-n-ti-p-c-a-tr--l---o-ai) | `Member, AI Assistant, Receptionist, Manager` | `MEM-24, MEM-26, REC-22, MGR-15` |

---

## CHI TIẾT 23 QUY TẮC NGHIỆP VỤ

### BR-01: Khởi tạo tài khoản & Xác thực người dùng (Account Creation & User Authentication)
- **Phân hệ / Luồng nghiệp vụ:** Flow 1: User & Membership Management
- **Vai trò áp dụng:** `Member, Receptionist, Manager, System`
- **Chức năng / Màn hình liên quan:** `MEM-01, MEM-02, MEM-10, REC-01, REC-02, REC-08, MGR-01`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Người dùng đăng ký trực tuyến bằng Email/SĐT + Mật khẩu, hệ thống tự động gán vai trò MEMBER (không có ô chọn vai trò trên giao diện), gửi mã xác thực OTP qua email (hiệu lực 10 phút, quá 10 phút phải yêu cầu gửi lại). Lễ tân tạo tài khoản tại quầy cho MEMBER, COACH, RECEPTIONIST (danh sách vai trò ẩn MANAGER), tài khoản hoạt động ngay không cần OTP. Manager có toàn quyền tạo mọi vai trò bao gồm MANAGER. Tài khoản mới mặc định là Khách vãng lai, được cấp 1 mã QR cá nhân động để nhận diện tại quầy (Lễ tân có thể liên kết thêm thẻ từ/vòng tay RFID vào hồ sơ).

---

### BR-02: Phân loại & Đặc tính 3 nhóm gói tập (Package Classification & Specification)
- **Phân hệ / Luồng nghiệp vụ:** Flow 1: User & Membership Management
- **Vai trò áp dụng:** `Member, Receptionist, Manager`
- **Chức năng / Màn hình liên quan:** `MEM-06, MEM-07, REC-05, MGR-04, MGR-05`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Hệ thống cung cấp đúng 3 nhóm gói dịch vụ độc lập: (1) Gói VIP: có thời hạn cố định 1, 3, 6 hoặc 12 tháng, tặng kèm định mức quota sử dụng miễn phí (giờ sân, buổi học lớp nhóm, buổi tập PT); (2) Gói PT riêng: bán theo số lượng buổi tập (vd 10 buổi/2 tháng, 20 buổi/3 tháng), bắt buộc gắn cố định với 1 Huấn luyện viên hoặc 1 Bộ môn thể thao cụ thể; (3) Gói Khóa lớp: đăng ký trọn khóa học có số buổi cố định (vd 12 buổi), giữ chỗ toàn bộ các buổi học của khóa. Khách vãng lai có thể mua độc lập Gói PT riêng hoặc Khóa lớp mà không bắt buộc phải mua gói VIP. Gói PT riêng và Khóa lớp không làm thay đổi hạng tài khoản thành VIP.

---

### BR-03: Điều kiện mở bán Khóa lớp & Cơ chế giữ chỗ (Course Class Sale & Seat Reservation)
- **Phân hệ / Luồng nghiệp vụ:** Flow 1: User & Membership Management
- **Vai trò áp dụng:** `Member, Receptionist, System`
- **Chức năng / Màn hình liên quan:** `MEM-07, REC-05, MGR-04, MGR-16`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Khi khách đăng ký gói Khóa lớp, hệ thống bắt buộc kiểm tra điều kiện: khóa học phải còn ít nhất 1 buổi chưa diễn ra và tất cả các buổi học còn lại đều còn chỗ trống; nếu hết chỗ hoặc khóa đã kết thúc thì chặn tạo hóa đơn. Hóa đơn chưa thanh toán KHÔNG được giữ chỗ lớp. Chỗ chỉ được chính thức giữ khi khách thanh toán thành công (chuyển sang trạng thái 'chờ duyệt'). Trường hợp khóa lớp còn slot cuối và nhiều khách cùng thanh toán, hệ thống ưu tiên khách thanh toán thành công trước; khách thanh toán sau bị hết chỗ sẽ được hệ thống tự động hoàn tiền 100% và hủy gói ngay lập tức mà không cần Manager phê duyệt.

---

### BR-04: Quy trình phê duyệt kích hoạt gói tập & Nâng hạng hội viên (Package Activation Approval & VIP Tiering)
- **Phân hệ / Luồng nghiệp vụ:** Flow 1: User & Membership Management
- **Vai trò áp dụng:** `Manager, System`
- **Chức năng / Màn hình liên quan:** `MEM-07, MEM-08, REC-07, MGR-16, MGR-23`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Cả 3 loại gói sau khi thanh toán thành công đều ở trạng thái 'Chờ duyệt' (Pending Approval). Trong thời gian chờ duyệt, gói chưa có hiệu lực, khách vẫn giữ hạng Khách vãng lai. Chỉ khi Manager phê duyệt trên hệ thống: (1) Gói VIP: Bắt đầu tính thời hạn từ ngày duyệt (hoặc nối tiếp gói cũ nếu còn hạn), nâng hạng tài khoản thành Hội viên VIP, cấp quota miễn phí; (2) Gói PT riêng: Kích hoạt số buổi đã mua kèm thời hạn, không nâng hạng VIP; (3) Gói Khóa lớp: Ghi danh trọn khóa, tự động tạo booking xác nhận cho tất cả các buổi học của khóa, không nâng hạng VIP. Nếu Manager từ chối duyệt: Hệ thống tự động tạo đề nghị hoàn trả 100% số tiền đã thanh toán, nhả toàn bộ chỗ giữ và gửi thông báo cho khách.

---

### BR-05: Vòng đời gói, Quản lý Quota & Xử lý hết hạn (Package Lifecycle, Quota & Expiry Policy)
- **Phân hệ / Luồng nghiệp vụ:** Flow 1: User & Membership Management
- **Vai trò áp dụng:** `Member, Receptionist, System`
- **Chức năng / Màn hình liên quan:** `MEM-08, MEM-09, REC-07, MGR-05`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Vòng đời gói trải qua các trạng thái: Chờ thanh toán -> Chờ duyệt -> Đang hoạt động -> Hết hạn (hoặc Đã hủy/Hoàn tiền). Một buổi/quota được ghi nhận là 'Đã dùng' khi: Coach điểm danh Có mặt (lớp/PT), Lễ tân check-in (sân), hoặc học viên vắng không xin phép (No-show). Nếu dùng hết quota/buổi trước hạn, gói VIP vẫn có hiệu lực cho đến hết hạn, các lượt đặt tiếp theo tính giá lẻ như khách vãng lai. Khi gói hết hạn: Toàn bộ quota/buổi chưa sử dụng bị hủy bỏ hoàn toàn, không bảo lưu, không hoàn tiền, không chuyển nhượng. Tài khoản VIP tự động trở về Khách vãng lai vào lúc 00:00 ngày kế tiếp khi không còn gói VIP nào khác đang hoạt động. Các booking tương lai đang giữ quota của gói hết hạn sẽ tự động chuyển sang giá lẻ (giữ chỗ 10 phút để thanh toán, quá hạn tự hủy).

---

### BR-06: Quy tắc Gia hạn gói tập & Nối tiếp thời hạn (Membership Renewal & Continuity Rules)
- **Phân hệ / Luồng nghiệp vụ:** Flow 1: User & Membership Management
- **Vai trò áp dụng:** `Member, Receptionist, Manager, System`
- **Chức năng / Màn hình liên quan:** `MEM-09, REC-06, MGR-05, MGR-23`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Gia hạn bản chất là mua một gói mới cùng loại (VIP kỳ tiếp theo, gói PT mới, khóa lớp mới). Thanh toán xong phải chờ Manager phê duyệt mới được kích hoạt. Quy tắc tính ngày hiệu lực: Nếu gói cũ còn hạn, gói mới sẽ tự động bắt đầu từ ngày kế tiếp ngày hết hạn gói cũ (ngày kết thúc = ngày bắt đầu + số tháng - 1 ngày); nếu gói cũ đã hết hạn, gói mới tính từ ngày Manager duyệt. Quota và số buổi tính hoàn toàn theo gói mới, tuyệt đối không cộng dồn quota còn thừa của gói cũ. Đối với gói PT riêng, 'gói cũ' được xác định là gói có cùng HLV hoặc cùng bộ môn.

---

### BR-07: Giữ chỗ tạm thời & Chống trùng lịch (Temporary Hold & Anti-Conflict Booking)
- **Phân hệ / Luồng nghiệp vụ:** Flow 2: Booking & Schedule Management
- **Vai trò áp dụng:** `Member, Receptionist, System`
- **Chức năng / Màn hình liên quan:** `MEM-15, MEM-29, MEM-31, REC-15, REC-25, MGR-21`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Khi đặt sân, đăng ký lớp hoặc đặt ca PT, hệ thống kiểm tra tình trạng trống của cơ sở vật chất/HLV và kiểm tra lịch cá nhân của khách hàng (chống trùng lịch). Đối với các booking phải trả phí (cả Khách vãng lai và Hội viên VIP khi hết quota), hệ thống áp dụng thời gian giữ chỗ tạm thời cố định là 10 phút. Trong thời gian 10 phút này, khung giờ/chỗ ngồi được giữ và chiếm dụng trên lịch. Nếu quá 10 phút khách không hoàn tất thanh toán, hệ thống tự động hủy booking và nhả lại chỗ cho người khác.

---

### BR-08: Thứ tự ưu tiên xét quyền lợi & Khấu trừ Quota (Entitlement Priority & Quota Deduction Order)
- **Phân hệ / Luồng nghiệp vụ:** Flow 2: Booking & Schedule Management
- **Vai trò áp dụng:** `System`
- **Chức năng / Màn hình liên quan:** `MEM-15, MEM-29, MEM-31, REC-15, REC-25, MGR-05`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Hệ thống tự động xét duyệt quyền lợi thanh toán theo đúng thứ tự nghiêm ngặt: (1) Đặt sân: Ưu tiên dùng Quota giờ sân của gói VIP còn hạn (thanh toán 0đ, giữ quota) -> Nếu hết quota hoặc không có gói thì tính 100% Giá lẻ theo khung giờ Peak/Off-peak; (2) Đăng ký lớp: Ưu tiên xét Đã ghi danh Khóa lớp (không cần đặt lẻ) -> Quota buổi lớp của gói VIP còn hạn -> Giá lẻ từng buổi; (3) Đặt ca PT: Ưu tiên Quota buổi PT của gói VIP còn hạn -> Gói PT riêng còn hạn, còn buổi và đúng HLV/bộ môn -> Giá lẻ buổi PT. Quy tắc nguyên khối: Mỗi lượt booking chỉ được sử dụng duy nhất 1 nguồn quyền lợi. Nếu số quota/giờ còn lại nhỏ hơn nhu cầu của lượt đặt (vd: khách còn 1 giờ sân nhưng đặt ca 2 giờ), hệ thống chuyển toàn bộ booking sang giá lẻ, tuyệt đối không tách một phần quota một phần giá lẻ. Nếu có nhiều gói cùng loại còn hiệu lực, ưu tiên trừ gói có ngày hết hạn gần nhất; nếu cùng ngày hết hạn thì trừ gói mua trước.

---

### BR-09: Quy trình & Thẩm quyền Check-in sân thể thao (Sports Court Check-in Protocol)
- **Phân hệ / Luồng nghiệp vụ:** Flow 2: Booking & Schedule Management
- **Vai trò áp dụng:** `Receptionist, Manager, Member`
- **Chức năng / Màn hình liên quan:** `MEM-10, MEM-29, REC-11, REC-12, MGR-22, MGR-25`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Check-in sân bắt buộc thực hiện tại quầy bởi Lễ tân (hoặc Manager): (1) Khách xuất trình mã QR cá nhân hoặc mã QR booking. Lễ tân quét mã để tra cứu thông tin, hạng hội viên, gói dịch vụ và các lịch đặt sân trong ngày. QR cá nhân chỉ phục vụ nhận diện hồ sơ, không thay thế booking hợp lệ; (2) Lễ tân kiểm tra trạng thái booking đã xác nhận, đúng sân và đúng khung giờ hoạt động; (3) Đối với booking dùng quota VIP: Hệ thống chỉ chính thức trừ quota giờ sân tại thời điểm Lễ tân bấm Check-in thành công. Nếu khách không check-in và không hủy trước hạn, hệ thống tự động trừ quota khi kết thúc khung giờ; (4) Sau khi check-in, trạng thái booking chuyển thành 'Đã check-in' (giữ nguyên trạng thái này, không chuyển thành hoàn thành); (5) Lễ tân và Manager có quyền chỉnh sửa lại lượt check-in sân nếu có sai sót và phải ghi Audit Log. Member tuyệt đối không được tự check-in hoặc sửa check-in.

---

### BR-10: Quy định Hủy lịch, Đổi lịch & Xử lý Vắng mặt (Cancellation, Reschedule & No-show Policy)
- **Phân hệ / Luồng nghiệp vụ:** Flow 2: Booking & Schedule Management
- **Vai trò áp dụng:** `Member, Receptionist, Manager, System`
- **Chức năng / Màn hình liên quan:** `MEM-17, MEM-30, REC-16, MGR-21`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Thời hạn quy định để hủy hoặc đổi lịch là trước 2 tiếng so với giờ bắt đầu (cấu hình bởi Manager). Hủy đúng hạn (>= 2 tiếng) hoặc Buổi bị hoãn do HLV/Sân: Đối với booking dùng quota/buổi của gói, hệ thống tự động nhả lại buổi/quota vào số dư của gói như chưa từng dùng (khách được đặt lại miễn phí trong hạn gói, không phải buổi tặng bù); đối với booking trả tiền lẻ, hệ thống tự động tạo yêu cầu hoàn 100% tiền. Hủy muộn (< 2 tiếng) hoặc Vắng mặt không xin phép (No-show): Hệ thống vẫn khấu trừ 1 buổi/quota của gói; đối với booking trả tiền lẻ thì áp dụng chính sách phạt (hoàn 50% hoặc không hoàn tiền). Đổi lịch: Thực chất là thao tác Hủy booking cũ và Tạo booking mới theo đúng quy tắc hủy. Nếu gói đã hết quota tại thời điểm đổi lịch, booking mới bắt buộc phải thanh toán giá lẻ. Gói đã hết hạn: Khách vẫn được phép bấm hủy lịch cũ nhưng không được hoàn lại buổi/quota (quota của gói hết hạn là mất vĩnh viễn).

---

### BR-11: Xử lý Ngoại lệ Bảo trì Sân bãi (Court Maintenance Exception Handling)
- **Phân hệ / Luồng nghiệp vụ:** Flow 2: Booking & Schedule Management
- **Vai trò áp dụng:** `Manager, Member, System`
- **Chức năng / Màn hình liên quan:** `MEM-25, MEM-30, MGR-19, MGR-21`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Khi Manager kích hoạt khóa tạm thời một sân thể thao để bảo trì (do sự cố kỹ thuật, ngập nước, hư hỏng): Hệ thống tự động liệt kê toàn bộ các booking bị ảnh hưởng và gửi thông báo khẩn cấp đến từng khách hàng. Hệ thống TUYỆT ĐỐI KHÔNG tự ý dời booking sang sân khác. Khách hàng tự quyết định đổi lịch hoặc hủy booking. Mọi giao dịch hủy/đổi do sân bảo trì đều được hệ thống tự động xử lý như hủy đúng hạn: hoàn 100% quota vào gói hoặc hoàn 100% tiền đã thanh toán, không phạt bất kỳ chi phí nào.

---

### BR-12: Quản lý Lịch trống & Quy trình Xin nghỉ / Thay thế Huấn luyện viên (Coach Availability & Leave/Replacement Workflow)
- **Phân hệ / Luồng nghiệp vụ:** Flow 2: Booking & Schedule Management
- **Vai trò áp dụng:** `Coach, Manager, System`
- **Chức năng / Màn hình liên quan:** `COA-12, COA-14, COA-16, MGR-09, MGR-24`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Huấn luyện viên khai báo khung giờ rảnh cố định theo thứ trong tuần để phục vụ xếp lịch lớp và mở ca cho Member đặt PT (có thể tạm đóng từng ca khi có việc bận). Khi HLV cần xin nghỉ đột xuất hoặc đổi ca (ốm đau, việc riêng), HLV bắt buộc phải tạo đơn trên hệ thống gửi Manager phê duyệt. HLV và Lễ tân KHÔNG ĐƯỢC tự ý chuyển ca cho HLV khác. Trước khi bấm duyệt đơn xin nghỉ, Manager bắt buộc phải thực hiện gán thủ công một HLV thay thế đủ chuyên môn cho toàn bộ các ca học/buổi PT bị ảnh hưởng. Hệ thống tự động gửi thông báo điều chỉnh HLV cho học viên (chỉ mang tính thông báo). Khách hàng không phải trả thêm bất kỳ khoản chênh lệch nào kể cả khi HLV thay thế có mức giá niêm yết cao hơn. Nếu không bố trí được HLV thay thế, Manager bắt buộc phải từ chối đơn xin nghỉ.

---

### BR-13: Quản lý Bảo mật Hồ sơ Học viên cho Huấn luyện viên (Student Data Privacy & Access Control for Coaches)
- **Phân hệ / Luồng nghiệp vụ:** Flow 2: Booking & Schedule Management
- **Vai trò áp dụng:** `Coach, System`
- **Chức năng / Màn hình liên quan:** `COA-02, COA-03, COA-04`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Huấn luyện viên chỉ được cấp quyền truy cập để xem lịch dạy, danh sách học viên, hồ sơ thể chất cơ bản, mục tiêu tập luyện và tiền sử bệnh lý/chấn thương (PAR-Q) của các học viên thuộc lớp học nhóm hoặc ca PT cá nhân mà chính Huấn luyện viên đó được phân công phụ trách. Huấn luyện viên tuyệt đối không được phép tìm kiếm, truy cập hoặc xem hồ sơ của học viên thuộc các lớp hoặc ca tập của huấn luyện viên khác.

---

### BR-14: Mượn/Trả Đồ, Tủ Locker & Cho thuê Dụng cụ Thể thao (Locker & Equipment Rental Management)
- **Phân hệ / Luồng nghiệp vụ:** Flow 2: Booking & Schedule Management
- **Vai trò áp dụng:** `Receptionist, System`
- **Chức năng / Màn hình liên quan:** `REC-13, REC-24, MGR-06`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Khi khách vào trung tâm, Lễ tân gán chìa khóa tủ Locker và khăn tập miễn phí thông qua việc quét mã QR/RFID của hội viên. Trường hợp khách thuê dụng cụ thể thao tính phí (vợt Pickleball, vợt Tennis, bóng thi đấu): Hệ thống bắt buộc kiểm tra số lượng tồn kho khả dụng trước khi bàn giao. Phí thuê dụng cụ được tính theo số giờ thực tế sử dụng (làm tròn lên theo giờ nguyên), tạo hóa đơn và thu tiền tại thời điểm khách trả đồ. Nếu dụng cụ mượn quá 7 ngày mà chưa trả lại quầy, hệ thống tự động chuyển trạng thái bản ghi thành 'Quá hạn' (Overdue), gửi thông báo cảnh báo và kích hoạt quy trình thu hồi/đền bù.

---

### BR-15: Tạo Hóa đơn, Giao dịch Đối soát 0đ & Quản lý Voucher (Invoice Generation, Zero-Dollar Settlement & Voucher Management)
- **Phân hệ / Luồng nghiệp vụ:** Flow 3: Payment & Report Management
- **Vai trò áp dụng:** `Manager, Receptionist, Member, System`
- **Chức năng / Màn hình liên quan:** `MEM-11, MEM-12, REC-05, REC-18, REC-19, MGR-10, MGR-18`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Mọi giao dịch phát sinh (mua gói, gia hạn, đặt sân, lớp, PT giá lẻ, mua nước, thuê dụng cụ) đều phải tự động sinh mã Hóa đơn điện tử duy nhất. Đối với các lượt sử dụng dịch vụ bằng quota/gói (VIP, PT riêng, khóa lớp), hệ thống tự động sinh một bản ghi giao dịch 0đ tại thời điểm trừ buổi/check-in nhằm phục vụ đối soát doanh thu nội bộ và tính hoa hồng mà không thu thêm tiền của khách. Quản lý Voucher: Voucher giảm giá do duy nhất Manager khởi tạo và cấu hình (loại giảm: phần trăm %, số tiền cố định, hoặc gia hạn thêm ngày; đơn hàng tối thiểu; giới hạn số lượt sử dụng; thời hạn hiệu lực; phạm vi áp dụng). Lễ tân tại quầy và khách hàng trực tuyến chỉ được áp dụng các mã voucher hợp lệ có sẵn trên hệ thống, Lễ tân không được tự nhập mức chiết khấu thủ công. Loại voucher 'gia hạn thời gian' chỉ áp dụng cho gói VIP/PT và chỉ kéo dài ngày hết hạn chứ không cộng thêm quota.

---

### BR-16: Thu tiền, Xác nhận Thanh toán & Chuyển trạng thái (Payment Collection & State Transition)
- **Phân hệ / Luồng nghiệp vụ:** Flow 3: Payment & Report Management
- **Vai trò áp dụng:** `Member, Receptionist, System`
- **Chức năng / Màn hình liên quan:** `MEM-11, REC-18, REC-19, REC-20, MGR-10`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Hỗ trợ thanh toán trực tuyến qua cổng tích hợp (VNPAY/MoMo/Ngân hàng) hoặc thu tiền trực tiếp tại quầy (Tiền mặt, quẹt POS, chuyển khoản QR ngân hàng). Khi thu tiền tại quầy, hệ thống bắt buộc lưu vết ID nhân viên lễ tân thu tiền và phương thức thanh toán. Ngay khi thanh toán thành công: Hóa đơn của 3 loại gói tập tự động chuyển sang trạng thái 'Chờ duyệt' (chờ Manager duyệt ở MGR-23); booking dịch vụ lẻ chuyển sang trạng thái 'Xác nhận'. Lễ tân in biên lai nhiệt hoặc gửi hóa đơn qua email khách hàng.

---

### BR-17: Chính sách & Thẩm quyền Phê duyệt Hoàn tiền / Hủy giao dịch (Refund Policy & Manager Approval Authority)
- **Phân hệ / Luồng nghiệp vụ:** Flow 3: Payment & Report Management
- **Vai trò áp dụng:** `Manager, Receptionist, Member, System`
- **Chức năng / Màn hình liên quan:** `MEM-12, REC-21, MGR-16`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Thẩm quyền duyệt hoàn tiền duy nhất thuộc về Center Manager (MGR-16). Lễ tân lập đề nghị hoàn tiền cho các giao dịch sai sót hoặc khi tiếp nhận yêu cầu từ hội viên; hệ thống tự động sinh yêu cầu hoàn tiền khi hội viên hủy booking trực tuyến hợp lệ hoặc khi Manager từ chối duyệt kích hoạt gói. Mức hoàn tiền quy định: (1) Manager từ chối duyệt gói: Hoàn 100% số tiền đã đóng; (2) Khóa lớp hết chỗ khi thanh toán: Hệ thống tự động hoàn 100% ngay lập tức (không cần Manager duyệt); (3) Hủy booking đúng hạn hoặc sân bảo trì: Hoàn 100% giá lẻ; (4) Hủy muộn: Hoàn 50% hoặc không hoàn tiền tùy cấu hình chính sách; (5) Gói tập đã hết hạn: Tuyệt đối không hoàn tiền dưới bất kỳ hình thức nào. Mỗi booking hoặc hóa đơn chỉ được phép phê duyệt hoàn tiền tối đa 1 lần duy nhất, số tiền hoàn không vượt quá số tiền thực thu. Mọi quyết định từ chối hoàn tiền bắt buộc phải nhập lý do giải trình.

---

### BR-18: Kiểm toán Hệ thống & Bắt buộc Lưu vết Audit Log (System Audit Trail & Security Logging)
- **Phân hệ / Luồng nghiệp vụ:** Flow 3: Payment & Report Management
- **Vai trò áp dụng:** `System, Manager`
- **Chức năng / Màn hình liên quan:** `MGR-01, MGR-02, MGR-14, MGR-25`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Mọi thao tác làm thay đổi dữ liệu nhạy cảm trong hệ thống bắt buộc phải được ghi nhận tự động vào bảng Audit Log phục vụ đối soát, bao gồm: Thao tác của Coach và Lễ tân: tạo, sửa, hủy, xác nhận điểm danh, check-in sân, thu tiền; Thao tác quan trọng của Manager: duyệt/từ chối gói tập, duyệt hoàn tiền, cấu hình giá, phân quyền vai trò, khóa/mở khóa tài khoản, can thiệp sửa điểm danh, đặt sân thủ công; Thao tác tự động của Hệ thống: tự trừ quota khi vắng không phép (No-show), tự hủy booking quá hạn giữ chỗ 10 phút, tự quét chuyển gói hết hạn lúc 00:00. Mỗi bản ghi Audit Log bắt buộc lưu đầy đủ: User ID thực hiện, Hành động, Thời gian chính xác, Giá trị dữ liệu trước khi sửa (Old Value), Giá trị dữ liệu sau khi sửa (New Value) và Địa chỉ IP của thiết bị thực hiện thao tác.

---

### BR-19: Quy trình Điểm danh Lớp/PT & 3 Trạng thái Tham gia (Attendance Recording & 3-State Logic)
- **Phân hệ / Luồng nghiệp vụ:** Flow 4: Training & Attendance Management
- **Vai trò áp dụng:** `Coach, System`
- **Chức năng / Màn hình liên quan:** `COA-05, COA-06, MEM-18, MEM-19`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Huấn luyện viên trực tiếp mở danh sách lớp học hoặc ca PT phụ trách để điểm danh từng học viên theo đúng 3 trạng thái: (1) Có mặt (Present): Hệ thống tự động trừ 1 buổi của nguồn quyền lợi đang giữ (quota VIP, gói PT riêng hoặc khóa lớp), cập nhật tiến độ học tập (vd 1/12), tự sinh giao dịch 0đ đối soát. Buổi học trả tiền lẻ chỉ cập nhật trạng thái có mặt mà không trừ quota; (2) Vắng có xin phép (Excused Absence - đã hủy/báo vắng trước hạn quy định hoặc buổi học bị dời/hoãn): Hệ thống tự động cộng lại 1 buổi/quota vào số dư khả dụng của gói như chưa từng dùng để học viên đăng ký lại trong thời hạn gói. Đối với khách trả tiền lẻ, hệ thống tự động tạo yêu cầu hoàn tiền; (3) Vắng không xin phép (Unexcused Absence / No-show): Hệ thống vẫn khấu trừ 1 buổi/quota của gói như một buổi đã học bình thường.

---

### BR-20: Phân cấp Thẩm quyền & Quy tắc Tính lại Quota khi Sửa điểm danh (Attendance Correction Rights & Quota Recomputation)
- **Phân hệ / Luồng nghiệp vụ:** Flow 4: Training & Attendance Management
- **Vai trò áp dụng:** `Coach, Receptionist, Manager, Member, System`
- **Chức năng / Màn hình liên quan:** `MEM-19, MEM-26, REC-26, COA-05, COA-06, MGR-17, MGR-25`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Quy định phân quyền chỉnh sửa điểm danh/check-in: Coach có quyền tạo mới và chỉnh sửa điểm danh cho các lớp/ca PT do chính mình phụ trách; Receptionist chỉ có quyền chỉnh sửa điểm danh khi tiếp nhận báo vắng hoặc khiếu nại sai sót từ khách hàng (Lễ tân KHÔNG được tạo mới điểm danh lớp/PT); Center Manager có toàn quyền tạo mới và chỉnh sửa điểm danh cho tất cả các lớp/ca PT trong toàn hệ thống; Member chỉ có quyền XEM (Read-only), tuyệt đối không có quyền can thiệp dữ liệu điểm danh (Member có quyền gửi khiếu nại phản ánh sai lệch trong thời hạn tối đa 7 ngày kể từ buổi học). Quy tắc tính toán lại Quota khi sửa: Sửa giữa 'Có mặt' <-> 'Vắng không phép': Số dư quota không thay đổi (đều đã trừ 1 buổi); Sửa từ 'Vắng có phép' sang 'Có mặt' hoặc 'Vắng không phép': Khấu trừ thêm 1 buổi. Nếu số dư quota của khách không đủ, Coach và Lễ tân sẽ bị hệ thống CHẶN không cho sửa; chỉ riêng Manager mới có quyền ép sửa (buộc chấp nhận quota âm và ghi Audit Log mức ERROR); Sửa từ 'Có mặt' hoặc 'Vắng không phép' sang 'Vắng có phép': Hoàn trả lại 1 buổi/quota cho khách, TRỪ TRƯỜNG HỢP gói tập đã hết hạn tại thời điểm sửa (khi gói đã hết hạn, hệ thống chặn hoàn quota cho tất cả các vai trò, kể cả Manager).

---

### BR-21: Quy trình Sinh Kế hoạch Tập luyện Cá nhân hóa bằng AI (AI Workout Plan Generation Workflow)
- **Phân hệ / Luồng nghiệp vụ:** Flow 5: AI Workout Recommendation
- **Vai trò áp dụng:** `Coach, AI System`
- **Chức năng / Màn hình liên quan:** `MEM-05, COA-07, COA-11, MGR-15`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Tính năng hỗ trợ Huấn luyện viên tạo nhanh giáo án tập luyện: HLV lựa chọn học viên và nạp dữ liệu hồ sơ thể trạng (mục tiêu tập luyện, trình độ Beginner/Amateur, chỉ số cơ thể BMI/cơ/mỡ, tiền sử chấn thương PAR-Q và lịch sử tập luyện gần nhất). Mô-đun AI phân tích dữ liệu và tự động sinh bản thảo kế hoạch tập luyện cá nhân hóa (danh sách bài tập, số sets, số reps, thời gian nghỉ và khuyến nghị cường độ).

---

### BR-22: Cơ chế Kiểm duyệt & Lưu trữ Giáo án của Huấn luyện viên (Coach Review & Plan Approval Gate)
- **Phân hệ / Luồng nghiệp vụ:** Flow 5: AI Workout Recommendation
- **Vai trò áp dụng:** `Coach, Member, System`
- **Chức năng / Màn hình liên quan:** `MEM-20, COA-07, COA-11`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Kế hoạch do AI sinh ra chỉ đóng vai trò là Bản thảo gợi ý (Draft). Huấn luyện viên chịu trách nhiệm kiểm tra chuyên môn, điều chỉnh khối lượng bài tập cho phù hợp với thực tế và bấm nút 'Lưu / Phê duyệt'. Tuyệt đối không hiển thị kế hoạch nháp của AI lên ứng dụng của Member. Chỉ sau khi Huấn luyện viên chính thức xác nhận lưu giáo án, hệ thống mới cập nhật và hiển thị kế hoạch vào màn hình tập luyện cá nhân của Member (MEM-20).

---

### BR-23: Phạm vi Hoạt động, An toàn & Cơ chế Chuyển tiếp của Trợ lý ảo AI (AI Assistant Boundary, Guardrails & Fallback)
- **Phân hệ / Luồng nghiệp vụ:** Flow 6: AI Assistant
- **Vai trò áp dụng:** `Member, AI Assistant, Receptionist, Manager`
- **Chức năng / Màn hình liên quan:** `MEM-24, MEM-26, REC-22, MGR-15`
- **Nội dung quy tắc & Điều kiện xử lý:**

  > Trợ lý ảo AI (Chatbot) hoạt động 24/7 phục vụ Member giải đáp thắc mắc về: nội quy trung tâm, thời khóa biểu lớp học, thông tin các gói dịch vụ, giá thuê sân và hướng dẫn kỹ thuật các bài tập cơ bản dựa trên bộ tri thức (System Prompt & KB) do Manager cấu hình tại MGR-15. Cơ chế an toàn (Guardrails) & Chuyển tiếp (Fallback): AI không có quyền can thiệp vào cơ sở dữ liệu (không tự ý đặt sân, hủy lịch, thanh toán hay chỉnh sửa thông tin tài khoản). Đối với các câu hỏi nằm ngoài phạm vi tri thức, các khiếu nại về tiền bạc, sự cố điểm danh hoặc yêu cầu kỹ thuật chuyên sâu, AI bắt buộc phải từ chối lịch sự và hướng dẫn hội viên tạo phiếu yêu cầu hỗ trợ (MEM-26) hoặc liên hệ trực tiếp bàn Lễ tân để được nhân viên xử lý.

---
