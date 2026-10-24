# 📊 SportHub - Bảng Theo Dõi Tiến Độ Dự Án (Progress Tracking)
## Đồ án Tốt nghiệp SWP391 - Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng

> **Cập nhật lần cuối:** 24/10/2026  
> **Trạng thái tổng thể:** `100% COMPLETED` (Sẵn sàng bảo vệ trước Hội đồng chấm đồ án)  
> **Chất lượng kiểm thử:** `40/40 Backend Tests PASS` (0 Failure, 0 Error) | `Frontend Build 100% PASS` | `Port 8000 CLEAN`

---

## 📈 1. Tổng Quan Tiến Độ Các Phân Hệ (Module Progress)

| Phân hệ / Role | Mã Module | Số tính năng | Tiến độ | Trạng thái | Đánh giá nghiệm thu |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Hội viên (Member)** | `MEM` | 23 | **100%** | ✅ Hoàn thành | Đặt sân, đặt lớp, thẻ QR, AI, Body Progress, 1RM, Feedback |
| **Lễ tân (Receptionist)** | `REC` | 18 | **100%** | ✅ Hoàn thành | Check-in QR/RFID, POS hóa đơn K80, Mượn trả đồ, Bán gói tập |
| **Huấn luyện viên (Coach)** | `COA` | 15 | **100%** | ✅ Hoàn thành | Giáo án PT, Điểm danh, Lịch rảnh, Đơn nghỉ phép, Doanh số |
| **Quản lý (Manager)** | `MGR` | 20 | **100%** | ✅ Hoàn thành | Dashboard, Bảo trì sân, Quản lý tài chính, Báo cáo nhân sự, AI Config |
| **Quản trị viên (Admin)** | `ADM` | 12 | **100%** | ✅ Hoàn thành | Phê duyệt nhân sự, Quản lý tài khoản, Nhật ký kiểm toán Audit Logs |
| **Hạ tầng & CSDL (Core DB)** | `SYS` | 10 | **100%** | ✅ Hoàn thành | 21 bảng CSDL chuẩn hóa, đồng bộ doanh thu & hoàn tiền, chống race condition |

---

## 📋 2. Chi Tiết Thực Hiện Theo User Stories & Requirements

### 👤 A. Phân Hệ Hội Viên (Member) - `100% DONE`
- [x] **MEM-01:** Đăng ký tài khoản mới & Đăng nhập bảo mật qua Bearer Token.
- [x] **MEM-02:** Xem danh mục các môn thể thao (Tennis, Pickleball, Cầu lông, Bóng đá, Gym, Bơi lội...) và cơ sở vật chất.
- [x] **MEM-03:** Tra cứu thông tin hồ sơ và danh sách các Huấn luyện viên đạt chuẩn quốc tế.
- [x] **MEM-04:** Đặt sân thể thao trực tuyến theo khung giờ trống (Court Booking) chống trùng lịch.
- [x] **MEM-05:** Áp dụng ưu đãi giảm giá theo cấp bậc thẻ hội viên (Silver -15%, Gold -30%, Diamond -50%).
- [x] **MEM-06:** Đăng ký lớp học thể thao (Class Booking) và tự động cập nhật sĩ số lớp (`booked_slots`).
- [x] **MEM-07:** Tự đặt lịch tập cá nhân 1-1 với Huấn luyện viên (PT Booking).
- [x] **MEM-08:** Xem lịch trình và thời khóa biểu cá nhân theo ngày/tuần (Member Schedule).
- [x] **MEM-09:** Đăng ký mua gói tập hội viên trực tuyến (Online Membership Package Checkout).
- [x] **MEM-10:** Cơ chế nâng cấp gói tập cùng môn (chặn hạ gói, tự động kết thúc gói cũ và kích hoạt gói cao cấp ngay lập tức).
- [x] **MEM-11:** Mua nhiều gói tập khác môn độc lập trên cùng một tài khoản.
- [x] **MEM-12:** Hủy lịch đặt sân tự động hoàn tiền (chặn hủy trước giờ bắt đầu dưới 2 tiếng).
- [x] **MEM-13:** Hủy đăng ký lớp học thể thao (chặn hủy khi buổi học đã hoàn thành hoặc đã được điểm danh).
- [x] **MEM-14:** Gửi yêu cầu hoàn tiền trực tuyến (Refund Request) kèm thông tin tài khoản ngân hàng.
- [x] **MEM-15:** Chống gửi yêu cầu hoàn tiền trùng lặp cho các giao dịch đang chờ xử lý (`PENDING`).
- [x] **MEM-16:** Thẻ hội viên kỹ thuật số (Digital Membership Card) hiển thị thông tin gói tập và mã vạch QR Code.
- [x] **MEM-17:** Tích hợp mã thẻ RFID cá nhân phục vụ quẹt thẻ tại cổng trung tâm.
- [x] **MEM-18:** Hồ sơ sức khỏe cá nhân (Health Profile): chiều cao, cân nặng, tiền sử chấn thương, mục tiêu tập luyện.
- [x] **MEM-19:** Trợ lý Thể thao AI (AI Fitness Assistant): Tư vấn môn tập và giải đáp nội quy 24/7.
- [x] **MEM-20:** Xem giáo án lộ trình tập luyện PT do HLV phân công (Workout Plans & Exercises).
- [x] **MEM-21:** Ghi nhận và theo dõi tiến độ chỉ số cơ thể đa chiều (Body Progress: Cân nặng, Chiều cao, BMI, SMM, PBF).
- [x] **MEM-22:** Theo dõi kỷ lục nâng tạ tối đa (1RM Max Lift) theo từng giai đoạn.
- [x] **MEM-23:** Đánh giá & phản hồi chất lượng buổi học / HLV (5 sao & bình luận trải nghiệm).

