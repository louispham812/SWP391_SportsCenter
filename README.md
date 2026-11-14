# 🏟️ SportHub — Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng (SWP391)

> **SportHub (`SWP391_SportsCenter`)** là đồ án môn học **SWP391**, xây dựng ứng dụng web hỗ trợ quản lý và vận hành trung tâm thể thao đa năng: đặt sân trực tuyến, đăng ký lớp học & PT 1-1, quản lý gói tập hội viên & định mức Quota, thanh toán trực tuyến VNPay / Sandbox, bán hàng tại quầy (POS) in hóa đơn nhiệt K80, mượn/trả dụng cụ thể thao, điểm danh huấn luyện viên, quản lý bảo trì sân và thống kê doanh thu kết hợp Trợ lý AI.

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-61DAFB?logo=react&logoColor=black)]()
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?logo=tailwind-css&logoColor=white)]()
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%204.1.2-6DB33F?logo=spring-boot&logoColor=white)]()
[![Database](https://img.shields.io/badge/Database-SQL%20Server-CC2927?logo=microsoft-sql-server&logoColor=white)]()

---

## 📑 Mục Lục
1. [Giới Thiệu Dự Án](#-1-giới-thiệu-dự-án)
2. [Công Nghệ Sử Dụng (Tech Stack)](#-2-công-nghệ-sử-dụng-tech-stack)
3. [Các Phân Hệ Chức Năng Chính](#-3-các-phân-hệ-chức-năng-chính)
4. [Cấu Trúc Thư Mục Dự Án](#-4-cấu-trúc-thư-mục-dự-án)
5. [Tài Khoản Dùng Thử (Demo Accounts)](#-5-tài-khoản-dùng-thử-demo-accounts)
6. [Hướng Dẫn Cài Đặt & Khởi Chạy](#-6-hướng-dẫn-cài-đặt--khởi-chạy)

---

## 🌟 1. Giới Thiệu Dự Án

Trung tâm thể thao đa năng **F Sport Center (SportHub)** phục vụ 10 bộ môn thể thao với 16 cụm sân tiêu chuẩn: Cầu lông, Tennis, Pickleball, Bóng đá, Bóng chuyền, Bóng bàn, Bơi lội, Điền kinh, Yoga & Pilates, Gym & Fitness. Ứng dụng được thiết kế cho các nhóm người dùng chính:
- **Hội viên (`MEMBER`):** Đặt sân trực tuyến theo khung giờ, đăng ký lớp học hoặc PT 1-1 (ưu tiên khấu trừ Quota gói tập hoặc thanh toán qua VNPay/Sandbox), mua/gia hạn gói tập, xem thẻ hội viên QR/RFID, theo dõi chỉ số cơ thể (BMI, SMM, PBF, 1RM), xem giáo án tập luyện và trò chuyện với Trợ lý AI.
- **Lễ tân (`RECEPTIONIST`):** Check-in hội viên qua SĐT / mã QR / thẻ từ RFID, bán gói tập tại quầy (POS) kèm in hóa đơn nhiệt K80, tạo tài khoản hội viên/nhân sự tại quầy, quản lý mượn/trả dụng cụ thể thao, điểm danh hộ và xuất báo cáo kết ca.
- **Huấn luyện viên (`COACH`):** Xem lịch dạy, điểm danh học viên (Có mặt, Vắng có phép/không phép), soạn thảo giáo án PT, nhập chỉ số thể lực học viên, đăng ký lịch rảnh, gửi đơn xin nghỉ phép và theo dõi thu nhập hoa hồng.
- **Quản lý & Quản trị viên (`MANAGER` — Cổng `/admin`):** Xem biểu đồ thống kê doanh thu, quản lý danh sách 16 sân bãi & lịch bảo trì sân, quản lý gói tập & voucher, phê duyệt kích hoạt gói tập / yêu cầu hoàn tiền / nhân sự mới / đơn nghỉ phép HLV, gửi thông báo hệ thống (Broadcast), cấu hình AI và theo dõi nhật ký hoạt động (Audit Logs).

---

## 🛠️ 2. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Mô tả |
| :--- | :--- | :--- |
| **Frontend** | **React 19**, **Vite 8** | Xây dựng Single Page Application (SPA), quản lý state với Hooks & Context (`AppContext`) |
| **Styling & UI** | **Tailwind CSS v3.4**, Material Symbols | Thiết kế giao diện hiện đại, responsive, hỗ trợ mẫu in hóa đơn nhiệt K80 |
| **Routing** | **React Router DOM v7** | Quản lý điều hướng trang và bảo vệ route theo phân quyền đăng nhập |
| **Backend** | **Java 21**, **Spring Boot 4.1.2**, **Spring Data JPA**, **Spring Security** | Cung cấp hệ thống RESTful API (`/api/v1`), xác thực Bearer Token, gửi OTP qua Gmail SMTP |
| **Tích hợp mở rộng** | **VNPay Sandbox**, **Google Gemini API** (`gemini-flash-lite-latest`) | Thanh toán trực tuyến có chữ ký số & Trợ lý AI tư vấn tập luyện |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** (2019 / 2022) | Lưu trữ dữ liệu chuẩn hóa 32 bảng (`SportsCenterDB`), mã hóa UTF-8 |
| **Kiểm thử & Công cụ** | **JUnit 5**, **Playwright E2E**, **Oxlint**, **Git / GitHub** | Kiểm thử Unit/Integration Backend và kiểm thử tự động luồng giao diện E2E |

---

## 🧩 3. Các Phân Hệ Chức Năng Chính

### 1. 👤 Phân Hệ Hội Viên (`Member` — `/member`)
- Đăng ký tài khoản (xác thực OTP 6 số qua email), đăng nhập bằng Email hoặc Số điện thoại và quản lý hồ sơ cá nhân.
- Tìm kiếm sân thể thao, chọn khung giờ trống và đặt sân trực tuyến (hỗ trợ trừ Quota gói tập hoặc thanh toán VNPay/Sandbox kèm giữ chỗ 10 phút).
- Đăng ký tham gia các lớp học thể thao hoặc đặt lịch tập riêng cùng huấn luyện viên (PT 1-1).
- Mua mới hoặc gia hạn 3 nhóm gói tập (`VIP`, `PT`, `CLASS`), áp dụng mã giảm giá (voucher) và gửi yêu cầu hủy lịch / hoàn tiền.
- Xem thẻ hội viên điện tử (QR Code & RFID), tích hoàn thành bài tập trong giáo án PT, theo dõi chỉ số cơ thể và tư vấn cùng Trợ lý AI.

### 2. 🛎️ Phân Hệ Lễ Tân (`Receptionist` — `/receptionist`)
- Tra cứu SĐT hoặc quét mã QR / thẻ RFID để check-in hội viên nhanh tại quầy.
- Màn hình bán hàng tại quầy (POS): đăng ký gói tập, thu tiền mặt / chuyển khoản / thẻ POS và in hóa đơn nhiệt chuẩn khổ K80.
- Quản lý cho mượn và nhận trả dụng cụ thể thao (vợt, giày, bóng, khăn tập...), tự động tính phí thuê theo giờ và cập nhật tồn kho.
- Hỗ trợ điểm danh lớp học, cập nhật liên hệ khẩn cấp (SOS) và xuất báo cáo doanh thu kết ca (CSV).

### 3. 🏋️ Phân Hệ Huấn Luyện Viên (`Coach` — `/coach`)
- Theo dõi lịch dạy hàng tuần và danh sách học viên của từng ca học.
- Điểm danh học viên theo 3 trạng thái (`PRESENT`, `EXCUSED_ABSENCE`, `UNEXCUSED_ABSENCE`) kèm nhận xét chuyên môn.
- Soạn thảo giáo án tập luyện PT (hỗ trợ gợi ý bằng AI), giao bài tập về nhà và cập nhật chỉ số thể lực cho học viên.
- Đăng ký khung giờ rảnh, gửi đơn xin nghỉ phép/đổi ca và theo dõi thống kê thu nhập hoa hồng, đánh giá 5 sao từ học viên.

### 4. 📊 Phân Hệ Quản Lý & Quản Trị (`Manager / Admin` — `/admin`)
- Dashboard tổng hợp số liệu doanh thu theo thời gian thực, phân tích theo bộ môn và tỷ lệ lấp đầy sân.
- Quản lý 16 sân thi đấu, thiết lập lịch bảo trì sân (tự động khóa slot đặt sân, hỗ trợ gia hạn bảo trì và xử lý dời lịch/hoàn tiền cho booking bị ảnh hưởng).
- Quản lý danh mục gói tập, chương trình khuyến mãi (Vouchers) và theo dõi KPI hiệu suất / hoa hồng nhân sự.
- Trung tâm phê duyệt: duyệt kích hoạt gói tập hội viên, duyệt yêu cầu hoàn tiền, duyệt tài khoản nhân sự mới và đơn nghỉ phép của HLV.
- Phát sóng thông báo toàn hệ thống (Broadcast), cấu hình tham số vận hành / AI Assistant và giám sát nhật ký kiểm toán (Audit Logs).

---

## 📂 4. Cấu Trúc Thư Mục Dự Án

```text
SWP391_SportsCenter/
├── frontend/                            # Mã nguồn giao diện Frontend (React 19 + Vite 8 + Tailwind CSS)
│   ├── src/
│   │   ├── components/                  # Các component dùng chung (Navbar, Sidebar, Modal, Hóa đơn K80...)
│   │   ├── context/                     # Quản lý phiên đăng nhập & dữ liệu toàn cục (AppContext.jsx)
│   │   ├── pages/                       # Các màn hình chia theo phân hệ:
│   │   │   ├── member/                  # Giao diện Hội viên (Đặt sân, Lớp học, Gói tập, Giáo án, AI, Thẻ QR...)
│   │   │   ├── receptionist/            # Giao diện Lễ tân (Check-in, Quầy POS, Thiết bị, Lớp học, Kết ca...)
│   │   │   ├── coach/                   # Giao diện HLV (Lịch dạy, Học viên/Giáo án, Điểm danh, Đánh giá...)
│   │   │   ├── admin/                   # Giao diện Quản lý & Admin (Dashboard, Sân, Bảo trì, Duyệt, Audit...)
│   │   │   ├── AboutPage.jsx            # Trang giới thiệu trung tâm
│   │   │   ├── AuthPage.jsx             # Màn hình Đăng nhập / Đăng ký
│   │   │   ├── ChangePasswordPage.jsx   # Màn hình đổi mật khẩu
│   │   │   ├── ForgotPasswordPage.jsx   # Màn hình quên mật khẩu
│   │   │   ├── LandingPage.jsx          # Trang chủ giới thiệu trung tâm
│   │   │   ├── OtpVerificationPage.jsx  # Màn hình xác thực OTP 6 số
│   │   │   ├── PricingPage.jsx          # Trang bảng giá gói tập & dịch vụ
│   │   │   ├── PublicContentPage.jsx    # Trang nội dung công khai
│   │   │   ├── ResetPasswordPage.jsx    # Màn hình đặt lại mật khẩu
│   │   │   ├── VerifyCodePage.jsx       # Màn hình xác minh mã
│   │   │   └── VNPayReturnPage.jsx      # Màn hình kết quả thanh toán VNPay
│   │   ├── services/                    # Các hàm gọi REST API kết nối tới Backend
│   │   ├── App.jsx                      # Cấu hình Routing và Route Guards bảo vệ theo vai trò
│   │   └── main.jsx                     # Entry point của ứng dụng React
│   ├── e2e/                             # 9 bộ kịch bản kiểm thử tự động Playwright E2E (.spec.js)
│   └── package.json
│
├── backend/                             # Mã nguồn Backend (Spring Boot 4.1.2 - Java 21)
│   ├── src/main/java/com/sporthub/      # Controller, Service, Repository, Entity, DTO, Security
│   ├── src/main/resources/              # Cấu hình application.properties & schema.sql
│   ├── src/test/                        # 29 bộ kiểm thử Unit & Integration (JUnit 5)
│   └── pom.xml
│
├── docs/                                # Tài liệu dự án & hồ sơ bảo vệ
│   ├── BUSINESS_RULES.md                # Đặc tả 23 Quy tắc Nghiệp vụ & BUSINESS_RULES.csv
│   ├── demo/                            # Kịch bản bảo vệ hội đồng (KICH_BAN_DEMO_BAO_VE.md & .docx)
│   ├── specs/                           # Tài liệu đặc tả SRD (SRD_Document.md) & theo dõi dự án (PROJECT_TRACKING_FINAL.csv)
│   ├── diagrams/                        # Sơ đồ kiến trúc hệ thống, ERD (.drawio/.png) & Usecase
│   └── slides/                          # Slide thuyết trình (SWP391_SportHub_Presentation.html, SportHub_Presentation.pptx)
├── postman/                             # Bộ collection kiểm thử API bằng Postman
├── DATABASEchuan.sql                    # Script khởi tạo Cơ sở dữ liệu SQL Server chuẩn hóa (32 bảng)
├── vercel.json                          # Cấu hình rewrite SPA khi deploy lên Vercel
└── .env.example                         # Mẫu cấu hình biến môi trường (DB, Mail SMTP, Gemini AI)
```

> 📘 **Tài liệu Demo Bảo vệ Hội đồng:** Xem [`docs/demo/KICH_BAN_DEMO_BAO_VE.md`](./docs/demo/KICH_BAN_DEMO_BAO_VE.md) hoặc bản Word [`docs/demo/KICH_BAN_DEMO_BAO_VE.docx`](./docs/demo/KICH_BAN_DEMO_BAO_VE.docx).

---

## 🔑 5. Tài Khoản Dùng Thử (Demo Accounts)

Sau khi nạp dữ liệu từ [`DATABASEchuan.sql`](./DATABASEchuan.sql), có thể đăng nhập trải nghiệm từng vai trò bằng **Email** hoặc **Số điện thoại** dưới đây.
- **Mật khẩu mặc định chung cho tất cả tài khoản:** **`SportHub@123`**

| Vai trò (`Role`) | Cổng truy cập | Họ và tên | Email đăng nhập | Số điện thoại | Ghi chú dữ liệu mẫu |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Quản lý / Admin (`MANAGER`)** | `/admin` | Nguyễn Văn Quản Lý | `manager@sporthub.com` | `0901234567` | Quản trị toàn hệ thống, duyệt gói/hoàn tiền/nhân sự, bảo trì sân, Audit Logs |
| **Giám đốc (`MANAGER`)** | `/admin` | Trần Thị Giám Đốc | `director@sporthub.com` | `0909876543` | Theo dõi Dashboard doanh thu & báo cáo hiệu suất nhân sự |
| **Lễ tân (`RECEPTIONIST`)** | `/receptionist` | Lê Thị Lễ Tân | `reception.le@sporthub.com` | `0912345678` | Check-in QR/RFID, Bán hàng POS, In hóa đơn K80, Mượn/Trả dụng cụ |
| **Lễ tân (`RECEPTIONIST`)** | `/receptionist` | Phạm Minh Tú | `reception.tu@sporthub.com` | `0918765432` | Quản lý hội viên tại quầy, Điểm danh lớp học, Báo cáo kết ca |
| **Huấn luyện viên (`COACH`)** | `/coach` | Trần Văn Minh | `coach.minh@sporthub.com` | `0923456789` | HLV Tennis, Pickleball, Cầu lông, Bóng bàn & Thể lực |
| **Huấn luyện viên (`COACH`)** | `/coach` | Nguyễn Hoàng Nam | `coach.nam@sporthub.com` | `0928765432` | HLV Pickleball, Bơi lội & Bóng chuyền |
| **Huấn luyện viên (`COACH`)** | `/coach` | Võ Tấn Phát | `coach.phat@sporthub.com` | `0921112223` | HLV Bóng đá & Điền kinh |
| **Huấn luyện viên (`COACH`)** | `/coach` | Đặng Thu Thảo | `coach.thao@sporthub.com` | `0923334445` | HLV Cầu lông |
| **Hội viên VIP (`MEMBER`)** | `/member` | Nguyễn Anh Khoa | `khoa.member@gmail.com` | `0934567890` | Đang kích hoạt *Thẻ Hội Viên Vàng Off-Peak* & *Khóa Pickleball 10 Buổi* |
| **Hội viên VIP (`MEMBER`)** | `/member` | Hoàng Thị Ngọc | `ngoc.hoang@gmail.com` | `0938765432` | Đang kích hoạt *Thẻ Hội Viên Vàng Off-Peak* (20 buổi tập, 10 giờ sân) |
| **Hội viên (`MEMBER`)** | `/member` | Bùi Huy Hoàng | `hoang.bui@gmail.com` | `0931112233` | Hội viên có gói tập đã hết hạn (`EXPIRED`) — dùng thử nghiệm gia hạn gói |
| **Hội viên (`MEMBER`)** | `/member` | Đỗ Phương Anh | `anh.do@gmail.com` | `0934445566` | Hội viên có đơn mua gói đang chờ thanh toán (`PENDING_PAYMENT`) |
| **Hội viên (`MEMBER`)** | `/member` | Vũ Trọng Tuấn | `tuan.vu@gmail.com` | `0937778899` | Hội viên tiêu chuẩn (Khách vãng lai chưa mua gói) |

> 💡 **Mã giảm giá (Voucher) mẫu đang kích hoạt:** `WELCOME2026` (-20%), `SPORTSHUB10` (-10%), `VIPMEMBER` (-15%), `TET2026` (-20%), `GIAM50K` (-50.000đ), `WELCOME20` (-20%).

---

## 🚀 6. Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Khởi tạo Cơ sở dữ liệu SQL Server
1. Mở **SQL Server Management Studio (SSMS)**, tạo database `SportsCenterDB` (nếu chưa có), mở file [`DATABASEchuan.sql`](./DATABASEchuan.sql) và nhấn **Execute (F5)**.  
   *(Hoặc chạy bằng dòng lệnh `sqlcmd` với mã hóa UTF-8: `sqlcmd -S localhost,1433 -U sa -P 12345 -C -d SportsCenterDB -f 65001 -i DATABASEchuan.sql`)*.
2. Kiểm tra thông tin kết nối SQL Server trong file `backend/src/main/resources/application.properties` (hoặc tạo file `.env` từ mẫu [`.env.example`](./.env.example)).

### Bước 2: Chạy Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
> Server API sẽ chạy tại: `http://localhost:8080` (Base API: `http://localhost:8080/api/v1`)

### Bước 3: Chạy Frontend (React + Vite)
Mở một terminal mới:
```bash
cd frontend
npm install
npm run dev
```
> Mở trình duyệt truy cập giao diện tại: `http://localhost:5173`

---
*Dự án đồ án môn học **SWP391** — Hệ thống Quản lý Trung tâm Thể thao Đa năng **SportHub**.*
