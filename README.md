# 🏆 SportHub - Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng (SWP391)

> **SportHub (SWP391_SportsCenter)** là nền tảng quản trị và vận hành toàn diện cho trung tâm thể thao đa năng chuẩn quốc tế, hỗ trợ tối ưu quy trình quản lý sân bãi, lịch học thể thao, hội viên, bán hàng tại quầy (POS), in hóa đơn nhiệt K80, thẻ hội viên số QR/RFID, theo dõi tiến độ thể lực & 1RM, quản lý bảo trì sân, nhật ký kiểm toán (Audit Logs), và phân tích báo cáo doanh thu theo thời gian thực kết hợp Trợ lý Trí tuệ Nhân tạo (AI Assistant).

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![Backend Tests](https://img.shields.io/badge/JUnit%205-84%2F84%20Pass-success.svg)]()
[![E2E Tests](https://img.shields.io/badge/Playwright%20E2E-25%2F25%20Pass-success.svg)]()
[![Frontend](https://img.shields.io/badge/Frontend-Vite%20React%2019-blue.svg)]()
[![Database](https://img.shields.io/badge/Database-SQL%20Server%202019%2F2022-red.svg)]()
[![Project Status](https://img.shields.io/badge/Status-100%25%20Defense%20Ready-gold.svg)]()

---

## 📌 Mục Lục
1. [Giới Thiệu Dự Án](#-1-giới-thiệu-dự-án)
2. [Công Nghệ Sử Dụng (Tech Stack)](#-2-công-nghệ-sử-dụng-tech-stack)
3. [Cấu Trúc Thư Mục Dự Án](#-3-cấu-trúc-thư-mục-dự-án)
4. [Các Phân Quyền & Hệ Thống 31+ Tính Năng Hoàn Chỉnh](#-4-các-phân-quyền--hệ-thống-31-tính-năng-hoàn-chỉnh)
5. [Kiến Trúc Cơ Sở Dữ Liệu (Database Architecture)](#-5-kiến-trúc-cơ-sở-dữ-liệu-database-architecture)
6. [Tài Khoản Dùng Thử (Demo Accounts)](#-6-tài-khoản-dùng-thử-demo-accounts)
7. [Hướng Dẫn Khởi Chạy Dự Án (Setup Guide)](#-7-hướng-dẫn-khởi-chạy-dự-án-setup-guide)
8. [Kiểm Thử & Đảm Bảo Chất Lượng (Testing & Defense Audit)](#-8-kiểm-thử--đảm-bảo-chất-lượng-testing--defense-audit)
9. [Bảng Tiến Độ & Quy Trình Git](#-9-bảng-tiến-độ--quy-trình-git)

---

## 🌟 1. Giới Thiệu Dự Án

Trung tâm thể thao đa năng **SportHub** phục vụ các bộ môn đa dạng: Tennis, Pickleball, Bóng đá, Cầu lông, Bơi lội, Điền kinh, Bóng bàn, Gym & Thể hình... Ứng dụng cung cấp giải pháp chuyển đổi số toàn diện cho 5 nhóm đối tượng:
- **Hội viên (Member):** Tự đặt sân, đăng ký lớp học, thẻ hội viên số QR/RFID, theo dõi tiến độ cơ thể (Body Progress & 1RM), lộ trình tập luyện PT 1-1, nhận xét HLV, yêu cầu hoàn tiền và nhận tư vấn thông minh từ Trợ lý AI.
- **Lễ tân (Receptionist):** Check-in hội viên tức thì qua QR/RFID, điểm bán hàng tại quầy (POS) tích hợp in hóa đơn nhiệt chuẩn K80, cho thuê & quản lý kho thiết bị thể thao, bán & nâng cấp gói tập, báo cáo kết ca chuẩn xác.
- **Huấn luyện viên (Coach):** Quản lý lịch dạy, điểm danh học viên chuyên nghiệp (Có mặt, Vắng có phép/không phép), soạn thảo giáo án PT, ghi nhận chỉ số thể lực học viên, quản lý lịch rảnh, gửi đơn xin nghỉ phép và theo dõi thu nhập hoa hồng theo thời gian thực.
- **Quản lý (Manager):** Dashboard phân tích tài chính đa chiều, quản lý cơ sở vật chất & lịch bảo trì sân (Court Maintenance), quản lý gói tập & voucher, phê duyệt yêu cầu hoàn tiền trực tuyến, cấu hình tham số Trợ lý AI, báo cáo hiệu suất nhân viên.
- **Quản trị viên (Admin):** Phê duyệt tài khoản nhân viên mới, giám sát nhật ký kiểm toán hệ thống (Audit Logs), quản lý danh mục môn thể thao và thông số kỹ thuật toàn hệ thống.

📄 Chi tiết tài liệu kiến trúc:
- Kịch bản kiểm thử & Demo bảo vệ Final (25/25 E2E Tests, 7 Luồng): [`KICH_BAN_CHAM_FINAL.md`](./KICH_BAN_CHAM_FINAL.md)
- Bảng theo dõi tiến độ 100%: [`PROGRESS_TRACKING.md`](./PROGRESS_TRACKING.md)
- Sơ đồ thực thể kết nối: [`ERD.drawio.png`](./ERD.drawio.png) / [`update_ERD.drawio`](./update_ERD.drawio)
- Sơ đồ Use Case: [`Usecase diagram.jpg`](./Usecase%20diagram.jpg)
- Script CSDL chuẩn hóa: [`SportsCenterDB_Database.sql`](./SportsCenterDB_Database.sql)

---

## 💻 2. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Mô tả |
| :--- | :--- | :--- |
| **Backend Framework** | **Java 21**, **Spring Boot 4.1.1** | RESTful API, mô hình phân tầng Controller - Service - Repository |
| **Bảo mật & Phân quyền**| **Spring Security**, Bearer Token Authentication, BCrypt | Xác thực bảo mật, mã hóa mật khẩu, phân quyền 5 Roles |
| **ORM & Data Access** | **Spring Data JPA**, Hibernate 7 | Ánh xạ thực thể quan hệ, hỗ trợ pessimistic locking (`updlock`) |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** (MSSQL 2019/2022) | Lưu trữ quan hệ, toàn vẹn khóa ngoại, lưu trữ UTF-8 BOM |
| **Frontend Framework** | **React 19**, **Vite v8.3** | Single Page Application (SPA), HMR siêu tốc, tối ưu hóa bundle |
| **Giao diện & Styling** | **Tailwind CSS v3**, Lucide React | Giao diện hiện đại, responsive, hỗ trợ In hóa đơn nhiệt K80 |
| **Routing** | **React Router DOM v7** | Quản lý điều hướng và Route Guards bảo vệ theo vai trò |
| **Trí tuệ Nhân tạo** | **Google Gemini API** (`gemini-flash-lite-latest`) | Trợ lý tư vấn thể thao, gợi ý bài tập và giải đáp nghiệp vụ |
| **Testing & Linter** | **JUnit 5**, **Playwright E2E**, **Oxlint** | 84/84 Unit & Integration Tests Backend PASS, 25/25 Playwright E2E Tests PASS bao phủ 7 luồng nghiệp vụ |

---

## 📁 3. Cấu Trúc Thư Mục Dự Án

```
SWP391_SportsCenter/
├── backend/                               # Mã nguồn Backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sporthub/backend/
│   │   │   │   ├── config/                # Cấu hình Security, CORS, Application Beans
│   │   │   │   ├── controller/            # 10+ REST API Controllers (Booking, Engagement, Equipment...)
│   │   │   │   ├── dto/                   # Data Transfer Objects (Request/Response)
│   │   │   │   ├── entity/                # 20+ JPA Entities tương ứng 21 bảng CSDL
│   │   │   │   ├── repository/            # Spring Data JPA Repositories
│   │   │   │   ├── security/              # Bộ lọc xác thực Bearer Token
│   │   │   │   ├── service/               # Nghiệp vụ (AuthService, BookingService, AiAssistantService...)
│   │   │   │   └── BackendApplication.java # Entry point khởi chạy Spring Boot
│   │   │   └── resources/
│   │   │       ├── application.properties # Cấu hình database, port 8080, hibernate
│   │   │       └── schema.sql             # Tạo bảng & nạp dữ liệu mẫu tự động
│   │   └── test/                          # 84 Unit & Integration Tests (JUnit 5)
│   └── pom.xml                            # Quản lý dependencies Maven
│
├── frontend/                              # Mã nguồn Frontend (React + Vite)
│   ├── e2e/                               # 25 Kịch bản kiểm thử tự động Playwright E2E
│   ├── public/                            # Tài nguyên tĩnh
│   ├── src/
│   │   ├── components/                    # Navbar, Footer, Modal, Toast, In hóa đơn K80...
│   │   ├── context/                       # AuthContext, AppContext toàn cục
│   │   ├── pages/                         # Màn hình chuyên biệt theo 5 Roles:
│   │   │   ├── admin/                     # Quản trị viên: Phê duyệt nhân sự, Audit Logs, Settings
│   │   │   ├── manager/                   # Quản lý: Dashboard, Bảo trì sân, Quản lý tài chính, AI Config
│   │   │   ├── coach/                     # HLV: Lịch dạy, Điểm danh, Giáo án PT, Lịch rảnh, Nghỉ phép
│   │   │   ├── receptionist/              # Lễ tân: Check-in QR/RFID, Quầy POS, Mượn đồ, Báo cáo ca
│   │   │   ├── member/                    # Hội viên: Đặt sân, Đặt lớp, Thẻ QR, Body Progress, Feedback
│   │   │   ├── AuthPage.jsx               # Đăng nhập / Đăng ký
│   │   │   └── LandingPage.jsx            # Trang chủ trung tâm thể thao
│   │   ├── services/                      # Axios API Client & Public Content Services
│   │   ├── App.jsx                        # Routing & Route Guards
│   │   └── main.jsx                       # Entry point React
│   ├── package.json                       # Dependencies Frontend
│   └── vite.config.js                     # Cấu hình Vite
│
├── SportsCenterDB_Database.sql            # Script SQL Server 21 bảng (chuẩn UTF-8 BOM)
├── KICH_BAN_CHAM_FINAL.md                 # Kịch bản kiểm thử & demo bảo vệ Final (25/25 E2E, 7 luồng)
├── PROGRESS_TRACKING.md                   # Bảng theo dõi tiến độ chi tiết 100%
└── README.md                              # Tài liệu hướng dẫn dự án
```

---

## 🎯 4. Các Phân Quyền & Hệ Thống 31+ Tính Năng Hoàn Chỉnh

### 1. 👤 Phân Hệ Hội Viên (Member)
1. **Đăng ký / Đăng nhập bảo mật:** Xác thực Token, lưu trữ phiên làm việc an toàn.
2. **Khám phá dịch vụ:** Xem danh mục các môn thể thao, cơ sở vật chất, bảng giá và đội ngũ HLV.
3. **Đặt sân trực tuyến (Court Booking):** Chọn khung giờ trống (time slot), chống trùng lịch bằng cơ chế khóa bi quan (`Pessimistic Locking`).
4. **Ưu đãi thành viên:** Tự động chiết khấu giá đặt sân và đặt lớp theo cấp thẻ hội viên (Silver -15%, Gold -30%, Diamond -50%).
5. **Đăng ký lớp học (Class Booking):** Lựa chọn lớp học yêu thích, tự động cập nhật sĩ số (`booked_slots`).
6. **Đặt lịch tập riêng với PT (PT 1-1 Booking):** Chọn HLV chuyên nghiệp và khung giờ tập luyện riêng biệt.
7. **Thời khóa biểu cá nhân (Member Schedule):** Xem lịch đặt sân và lịch học theo ngày/tuần, lọc trạng thái xác nhận / hủy.
8. **Hủy đặt sân & Hủy lớp học:** Tự động hoàn tiền vào giao dịch gốc; chặn hủy sân trước giờ bắt đầu dưới 2 tiếng; chặn hủy lớp khi đã điểm danh `PRESENT` hoặc lớp đã hoàn tất.
9. **Thẻ hội viên kỹ thuật số (Digital Membership Card):** Tích hợp mã vạch QR Code và mã RFID cá nhân phục vụ check-in tự động tại quầy/cổng.
10. **Quản lý gói tập hội viên:** Mua mới, gia hạn hoặc nâng cấp lên gói cao cấp hơn; hỗ trợ sở hữu nhiều gói tập khác môn đồng thời.
11. **Hồ sơ sức khỏe (Health Profile):** Quản lý chiều cao, cân nặng, mục tiêu rèn luyện và tiền sử chấn thương.
12. **Theo dõi tiến độ cơ thể (Body Progress):** Lưu trữ lịch sử đo lường chỉ số thể trạng (Cân nặng, Chiều cao, BMI, SMM - Khối lượng cơ xương, PBF - Tỷ lệ mỡ cơ thể).
13. **Kỷ lục mức tạ (1RM Max Lift):** Ghi nhận mức tạ tối đa 1RM theo từng bài tập chính (Squat, Bench Press, Deadlift).
14. **Xem giáo án lộ trình PT (Workout Plans):** Xem kế hoạch tập luyện, nhận xét chuyên môn của HLV và bài tập về nhà (Homework).
15. **Trợ lý Thể thao AI (AI Fitness Assistant):** Tư vấn lịch tập, gợi ý môn thể thao phù hợp dựa trên thể trạng và giải đáp thắc mắc 24/7.
16. **Đánh giá & Phản hồi (Feedback & Reviews):** Chấm điểm 5 sao và viết nhận xét cho HLV sau khi tham gia buổi học.
17. **Yêu cầu hoàn tiền trực tuyến (Refund Request):** Gửi đơn yêu cầu hoàn tiền kèm thông tin số tài khoản ngân hàng; chống spam gửi trùng lặp đơn.
18. **Trung tâm thông báo (Notifications Center):** Nhận thông báo thời gian thực về lịch học, cập nhật điểm danh và tin tức trung tâm.

### 2. 🛎️ Phân Hệ Lễ Tân (Receptionist)
19. **Check-in đa phương thức:** Check-in nhanh qua số điện thoại, quét mã QR Thẻ hội viên hoặc quẹt thẻ từ RFID.
20. **Điểm bán hàng tại quầy (POS):** Đăng ký hội viên mới, bán gói tập, thanh toán Tiền mặt / Chuyển khoản / Cà thẻ POS.
21. **In hóa đơn nhiệt chuẩn K80:** Tạo và in phiếu thu hóa đơn bán lẻ trực tiếp từ trình duyệt theo khổ giấy in nhiệt K80 (80mm).
22. **Quản lý mượn/trả dụng cụ (Equipment Loans):** Cho thuê vợt, bóng, thiết bị thể thao; kiểm tra tồn kho khả dụng; tự động hoàn trả số lượng khi khách trả đồ; tính phí thuê theo giờ.
23. **Giám sát lớp học trong ca trực:** Theo dõi danh sách các lớp diễn ra trong ngày, kiểm tra sĩ số học viên thực tế.
24. **Báo cáo kết ca (Daily Shift Report):** Thống kê tổng số lượt check-in, số đơn hàng POS, phân tách doanh thu theo từng phương thức thanh toán và từng nhân viên phụ trách (`approvedBy`).

### 3. 🏋️ Phân Hệ Huấn Luyện Viên (Coach)
25. **Thời khóa biểu giảng dạy:** Xem lịch dạy theo tuần/tháng, xem danh sách học viên đăng ký theo từng ca.
26. **Điểm danh học viên chuyên nghiệp:** Đánh dấu trạng thái: Có mặt (`PRESENT`), Vắng có phép (`EXCUSED_ABSENCE`), Vắng không phép (`UNEXCUSED_ABSENCE`).
27. **Soạn thảo giáo án PT (Workout Plan Builder):** Thiết lập bài tập chi tiết, ghi nhận kết quả buổi tập và giao bài tập về nhà cho học viên.
28. **Nhập chỉ số thể lực cho học viên:** Đo lường và cập nhật chỉ số cân nặng, mỡ cơ thể, mức tạ 1RM cho học viên PT.
29. **Quản lý lịch rảnh & Đơn nghỉ phép:** Cập nhật khung giờ sẵn sàng nhận dạy; gửi đơn xin nghỉ phép kèm lý do.
30. **Thống kê thu nhập & hoa hồng:** Bảng theo dõi doanh thu tích lũy và số tiền hoa hồng được nhận theo từng buổi dạy (bỏ qua ca bị hủy).

### 4. 👔 Phân Hệ Quản Lý & Giám Đốc (Manager / Director)
31. **Dashboard điều hành thông minh:** Biểu đồ doanh thu trực quan, phân tích nguồn thu theo môn thể thao, tỷ lệ lấp đầy sân bãi.
32. **Quản lý lịch bảo trì sân (Court Maintenance):** Lập lịch bảo trì, tự động khóa khung giờ trên lịch đặt sân để chống xung đột đặt chỗ.
33. **Quản lý cơ sở vật chất, gói tập & voucher:** Thiết lập thông tin sân bãi, giá thuê theo giờ, danh mục gói tập và mã giảm giá.
34. **Xét duyệt hoàn tiền (Refund Management):** Phê duyệt hoặc từ chối các yêu cầu hoàn tiền của học viên; tự động cập nhật trạng thái giao dịch sang `REFUNDED`.
35. **Báo cáo hiệu suất nhân viên (Staff Performance):** Đánh giá hiệu suất Lễ tân (số lượt check-in, doanh số POS) và Huấn luyện viên (số buổi dạy, đánh giá trung bình, hoa hồng phải trả).
36. **Cấu hình Trợ lý AI (AI Config):** Bật/tắt AI, cấu hình model Gemini (`gemini-flash-lite-latest`), điều chỉnh Temperature và tùy biến System Prompt nghiệp vụ.
37. **Phát sóng thông báo (Broadcast Notification):** Gửi thông báo đại chúng tới toàn thể hội viên hoặc theo nhóm đối tượng.

### 5. 🛡️ Phân Hệ Quản Trị Viên (Admin)
38. **Phê duyệt nhân sự:** Phê duyệt đơn đăng ký của nhân viên mới (Coach, Receptionist) trước khi kích hoạt tài khoản.
39. **Nhật ký kiểm toán hệ thống (Audit Logs):** Ghi nhận chi tiết mọi hành vi nhạy cảm (Đăng nhập, Check-in, Bảo trì sân, Tạo giáo án, Thay đổi cấu hình) kèm IP/thời gian/người thực hiện.
40. **Quản trị người dùng & Phân quyền:** Quản lý danh sách tài khoản toàn hệ thống, khóa/mở khóa tài khoản khi có vi phạm.

---

## 🗄️ 5. Kiến Trúc Cơ Sở Dữ Liệu (Database Architecture)

Hệ thống cơ sở dữ liệu `SportsCenterDB` được chuẩn hóa toàn diện trên Microsoft SQL Server với **21 bảng vật lý**:

```
                       [ users ] (Tài khoản & Hồ sơ cá nhân - 5 Roles)
                          │
        ┌─────────────────┼───────────────────────────┬──────────────────────┐
        │                 │                           │                      │
 [ member_check_ins ] [ user_memberships ]    [ court_bookings ]       [ bookings ]
        │                 │                           │                      │
        │       [ membership_packages ]       [ sports_courts ]       [ class_sessions ]
        │                 │                           │                      │
        │           [ vouchers ]             [ court_maintenance ]   [ facilities / sports ]
        │                 │                           │                      │
 [ payments (POS) ] ──────┴─────── [ payment_transactions ] ─────────────────┘
        │
        ├──────────────────────┬──────────────────────┬──────────────────────┐
        │                      │                      │                      │
 [ workout_plans ]   [ body_progress_logs ]     [ feedbacks ]        [ notifications ]
        │                      │                      │                      │
  (Giáo án PT)       (Tiến độ cơ thể & 1RM)    (Đánh giá 5 sao)      (Thông báo hệ thống)
        │
 [ audit_logs ] ─────────────────────────────────────────────── [ system_settings ]
 (Nhật ký kiểm toán)                                            (Cấu hình AI & Hệ thống)
```

### Bảng tóm tắt 21 bảng CSDL:
1. `dbo.users`: Tài khoản và thông tin người dùng của cả 5 vai trò.
2. `dbo.sports` & `dbo.public_sports`: Danh mục các môn thể thao.
3. `dbo.facilities` & `dbo.public_facilities`: Cơ sở vật chất và khu vực luyện tập.
4. `dbo.sports_courts`: Danh sách sân thi đấu chi tiết, giờ mở/đóng cửa, giá thuê.
5. `dbo.court_bookings`: Lịch đặt sân của hội viên (chống trùng giờ bằng pessimistic lock).
6. `dbo.class_sessions`: Các ca học thể thao theo lịch trình.
7. `dbo.bookings`: Đăng ký lớp học và thông tin điểm danh học viên.
8. `dbo.payment_transactions`: Giao dịch tài chính thanh toán đặt sân và lớp học trực tuyến.
9. `dbo.payments`: Giao dịch quầy thu ngân (POS) do Lễ tân phê duyệt.
10. `dbo.membership_packages`: Bảng giá và chính sách các gói tập hội viên.
11. `dbo.user_memberships`: Hợp đồng gói tập của từng hội viên.
12. `dbo.vouchers`: Mã giảm giá khuyến mãi.
13. `dbo.member_check_ins`: Lịch sử quẹt thẻ check-in vào cổng (QR Code / RFID).
14. `dbo.feedbacks`: Đánh giá 5 sao và bình luận của học viên về buổi học/HLV.
15. `dbo.member_health_profiles`: Hồ sơ sức khỏe và tiền sử chấn thương của hội viên.
16. `dbo.notifications`: Thông báo hệ thống và thông báo cá nhân người dùng.
17. `dbo.audit_logs`: Nhật ký kiểm toán an toàn hệ thống.
18. `dbo.court_maintenance`: Lịch bảo trì bảo dưỡng sân thi đấu.
19. `dbo.workout_plans`: Giáo án lộ trình tập luyện PT và bài tập về nhà.
20. `dbo.body_progress_logs`: Lịch sử chỉ số đo lường cơ thể và kỷ lục mức tạ 1RM.
21. `dbo.system_settings`: Cấu hình tham số hệ thống và Trợ lý AI.

---

## 🔑 6. Tài Khoản Dùng Thử (Demo Accounts)

Cơ sở dữ liệu mẫu được nạp sẵn tài khoản đại diện cho cả **5 vai trò**. Mật khẩu mặc định: **`SportHub@123`**

| Vai trò (Role) | Họ và tên | Email đăng nhập | Mật khẩu mặc định | Ghi chú quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN / MANAGER** | Nguyễn Văn Quản Lý | `manager@sporthub.com` | `SportHub@123` | Quản trị toàn hệ thống, duyệt nhân sự, Audit Logs, AI Config |
| **MANAGER** | Trần Thị Giám Đốc | `director@sporthub.com` | `SportHub@123` | Giám đốc điều hành, báo cáo tài chính & doanh thu |
| **RECEPTIONIST** | Lê Thị Lễ Tân | `reception.le@sporthub.com` | `SportHub@123` | Lễ tân ca sáng: Check-in QR/RFID, Quầy POS, In hóa đơn K80 |
| **RECEPTIONIST** | Phạm Minh Tú | `reception.tu@sporthub.com` | `SportHub@123` | Lễ tân ca chiều: Quản lý thiết bị mượn trả, Báo cáo ca |
| **COACH** | Trần Văn Minh | `coach.minh@sporthub.com` | `SportHub@123` | HLV môn Tennis: Điểm danh, Soạn giáo án PT, Xem hoa hồng |
| **COACH** | Nguyễn Hoàng Nam | `coach.nam@sporthub.com` | `SportHub@123` | HLV môn Pickleball: Lịch dạy, Lịch rảnh, Đơn nghỉ phép |
| **COACH** | Võ Tấn Phát | `coach.phat@sporthub.com` | `SportHub@123` | HLV môn Bóng đá & Điền kinh |
| **COACH** | Đặng Thu Thảo | `coach.thao@sporthub.com` | `SportHub@123` | HLV môn Cầu lông & Bơi lội |
| **MEMBER** | Nguyễn Anh Khoa | `khoa.member@gmail.com` | `SportHub@123` | Hội viên VIP Diamond: Thẻ QR, Body Progress, 1RM, AI |
| **MEMBER** | Hoàng Thị Ngọc | `ngoc.hoang@gmail.com` | `SportHub@123` | Hội viên Thẻ Vàng (Gold) |
| **MEMBER** | Bùi Huy Hoàng | `hoang.bui@gmail.com` | `SportHub@123` | Hội viên tiêu chuẩn |

---

## 🚀 7. Hướng Dẫn Khởi Chạy Dự Án (Setup Guide)

### Yêu cầu tiên quyết:
- **Java JDK:** Phiên bản **21** trở lên.
- **Apache Maven:** Phiên bản **3.9+**.
- **Node.js:** Phiên bản **18.x / 20.x / 22.x** & **npm**.
- **Microsoft SQL Server:** Phiên bản 2019 / 2022 (Express hoặc Standard) chạy trên cổng `1433`.
- **Git** đã được cài đặt trên máy.

> ⚠️ **QUY TẮC CỔNG MẠNG (PORT ASSIGNMENT):**  
> - **Backend API:** Chạy cố định trên cổng **`8080`**.  
> - **Frontend Web:** Chạy trên cổng **`5173`**.  
> - **Cổng `8000`:** **TUYỆT ĐỐI GIỮ TRỐNG** (Dành riêng cho môi trường kiểm thử / demo tự động).

---

### Bước 1: Khởi tạo Cơ sở dữ liệu SQL Server

1. Mở **SQL Server Management Studio (SSMS)** và kết nối tới instance SQL Server của bạn (`localhost` hoặc `localhost\SQLEXPRESS`).
2. Mở file [`SportsCenterDB_Database.sql`](./SportsCenterDB_Database.sql) và thực thi (**F5**).  
   *Hoặc chạy dòng lệnh cmd với mã hóa tiếng Việt UTF-8:*
   ```bash
   sqlcmd -S localhost -U sa -P 12345 -f 65001 -i SportsCenterDB_Database.sql
   ```
3. Kiểm tra file cấu hình `backend/src/main/resources/application.properties`:
   ```properties
   server.port=8080
   spring.application.name=backend
   spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=SportsCenterDB;encrypt=false;trustServerCertificate=true
   spring.datasource.username=sa
   spring.datasource.password=12345
   spring.sql.init.mode=always
   ```
4. (Tùy chọn) Cấu hình Trợ lý AI Google Gemini trong file `.env` (tham khảo mẫu tại `.env.example`):
   ```properties
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-flash-lite-latest
   AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
   ```

---

### Bước 2: Khởi chạy Backend (Spring Boot API)

Mở Terminal thứ nhất tại thư mục dự án:
```bash
cd backend

# Chạy kiểm thử tự động
mvn clean test

# Khởi chạy server Backend trên cổng 8080
mvn spring-boot:run
```
> 🟢 **Backend API sẵn sàng tại:** `http://localhost:8080`  
> 🔗 **Root API:** `http://localhost:8080/api/v1`

---

### Bước 3: Khởi chạy Frontend (React + Vite)

Mở Terminal thứ hai:
```bash
cd frontend

# Cài đặt thư viện dependencies
npm install

# Kiểm tra build production
npm run build

# Khởi chạy máy chủ phát triển
npm run dev
```
> 🟢 **Giao diện Web sẵn sàng tại:** `http://localhost:5173`

---

## 🧪 8. Kiểm Thử & Đảm Bảo Chất Lượng (Testing & Defense Audit)

Hệ thống đã trải qua đợt **Tổng kiểm tra Logic Nghiệp vụ Toàn diện (End-to-End Defense Audit)** đạt tỷ lệ hoàn hảo:

1. **Backend Tests:** Đạt **`84/84 Tests PASS` (100%)**:
   - `DatabaseConnectionTest`: 5/5 PASS (Kiểm tra kết nối MSSQL, xác thực 21 bảng dữ liệu, kiểm tra tài khoản demo).
   - `AiAssistantServiceTest`: 4/4 PASS (Kiểm tra AI xử lý hội thoại, kiểm tra fallback thông minh).
   - `BookingServiceTest`: 11/11 PASS (Kiểm tra đặt sân chống trùng lịch, tính chiết khấu VIP, hoàn tiền vé).
   - 11 Test Suites mở rộng (Service, Security, Financial, Maintenance, POS, Audit): 64/64 PASS.
2. **Frontend Playwright E2E Tests:** Đạt **`25/25 Tests PASS` (100%)** bao phủ trọn vẹn **7 luồng nghiệp vụ liên thông**:
   - **Luồng 1:** Quản trị Gói tập & Voucher $\rightarrow$ Hội viên mua/nâng cấp gói $\rightarrow$ Admin duyệt kích hoạt.
   - **Luồng 2:** Đặt sân trực tuyến, áp chiết khấu thẻ VIP + Voucher, Hủy lịch hoàn tiền 100%.
   - **Luồng 3:** Khóa bảo trì sân thi đấu $\rightarrow$ Ngăn chặn xung đột đặt sân thời gian thực.
   - **Luồng 4:** Lễ tân POS bán gói tập $\rightarrow$ In hóa đơn nhiệt K80 $\rightarrow$ Mượn/Trả dụng cụ thể thao & Báo cáo kết ca.
   - **Luồng 5:** Lễ tân check-in QR / RFID $\rightarrow$ Xác thực thẻ số tức thì tại quầy.
   - **Luồng 6:** HLV điểm danh học viên $\rightarrow$ Soạn giáo án PT $\rightarrow$ Nhập Body Progress & 1RM $\rightarrow$ Xem hoa hồng.
   - **Luồng 7:** Quản lý duyệt hoàn tiền $\rightarrow$ Trợ lý AI tư vấn $\rightarrow$ Admin rà soát Audit Logs toàn hệ thống.
   - 📘 *Chi tiết kịch bản từng bước và hướng dẫn demo trước Hội đồng:* [`KICH_BAN_CHAM_FINAL.md`](./KICH_BAN_CHAM_FINAL.md)
3. **Frontend Build:** `npm run build` hoàn tất trong **2.64 giây** với **0 lỗi cú pháp / 0 lỗi kiểu**.
4. **Kiểm tra tính nhất quán tài chính:**
   - Triệt tiêu 100% hiện tượng 2 dòng hoàn tiền trùng lặp trên bảng báo cáo thu ngân.
   - Doanh thu quầy lễ tân được phân tách chính xác theo `approvedBy` của từng nhân viên.
   - Chặn tuyệt đối hành vi gian lận gửi đơn hoàn tiền trùng lặp (`PENDING`).
   - Tự động đồng bộ `booked_slots` của các lớp học với số lượng vé thực tế trong CSDL.

---

## 🌿 9. Bảng Tiến Độ & Quy Trình Git

- Bảng theo dõi tiến độ chi tiết từng User Story: [`PROGRESS_TRACKING.md`](./PROGRESS_TRACKING.md)
- **Quy tắc phân nhánh Git:**
  - Nhánh **`main`**: Nhánh phát hành ổn định, đã qua kiểm định nghiệm thu.
  - Nhánh **`develop`**: Nhánh tích hợp tính năng chung của nhóm.
  - Nhánh **`louispham812`**: Nhánh làm việc chính của Tech Lead / Core Developer.
  - Cả 3 nhánh luôn được duy trì trạng thái đồng bộ, sạch sẽ và không có xung đột mã nguồn.

---
*Dự án được xây dựng và hoàn thiện bởi nhóm sinh viên thực hiện đồ án tốt nghiệp **SWP391**.*