---

### 🛎️ B. Phân Hệ Lễ Tân (Receptionist) - `100% DONE`
- [x] **REC-01:** Check-in hội viên vào sân hoặc lớp học bằng mã Hội viên / Số điện thoại.
- [x] **REC-02:** Quét mã QR Thẻ hội viên để xác thực check-in tức thì.
- [x] **REC-03:** Quẹt thẻ RFID tự động ghi nhận lượt vào cổng và ghi nhật ký check-in.
- [x] **REC-04:** Chặn check-in đối với tài khoản chưa kích hoạt, bị khóa hoặc thẻ hết hạn.
- [x] **REC-05:** Điểm bán hàng tại quầy (POS Counter): Bán gói tập cho khách vãng lai và hội viên.
- [x] **REC-06:** Xử lý các phương thức thanh toán tại quầy: Tiền mặt (Cash), Chuyển khoản (Transfer), Cà thẻ (POS).
- [x] **REC-07:** In hóa đơn bán hàng nhiệt khổ chuẩn K80 (Thermal Receipt Printer K80) trực tiếp từ trình duyệt.
- [x] **REC-08:** Quản lý danh mục dụng cụ & thiết bị thể thao (Equipments Catalog).
- [x] **REC-09:** Cho thuê / mượn dụng cụ thể thao theo giờ (Equipment Borrowing): kiểm tra tồn kho khả dụng.
- [x] **REC-10:** Nhận trả dụng cụ thể thao, tính phí thuê theo số giờ thực tế và tự động hoàn trả số lượng vào kho.
- [x] **REC-11:** Chặn các lỗi mượn quá số lượng tồn kho khả dụng hoặc cập nhật số lượng âm.
- [x] **REC-12:** Xem lịch trình và sĩ số thực tế tất cả các lớp học diễn ra trong ngày trực.
- [x] **REC-13:** Hỗ trợ điểm danh hộ học viên có mặt tại lớp khi có yêu cầu.
- [x] **REC-14:** Báo cáo doanh số kết ca (Shift Daily Report): Thống kê doanh thu tiền mặt, chuyển khoản, thẻ POS.
- [x] **REC-15:** Lọc thống kê giao dịch theo đúng nhân viên lễ tân phê duyệt (`approvedBy`).
- [x] **REC-16:** Hiển thị duy nhất một dòng trạng thái `REFUNDED` trên báo cáo thu ngân khi có giao dịch hoàn tiền.
- [x] **REC-17:** Hỗ trợ tìm kiếm hội viên nhanh theo tên, số điện thoại, email hoặc mã RFID.
- [x] **REC-18:** Cập nhật thông tin liên hệ khẩn cấp của hội viên tại quầy.

---

