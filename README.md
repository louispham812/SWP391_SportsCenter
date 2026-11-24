# 🏟️ SportHub — Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng (SWP391)

> **SportHub (`SWP391_SportsCenter`)** là đồ án môn học **SWP391**, xây dựng ứng dụng web hỗ trợ quản lý và vận hành trung tâm thể thao đa năng: đặt sân trực tuyến, đăng ký lớp học & PT 1-1, quản lý hạng hội viên & định mức Quota linh hoạt, thanh toán trực tuyến VNPay Sandbox, bán hàng tại quầy (POS) in hóa đơn nhiệt K80, mượn/trả dụng cụ thể thao, điểm danh huấn luyện viên, bảo trì sân bãi, xử lý ticket khiếu nại và thống kê doanh thu kết hợp Trợ lý AI.

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61DAFB?logo=react&logoColor=black)]()
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%203.4-06B6D4?logo=tailwind-css&logoColor=white)]()
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%204.1.2%20%2B%20Java%2021-6DB33F?logo=spring-boot&logoColor=white)]()
[![Database](https://img.shields.io/badge/Database-SQL%20Server-CC2927?logo=microsoft-sql-server&logoColor=white)]()

---

## 📑 Mục Lục
1. [Giới Thiệu Dự Án](#-1-giới-thiệu-dự-án)
2. [Công Nghệ Sử Dụng (Tech Stack)](#-2-công-nghệ-sử-dụng-tech-stack)
3. [Các Phân Hệ Chức Năng Chính](#-3-các-phân-hệ-chức-năng-chính)
4. [Cấu Trúc Thư Mục Dự Án](#-4-cấu-trúc-thư-mục-dự-án)
5. [Tài Khoản Dùng Thử (Demo Accounts)](#-5-tài-khoản-dùng-thử-demo-accounts)
6. [Hướng Dẫn Cài Đặt, Reset Database & Kiểm Thử](#-6-hướng-dẫn-cài-đặt-reset-database--kiểm-thử)

---

## 🌟 1. Giới Thiệu Dự Án

Trung tâm thể thao đa năng **F Sport Center (SportHub)** phục vụ **10 bộ môn thể thao** với **20 khu/phòng tập (`facilities`)** và **16 sân đặt lịch trực tuyến (`sports_courts`)**: Gym & Fitness, Pickleball, Tennis, Yoga & Pilates, Bóng đá, Cầu lông, Bóng chuyền, Bóng bàn, Bơi lội, Điền kinh. Ứng dụng phân tách thành **4 cổng nghiệp vụ** (kèm trang công khai cho Khách vãng lai):
- **Hội viên (`MEMBER` — `/member`):** Đặt sân/lớp/PT 1-1 theo khung giờ (ưu tiên khấu trừ Quota gói tập hoặc thanh toán VNPay Sandbox với giữ chỗ 10 phút), mua/gia hạn gói tập, theo dõi thẻ số QR/RFID động, xem lịch sử điểm danh/giao dịch, gửi yêu cầu hoàn tiền & ticket hỗ trợ (`/member/tickets`), cập nhật chỉ số cơ thể (BMI, SMM, PBF, 1RM), tick bài tập giáo án và chat với Trợ lý AI.
- **Lễ tân (`RECEPTIONIST` — `/receptionist`):** Check-in hội viên qua SĐT / QR / thẻ RFID, bán gói tập tại quầy (POS hỗ trợ `CASH` & `VNPAY`) kèm in hóa đơn nhiệt K80, tạo tài khoản hội viên/nhân sự tại quầy, quản lý mượn/trả dụng cụ thể thao tính phí theo giờ, ghi danh/hủy lớp hộ, tiếp nhận & phản hồi ticket khiếu nại (`/receptionist/tickets`), và xem **Báo cáo ca trực & doanh thu cá nhân** (cô lập chính xác các giao dịch Tiền mặt, VNPay và trả dụng cụ do chính lễ tân đó xử lý).
- **Huấn luyện viên (`COACH` — `/coach`):** Xem lịch dạy hàng tuần, khai báo khung giờ rảnh (hệ thống tự chặn tắt ca nếu đang trùng buổi dạy sắp tới), gửi đơn xin nghỉ phép/đổi ca, điểm danh học viên 3 trạng thái (`PRESENT`, `EXCUSED_ABSENCE`, `UNEXCUSED_ABSENCE`), soạn thảo giáo án cá nhân hóa bằng AI, ghi chỉ số thể lực cho học viên phụ trách, gửi thông báo lớp/học viên và theo dõi thu nhập hoa hồng (40%, tối thiểu `200.000đ`/buổi không hủy) & đánh giá sao.
- **Quản lý & Quản trị (`MANAGER` / `ADMIN` — `/admin`):** Dashboard điều hành theo kỳ (`Ngày` / `Tháng` / `Năm` / `Toàn thời gian`) với bảng giao dịch có cột **`Người xử lý`** (`processedByName`: tên lễ tân hoặc `Tự thanh toán`) và xuất CSV; quản lý sân bãi (`/admin/facilities`), lớp học nhóm (`/admin/classes`, `/admin/classes/new`) & bảo trì tự động khóa slot (`/admin/maintenance`); cấu hình gói tập & **hạng hội viên tùy chỉnh** + voucher (`/admin/packages`); Trung tâm Phê duyệt 4 hàng đợi (`/admin/staff-approvals`: nhân sự mới, kích hoạt gói tập, hoàn tiền VNPay/tiền mặt, nghỉ phép & đổi HLV dạy thay); quản lý tách biệt **Hội viên** (`/admin/members`) & **Nhân sự/KPI** (`/admin/staff`); xử lý khiếu nại (`/admin/tickets`), Broadcast thông báo, cấu hình chính sách/RBAC/AI (`/admin/settings`) và Audit Logs (`/admin/audit-logs`).

---

## 🛠️ 2. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Mô tả |
| :--- | :--- | :--- |
| **Frontend** | **React 19**, **Vite 8** | Single Page Application (SPA), quản lý state với Hooks & Context (`AppContext`), Dev Server chạy cổng `5174` |
| **Styling & UI** | **Tailwind CSS 3.4**, Material Symbols | Giao diện hiện đại, responsive đa thiết bị, tích hợp mẫu in hóa đơn nhiệt 80mm (K80) |
| **Routing** | **React Router DOM 7** | Định tuyến 55 trang UI và bảo vệ route theo vai trò (`RequireRole`) |
| **Backend** | **Java 21**, **Spring Boot 4.1.2**, **Spring Data JPA**, **Spring Security** | RESTful API (`/api/v1`) qua 23 Controllers, xác thực Bearer Token (`auth_sessions`), gửi OTP qua Gmail SMTP |
| **Tích hợp mở rộng** | **VNPay Sandbox & Refund API**, **Google Gemini API** (`gemini-flash-lite-latest`) | Thanh toán trực tuyến chữ ký HMAC-SHA512, hoàn tiền qua API & Trợ lý AI tư vấn tập luyện |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** (2019 / 2022) | Lưu trữ chuẩn hóa **33 bảng** và **51 khóa ngoại** (`SportsCenterDB`), mã hóa UTF-8 |
| **Kiểm thử & Công cụ** | **JUnit 5**, **Playwright E2E**, **Oxlint**, **Knip** | **35 bộ test Backend**, **14 bộ Playwright E2E**, unit test JS, static lint & dead-code check |

---

## 🧩 3. Các Phân Hệ Chức Năng Chính

### 1. 👤 Phân Hệ Hội Viên (`Member` — `/member`)
- Đăng ký tài khoản (OTP 6 số qua email, hiệu lực 10 phút), đăng nhập bằng Email hoặc SĐT, quên/đặt lại/đổi mật khẩu và hoàn thiện hồ sơ sức khỏe PAR-Q.
- Đặt sân thể thao, đăng ký lớp học hoặc đặt PT 1-1 (`/member/book`, `/member/classes`): tự động kiểm tra trùng lịch, giữ chỗ 10 phút với booking trả phí, ưu tiên khấu trừ Quota gói tập (nguyên khối — không tách lẻ) hoặc thanh toán qua VNPay Sandbox kèm voucher.
- Hủy/đổi lịch trước tối thiểu 2 giờ (`/member/schedule`), gửi yêu cầu hoàn tiền (`/member/transactions`), và tạo & theo dõi ticket hỗ trợ/khiếu nại (`/member/tickets`).
- Thẻ hội viên điện tử (QR động + RFID) hiển thị động hạng hội viên (`BRONZE`, `SILVER`, `GOLD`, `DIAMOND` hoặc hạng tùy chỉnh), giáo án cá nhân/lớp, nhật ký InBody & 1RM, đánh giá HLV 1–5 sao và Trợ lý AI 24/7.

### 2. 🛎️ Phân Hệ Lễ Tân (`Receptionist` — `/receptionist`)
- Quét thẻ RFID (có modal giả lập nhanh), quét QR hoặc tra cứu SĐT để check-in cổng & xác thực điều kiện sân/lớp/giờ hoạt động (`/receptionist/checkin`, `/receptionist/members`).
- Quầy POS (`/receptionist/pos`): bán gói tập cho hội viên (hỗ trợ cả `CASH` và `VNPAY`), xác nhận thu tiền mặt booking pending, tự động lưu `processed_by`/`approved_by` và in hóa đơn nhiệt K80.
- Cho mượn và trả dụng cụ thể thao (`/receptionist/equipment`): kiểm soát tồn kho thực tế, tự làm tròn phí thuê theo giờ, lưu `recorded_by` khi thu phí trả đồ.
- Xem lịch lớp toàn trung tâm, đăng ký/hủy lớp hộ hội viên (`/receptionist/classes`), tiếp nhận & xử lý ticket (`/receptionist/tickets`), và xem **Báo cáo ca trực & doanh thu cá nhân** (`/receptionist/shift` — cô lập doanh thu & giao dịch theo đúng lễ tân đang đăng nhập trên cả `CASH`, `VNPAY` và trả dụng cụ).

### 3. 🏋️ Phân Hệ Huấn Luyện Viên (`Coach` — `/coach`)
- Lịch dạy tuần (`/coach/schedule`) và cấu hình khung giờ rảnh theo buổi (Sáng/Chiều/Tối): hệ thống tự động chặn tắt ca rảnh nếu HLV đã có lớp sắp tới trong khung giờ đó; hỗ trợ gửi đơn xin nghỉ/đổi ca (`/coach/leave`).
- Điểm danh học viên 3 trạng thái kèm ghi chú (`/coach/attendance`), tự động chốt `USED` hoặc hoàn trả `RELEASED` quota lớp.
- Quản lý danh sách học viên phụ trách (`/coach/students` — bảo mật chỉ thấy học viên lớp/PT của mình), nhập chỉ số InBody, soạn giáo án cá nhân hoặc hàng loạt cho lớp (có AI gợi ý bản thảo) và gửi thông báo nhanh.
- Theo dõi thù lao/hoa hồng (`40%` doanh thu ca không hủy, tối thiểu `200.000đ`/buổi tại `/coach/income`) và đánh giá từ học viên (`/coach/reviews`).

### 4. 📊 Phân Hệ Quản Lý & Quản Trị (`Manager / Admin` — `/admin`)
- **Tổng quan điều hành (`/admin`):** Lọc doanh thu theo `Ngày` / `Tháng` / `Năm` / `Toàn thời gian`, phân tích theo nguồn thu & phương thức thanh toán, theo dõi lớp trong ngày, bảng giao dịch có tìm kiếm/lọc & cột **`Người xử lý`** (`processedByName`), xem chi tiết và xuất CSV.
- **Sân bãi, Lớp học & Bảo trì (`/admin/facilities`, `/admin/classes`, `/admin/classes/new`, `/admin/maintenance`):** Quản lý trạng thái cơ sở vật chất đồng bộ tới sân và trang công khai; tách riêng trang Quản lý lớp học nhóm & Tạo lịch lớp định kỳ (tối đa 52 tuần); thiết lập bảo trì tự động khóa slot đặt sân & gửi thông báo cho khách bị ảnh hưởng.
- **Gói tập & Hạng tùy chỉnh (`/admin/packages`):** Tạo/cập nhật gói `VIP`, `PT`, `CLASS`, cấu hình **hạng hội viên tùy chỉnh** (ngoài Đồng/Bạc/Vàng/Kim Cương) và quản lý mã khuyến mãi Voucher.
- **Trung tâm Phê duyệt & Khiếu nại (`/admin/staff-approvals`, `/admin/tickets`):** Phê duyệt đăng ký HLV/Lễ tân, kích hoạt gói tập đã thanh toán, duyệt hoàn tiền (tích hợp VNPay Refund API), duyệt nghỉ phép HLV kèm bắt buộc chọn HLV dạy thay phù hợp chuyên môn, và xử lý ticket khiếu nại.
- **Quản trị Nhân sự, Hội viên & Hệ thống (`/admin/members`, `/admin/staff`, `/admin/broadcast`, `/admin/audit-logs`, `/admin/settings`):** CRUD tách riêng cho Hội viên và Nhân sự (kèm gắn bộ môn HLV & xem KPI/hoa hồng), Broadcast theo đối tượng, cấu hình chính sách vận hành, ma trận RBAC, thông số Gemini AI và Audit Logs.

---

## 📂 4. Cấu Trúc Thư Mục Dự Án

```text
SWP391_SportsCenter/
├── frontend/                            # Mã nguồn giao diện (React 19 + Vite 8 + Tailwind CSS 3.4)
│   ├── src/
│   │   ├── components/                  # Navbar, Footer, Portal/Role Layouts, Modals, Receipt K80, Ticket Panel
│   │   ├── context/                     # Quản lý phiên đăng nhập & trạng thái toàn cục (AppContext.jsx)
│   │   ├── pages/                       # 55 trang chia theo phân hệ:
│   │   │   ├── member/                  # 13 trang Hội viên (Book, Classes, Packages, Tickets, AI, Profile...)
│   │   │   ├── receptionist/            # 9 trang Lễ tân (Check-in, POS, Equipment, Members, Classes, Tickets, Shift...)
│   │   │   ├── coach/                   # 9 trang HLV (Schedule, Leave, Students, Attendance, Income, Reviews...)
│   │   │   ├── admin/                   # 13 trang Admin (Dashboard, Facilities, Classes, Maintenance, Packages, Approvals, Members, Staff, Tickets...)
│   │   │   └── *.jsx                    # 11 trang Công khai & Xác thực (Landing, About, Pricing, Sports/Facilities, Auth, OTP, VNPayReturn...)
│   │   ├── services/                    # 11 module gọi REST API (/api/v1)
│   │   ├── utils/                       # Helpers + unit tests (*.test.js)
│   │   ├── App.jsx                      # Cấu hình Routing & Route Guards theo Role
│   │   └── main.jsx
│   ├── e2e/                             # 14 bộ kiểm thử Playwright E2E (01..06, 08..15) + helpers.js
│   ├── vite.config.js                   # Dev Server cổng 5174 + proxy /api -> localhost:8080
│   └── package.json
│
├── backend/                             # Mã nguồn Backend (Spring Boot 4.1.2 - Java 21)
│   ├── src/main/java/com/sporthub/backend/
│   │   ├── config/                      # SecurityConfig, GlobalExceptionHandler, SchedulingConfig
│   │   ├── controller/                  # 23 REST Controllers (/api/v1/**)
│   │   ├── dto/                         # Request / Response DTOs
│   │   ├── entity/                      # 32 JPA Entities ánh xạ SportsCenterDB
│   │   ├── enums/                       # AttendanceStatus, MembershipTier, PackageType
│   │   ├── repository/                  # Spring Data JPA Repositories
│   │   ├── security/                    # BearerTokenAuthenticationFilter
│   │   ├── service/                     # Nghiệp vụ cốt lõi, VNPay Gateway & AI Assistant
│   │   └── util/                        # CoachSportHelper, SystemPolicyHelper
│   ├── src/main/resources/
│   │   ├── application.properties       # Cấu hình DB, SMTP, Gemini AI, VNPay & SQL init
│   │   ├── schema.sql                   # Khởi tạo/vá schema idempotent khi boot
│   │   └── db/                          # Migration scripts (20261119*, 20261120*) & demo SQL
│   ├── src/test/                        # 35 bộ kiểm thử Unit & Integration (JUnit 5) + TestMailConfig
│   └── pom.xml
│
├── docs/                                # Tài liệu dự án & hồ sơ bảo vệ
│   ├── BUSINESS_RULES.md                # Đặc tả 23 Quy tắc Nghiệp vụ (BR-01..BR-23) & BUSINESS_RULES.csv
│   ├── demo/                            # Kịch bản bảo vệ 27/11/2026 (KICH_BAN_DEMO_BAO_VE.md & .docx)
│   ├── specs/                           # Đặc tả yêu cầu phần mềm (SRD_Document.md) & PROJECT_TRACKING_FINAL.csv
│   ├── diagrams/                        # Sơ đồ Kiến trúc Hệ thống, ERD (.drawio/.png) & Usecase
│   └── slides/                          # Slide thuyết trình HTML/PPTX
├── postman/                             # Tài nguyên biến môi trường Postman
├── DATABASEchuan.sql                    # Script reset & khởi tạo 33 bảng SQL Server + dữ liệu mẫu bảo vệ
├── vercel.json                          # Cấu hình rewrite SPA khi deploy Vercel
└── .env.example                         # Mẫu cấu hình biến môi trường (DB, Mail SMTP, Gemini AI, VNPay)
```

> 📘 **Tài liệu Demo Bảo vệ Hội đồng (27/11/2026):** Xem [`docs/demo/KICH_BAN_DEMO_BAO_VE.md`](./docs/demo/KICH_BAN_DEMO_BAO_VE.md).

---

## 🔑 5. Tài Khoản Dùng Thử (Demo Accounts)

Sau khi nạp dữ liệu từ [`DATABASEchuan.sql`](./DATABASEchuan.sql), ngày **Thứ Sáu `27/11/2026` (`@DefenseDay`) được để trống 100%** lịch sân, lớp học, bảo trì và nghỉ phép HLV để phục vụ trình diễn trực tiếp.
- **Mật khẩu mặc định cho tài khoản mẫu (ID 1–16):** **`SportHub@123`**

| ID | Vai trò (`role`) | Cổng truy cập | Họ và tên | Email đăng nhập | Số điện thoại | Ghi chú dữ liệu mẫu (`DATABASEchuan.sql`) |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| 1 | `MANAGER` | `/admin` | Nguyễn Văn Quản Lý | `manager@sporthub.com` | `0901234567` | Quản trị toàn hệ thống, duyệt hàng đợi, bảo trì sân, Audit Logs |
| 2 | `MANAGER` | `/admin` | Trần Thị Giám Đốc | `director@sporthub.com` | `0909876543` | Theo dõi Dashboard doanh thu & hiệu suất nhân sự |
| 3 | `RECEPTIONIST` | `/receptionist` | Lê Thị Lễ Tân | `reception.le@sporthub.com` | `0912345678` | Có sẵn giao dịch đã xử lý (`CLS-2026-0008`, `CRT-2026-0017`, `POS-2026-0022`, `CLS-2026-0023`), phiếu trả `loan_id=503` & cho mượn `501` |
| 4 | `RECEPTIONIST` | `/receptionist` | Phạm Minh Tú | `reception.tu@sporthub.com` | `0918765432` | Có sẵn giao dịch đã xử lý (`POS-2026-0005`, `POS-2026-0024`, `CLS-2026-0025`) & phiếu trả `loan_id=502` |
| 5 | `COACH` | `/coach` | Trần Văn Minh | `coach.minh@sporthub.com` | `0923456789` | HLV Tennis, Pickleball, Bóng bàn (có lịch dạy & thu nhập mẫu) |
| 6 | `COACH` | `/coach` | Nguyễn Hoàng Nam | `coach.nam@sporthub.com` | `0928765432` | HLV Pickleball, Bơi lội, Bóng chuyền (có đơn xin nghỉ `request_id=101` ngày `28–29/11/2026` đang `PENDING`) |
| 7 | `COACH` | `/coach` | Võ Tấn Phát | `coach.phat@sporthub.com` | `0921112223` | HLV Bóng đá & Điền kinh |
| 8 | `COACH` | `/coach` | Đặng Thu Thảo | `coach.thao@sporthub.com` | `0923334445` | HLV Cầu lông & Yoga/Pilates |
| 9 | `MEMBER` | `/member` | Nguyễn Anh Khoa | `khoa.member@gmail.com` | `0934567890` | **Hội viên chính**: *Hạng Vàng* `ACTIVE` (`20 buổi`, `10 giờ sân`), 4 mốc InBody, 2 giáo án (Coach + AI), `ticket_id=1`, đang mượn vợt `loan_id=501` (`RFID-SH-0009`) |
| 10 | `MEMBER` | `/member` | Hoàng Thị Ngọc | `ngoc.hoang@gmail.com` | `0938765432` | *Hạng Vàng* `ACTIVE` (`18/20 buổi`, `9/10 giờ sân`), có 1 lịch sử hoàn tiền `APPROVED`, 1 ticket `BOOKING_SUPPORT` (`ticket_id=2`) (`RFID-SH-0010`) |
| 11 | `MEMBER` | `/member` | Bùi Huy Hoàng | `hoang.bui@gmail.com` | `0931112233` | *Hạng Kim Cương* `ACTIVE` (`30 buổi`, `15 giờ sân`), có yêu cầu hoàn tiền `PENDING_APPROVAL` (`refund_id=801` - `350.000đ`) (`RFID-SH-0011`) |
| 12 | `MEMBER` | `/member` | Đỗ Phương Anh | `anh.do@gmail.com` | `0934445566` | Có đơn mua *Hạng Bạc* tại quầy (`um_id=5`, `800.000đ`) đang chờ Manager phê duyệt kích hoạt (`PENDING_APPROVAL`) (`RFID-SH-0012`) |
| 13 | `MEMBER` | `/member` | Vũ Trọng Tuấn | `tuan.vu@gmail.com` | `0937778899` | Hội viên chưa mua gói — dùng test đăng ký gói mới tại POS/online (`RFID-SH-0013`) |
| 14 | `MEMBER` | `/member` | Lê Minh Châu | `chau.le@gmail.com` | `0935556677` | Hội viên đã thanh toán lớp Cầu lông `CLS-2026-0023` qua lễ tân Lê (`RFID-SH-0014`) |
| 15 | `COACH` | — | Trương Quốc Bảo | `bao.coach.pending@sporthub.com` | `0926667788` | Trạng thái **`PENDING`** — dùng test Manager duyệt hồ sơ nhân sự mới |
| 16 | `MEMBER` | — | Ngô Thanh Sơn | `son.locked@gmail.com` | `0939990011` | Trạng thái **`LOCKED`** — dùng test chặn check-in RFID (`RFID-SH-0016`) & Manager mở khóa |
| 17 | `COACH` | `/coach` | Phạm Minh Hoàng | `phamminhhoang812@gmail.com` | `081332231` | HLV Cầu lông (`ACTIVE`, hash mật khẩu riêng trong DB seed) |

> 💡 **Mã giảm giá (Voucher) mẫu trong DB:**
> - Đang kích hoạt (`ACTIVE`): `WELCOME2026` (-20%, tối đa 200k), `SPORTSHUB10` (-10%, tối đa 100k), `VIPMEMBER` (-15%, tối đa 300k), `TET2026` (-20%, tối đa 500k, đơn ≥ 500k), `GIAM50K` (-50.000đ, đơn ≥ 150k), `WELCOME20` (-20%, tối đa 300k, đơn ≥ 100k).
> - Đã hết hạn (`EXPIRED`): `SUMMEREND` (dùng test thông báo voucher hết hạn).

---

## 🚀 6. Hướng Dẫn Cài Đặt, Reset Database & Kiểm Thử

### Bước 1: Khởi tạo / Reset Cơ sở dữ liệu SQL Server
Chạy script [`DATABASEchuan.sql`](./DATABASEchuan.sql) bằng **SSMS** hoặc từ PowerShell tại thư mục gốc repo (tự dọn bảng/FK cũ và nạp sạch 33 bảng ngay cả khi backend đang chạy):
```powershell
sqlcmd -S localhost,1433 -U sa -P 12345 -C -f 65001 -b -i ".\DATABASEchuan.sql"
```
Kiểm tra lại thông tin DB, Gmail SMTP, Gemini AI & VNPay Sandbox trong `backend/src/main/resources/application.properties` hoặc file `.env` (tạo từ [`.env.example`](./.env.example)).

### Bước 2: Chạy Backend (Spring Boot)
```powershell
cd backend
mvn spring-boot:run
```
> Server API chạy tại: `http://localhost:8080` (Base API: `http://localhost:8080/api/v1`). Lưu ý dùng `mvn` trực tiếp (repo không dùng `mvnw`).

### Bước 3: Chạy Frontend (React + Vite)
Mở terminal mới:
```powershell
cd frontend
npm install
npm run dev
```
> Mở trình duyệt tại: **`http://localhost:5174`** (Vite proxy tự chuyển tiếp `/api` sang `http://localhost:8080`).

### Bước 4: Lệnh Kiểm Thử & Kiểm Tra Chất Lượng Code
```powershell
# Backend JUnit 5 tests (từ thư mục backend/)
mvn test

# Frontend lint, unused check, unit test & production build (từ thư mục frontend/)
npm run lint
npm run check:unused
npm run test:unit
npm run build

# Frontend Playwright E2E tests (cần SQL Server đang chạy; dùng cổng E2E 5173 mặc định hoặc E2E_BASE_URL)
npm run test:e2e
```

---
*Dự án đồ án môn học **SWP391** — Hệ thống Quản lý Trung tâm Thể thao Đa năng **SportHub**.*