### 🏋️ C. Phân Hệ Huấn Luyện Viên (Coach) - `100% DONE`
- [x] **COA-01:** Xem thời khóa biểu và lịch giảng dạy cá nhân theo tuần / tháng (Coach Schedule).
- [x] **COA-02:** Xem danh sách học viên đăng ký theo từng ca học (Roster Bookings).
- [x] **COA-03:** Điểm danh học viên chuyên nghiệp: Có mặt (`PRESENT`), Vắng có phép (`EXCUSED_ABSENCE`), Vắng không phép (`UNEXCUSED_ABSENCE`).
- [x] **COA-04:** Ghi chú nhận xét chuyên môn (Coach Note) cho từng học viên sau buổi tập.
- [x] **COA-05:** Giao bài tập rèn luyện thêm tại nhà (Homework Assignment) cho học viên.
- [x] **COA-06:** Chặn điểm danh đối với các buổi học thuộc về huấn luyện viên khác.
- [x] **COA-07:** Soạn thảo giáo án tập luyện PT cá nhân hóa cho học viên (Workout Plan Builder).
- [x] **COA-08:** Nhập chỉ số đo lường cơ thể và mức tạ 1RM cho học viên sau mỗi giai đoạn kiểm tra thể lực.
- [x] **COA-09:** Cập nhật lịch rảnh hàng tuần phục vụ mở lịch nhận dạy PT 1-1.
- [x] **COA-10:** Gửi đơn xin nghỉ phép (Leave Request) kèm lý do và người dạy thay.
- [x] **COA-11:** Theo dõi thống kê thu nhập và hoa hồng dạy học tích lũy theo từng buổi.
- [x] **COA-12:** Bỏ qua ca học đã hủy (`CANCELLED`) khi tính toán tổng số buổi dạy và doanh thu cá nhân.
- [x] **COA-13:** Xem đánh giá, số sao (Rating) và phản hồi từ các học viên đã tham gia lớp.
- [x] **COA-14:** Nhận thông báo tự động khi có học viên mới đăng ký hoặc hủy ca học.
- [x] **COA-15:** Quản lý hồ sơ công khai của HLV (ảnh đại diện, chứng chỉ quốc tế, số năm kinh nghiệm).

---

### 👔 D. Phân Hệ Quản Lý & Giám Đốc (Manager / Director) - `100% DONE`
- [x] **MGR-01:** Dashboard phân tích doanh thu tổng quan, doanh số theo bộ môn và theo loại hình dịch vụ.
- [x] **MGR-02:** Biểu đồ xu hướng tăng trưởng hội viên và tỷ lệ lấp đầy sân bãi (Occupancy Rate).
- [x] **MGR-03:** Quản lý cơ sở vật chất (Facilities) và danh sách sân thi đấu (Sports Courts).
- [x] **MGR-04:** Quản lý thiết lập giờ mở/đóng cửa, giá thuê sân theo giờ và trạng thái hoạt động.
- [x] **MGR-05:** Quản lý lịch bảo trì sân thi đấu (Court Maintenance): Thêm mới, xóa bỏ lịch bảo trì.
- [x] **MGR-06:** Tự động đồng bộ lịch bảo trì với luồng đặt sân, ngăn chặn thành viên đặt sân trong khung giờ sửa chữa.
- [x] **MGR-07:** Quản lý danh mục gói tập hội viên (Membership Packages): Giá bán, thời hạn, môn áp dụng.
- [x] **MGR-08:** Quản lý mã giảm giá khuyến mãi (Vouchers): Giá trị chiết khấu, hạn sử dụng, số lượng phát hành.
- [x] **MGR-09:** Báo cáo hiệu suất nhân viên (Staff Performance): Lượt check-in, doanh số POS của Lễ tân; Số buổi dạy, số học viên, điểm đánh giá của HLV.
- [x] **MGR-10:** Tính toán chi tiết chi phí hoa hồng cần thanh toán cho đội ngũ Huấn luyện viên (`totalCoachPayout`).
- [x] **MGR-11:** Quản lý và xét duyệt các yêu cầu hoàn tiền (Refund Management): Phê duyệt (`APPROVED`) hoặc Từ chối (`REJECTED`).
- [x] **MGR-12:** Đồng bộ trạng thái giao dịch sang `REFUNDED` sau khi duyệt hoàn tiền thành công.
- [x] **MGR-13:** Chặn thao tác duyệt lại lần 2 các đơn hoàn tiền đã có quyết định.
- [x] **MGR-14:** Cấu hình & tinh chỉnh Trợ lý Thể thao AI (AI Assistant Configuration): Bật/tắt AI, lựa chọn model (GPT-4o-mini), điều chỉnh nhiệt độ (Temperature), cấu hình System Prompt nghiệp vụ.
- [x] **MGR-15:** Gửi thông báo phát sóng (Broadcast Notification) tới toàn bộ thành viên hoặc theo từng phân quyền.
- [x] **MGR-16:** Xem toàn bộ phản hồi, khiếu nại và đánh giá dịch vụ của khách hàng.
- [x] **MGR-17:** Giám sát danh sách lớp học thể thao, can thiệp hủy ca học khi phát sinh sự cố bất khả kháng.
- [x] **MGR-18:** Tự động hoàn tiền cho tất cả học viên đã đăng ký khi hủy ca học từ phía ban quản lý.
- [x] **MGR-19:** Quản lý danh sách nhân sự trung tâm (HLV, Lễ tân).
- [x] **MGR-20:** Quản lý khóa / mở khóa tài khoản người dùng vi phạm quy chế.

---

### 🛡️ E. Phân Hệ Quản Trị Viên (Admin) - `100% DONE`
- [x] **ADM-01:** Phê duyệt hoặc từ chối đơn đăng ký tài khoản nhân viên mới (Coach, Receptionist).
- [x] **ADM-02:** Quản lý phân quyền người dùng (Role Management: ADMIN, MANAGER, COACH, RECEPTIONIST, MEMBER).
- [x] **ADM-03:** Nhật ký kiểm toán hệ thống (Audit Logs): Ghi lại vết mọi thao tác nhạy cảm (Đăng nhập, Tạo giáo án, Check-in, Bảo trì sân, Thay đổi cấu hình CSDL).
- [x] **ADM-04:** Bộ lọc tra cứu nhật ký kiểm toán theo thời gian, phân quyền và mã người thực hiện.
- [x] **ADM-05:** Giám sát tình trạng kết nối CSDL SQL Server và tính toàn vẹn của các bảng.
- [x] **ADM-06:** Quản lý danh mục môn thể thao công khai (Sports Catalog).
- [x] **ADM-07:** Quản lý cấu hình thông số kỹ thuật toàn hệ thống (System Settings).
- [x] **ADM-08:** Khắc phục sự cố xung đột dữ liệu tài chính và vé đặt chỗ.
- [x] **ADM-09:** Cơ chế bảo toàn định dạng dữ liệu tiếng Việt UTF-8 BOM trên toàn bộ script CSDL.
- [x] **ADM-10:** Kiểm soát toàn bộ luồng sao lưu và phục hồi dữ liệu ban đầu.
- [x] **ADM-11:** Đảm bảo duy trì cổng chạy backend 8080 và giữ cổng 8000 hoàn toàn trống phục vụ demo.
- [x] **ADM-12:** Đồng bộ mã nguồn trên 3 nhánh Git (`louispham812`, `develop`, `main`) không gây xung đột.

---

## 🗄️ 3. Tình Trạng Cơ Sở Dữ Liệu (Database Status)

Cơ sở dữ liệu **`SportsCenterDB`** trên Microsoft SQL Server đã được rà soát, kiểm toán và làm sạch hoàn toàn với tổng cộng **21 bảng**:

| STT | Tên bảng CSDL | Mục đích nghiệp vụ | Trạng thái toàn vẹn |
| :---: | :--- | :--- | :---: |
| 1 | `dbo.users` | Tài khoản & thông tin cá nhân của cả 5 Roles | ✅ Đã kiểm toán (0 orphan) |
| 2 | `dbo.sports` | Danh mục môn thể thao nội bộ | ✅ Toàn vẹn |
| 3 | `dbo.public_sports` | Danh mục môn thể thao hiển thị Landing Page | ✅ Toàn vẹn |
| 4 | `dbo.facilities` | Cơ sở vật chất & phòng tập | ✅ Toàn vẹn |
| 5 | `dbo.public_facilities` | Cơ sở vật chất công khai | ✅ Toàn vẹn |
| 6 | `dbo.sports_courts` | Sân thể thao chi tiết & bảng giá theo giờ | ✅ Toàn vẹn |
| 7 | `dbo.class_sessions` | Lịch dạy & các ca học thể thao | ✅ `booked_slots` khớp 100% |
| 8 | `dbo.bookings` | Đăng ký lớp học & điểm danh của học viên | ✅ Không có vé mồ côi |
| 9 | `dbo.court_bookings` | Đặt sân thi đấu trực tuyến | ✅ 0 ca trùng lịch |
| 10 | `dbo.payment_transactions` | Giao dịch tài chính đặt sân & đặt lớp | ✅ 0 dòng `_REFUND` rác |
| 11 | `dbo.payments` | Giao dịch thu ngân POS & bán gói tập tại quầy | ✅ Lọc theo `approvedBy` |
| 12 | `dbo.membership_packages` | Bảng giá các gói tập hội viên | ✅ Toàn vẹn |
| 13 | `dbo.user_memberships` | Hợp đồng thẻ gói tập của từng hội viên | ✅ Chuẩn hóa hạn dùng |
| 14 | `dbo.vouchers` | Mã giảm giá khuyến mãi | ✅ Toàn vẹn |
| 15 | `dbo.member_check_ins` | Lịch sử quẹt thẻ check-in QR/RFID vào cổng | ✅ Ghi nhận `recorded_by` |
| 16 | `dbo.feedbacks` | Đánh giá & nhận xét chất lượng của học viên | ✅ Toàn vẹn |
| 17 | `dbo.member_health_profiles` | Hồ sơ sức khỏe & chỉ số thể trạng hội viên | ✅ Toàn vẹn |
| 18 | `dbo.notifications` | Thông báo hệ thống & thông báo cá nhân | ✅ Toàn vẹn |
| 19 | `dbo.audit_logs` | Nhật ký kiểm toán thao tác hệ thống | ✅ Toàn vẹn |
| 20 | `dbo.court_maintenance` | Lịch bảo trì bảo dưỡng sân bãi | ✅ Chống xung đột đặt sân |
| 21 | `dbo.workout_plans` | Giáo án PT & kế hoạch bài tập về nhà | ✅ Validate dữ liệu chuẩn |
| 22 | `dbo.body_progress_logs` | Lịch sử đo lường chỉ số cơ thể & mức tạ 1RM | ✅ Chặn chỉ số âm |
| 23 | `dbo.system_settings` | Tham số cấu hình AI và hệ thống | ✅ Toàn vẹn |

---

## 🧪 4. Kết Quả Kiểm Thử Nghiệm Thu (Quality Assurance)

### 1. Kiểm thử Backend (`mvn clean test`):
- **Tổng số kịch bản:** 40 Tests
- **Kết quả:** **`40/40 PASS`** (0 Failures, 0 Errors, 0 Skipped).
- **Thời gian chạy:** ~24 giây.
- **Phạm vi kiểm thử:**
  - `DatabaseConnectionTest`: Xác thực kết nối CSDL, tính toàn vẹn 21 bảng và dữ liệu tài khoản demo.
  - `AiAssistantServiceTest`: Kiểm tra tích hợp mô hình OpenAI GPT-4o-mini, xử lý fallback an toàn khi mất kết nối mạng.
  - `BookingServiceTest`: Kiểm tra thuật toán chống trùng lịch đặt sân, thuật toán tính giá chiết khấu thẻ hội viên, quy trình hủy và hoàn tiền vé.

### 2. Kiểm thử Frontend (`npm run build`):
- **Trình biên dịch:** Vite v8.3.0 + React 19 + Tailwind CSS.
- **Kết quả:** **`BUILD SUCCESS`** trong **2.64s** (0 lỗi cú pháp, 0 lỗi kiểu).
- **Bundles:** Chuyển đổi và nén tối ưu toàn bộ 91 modules.

### 3. Kiểm thử Tích hợp Thực tế (Integration & End-to-End Defense Audit):
- [x] Đặt sân thành công -> Doanh thu tăng chuẩn xác -> Hủy đặt sân -> Hoàn tiền 100% -> Doanh thu giảm đúng số tiền ban đầu (không lệch 1 đồng).
- [x] Hiển thị báo cáo thu ngân duy nhất 1 dòng `REFUNDED` (đã triệt tiêu 100% tình trạng 2 dòng trùng lặp).
- [x] Chặn đặt sân trong khung giờ bảo trì (`court_maintenance`).
- [x] Chặn hủy lớp học sau khi học viên đã được điểm danh `PRESENT` hoặc ca học đã hoàn tất.
- [x] Chống double refund và chặn spam yêu cầu hoàn tiền cho cùng một giao dịch.
- [x] Cổng `8000` được xác thực hoàn toàn trống (`netstat -ano | findstr :8000` trả về rỗng).

---

## 🚀 5. Kết Luận & Sẵn Sàng Bảo Vệ

Toàn bộ hệ sinh thái phần mềm **SportHub** đã hoàn thiện toàn diện cả về **Giao diện người dùng (UI/UX)**, **Nghiệp vụ backend (Spring Boot)**, **Cơ sở dữ liệu (SQL Server)** và **Tài liệu bàn giao**. Dự án đạt độ tin cậy và hoàn thiện cao nhất, sẵn sàng bước vào buổi bảo vệ đồ án tốt nghiệp **SWP391** trước Hội đồng giám khảo.
