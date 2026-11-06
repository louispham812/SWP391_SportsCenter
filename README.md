# 🏟️ SportHub — Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng (SWP391)

> **SportHub (`SWP391_SportsCenter`)** là đồ án môn học **SWP391**, xây dựng ứng dụng web hỗ trợ quản lý và vận hành trung tâm thể thao đa năng: đặt sân trực tuyến, đăng ký lớp học, quản lý hội viên, bán hàng tại quầy (POS), điểm danh huấn luyện viên và thống kê doanh thu.

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=black)]()
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS-06B6D4?logo=tailwind-css&logoColor=white)]()
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot-6DB33F?logo=spring-boot&logoColor=white)]()
[![Database](https://img.shields.io/badge/Database-SQL%20Server-CC2927?logo=microsoft-sql-server&logoColor=white)]()

---

## 📑 Mục Lục
1. [Giới Thiệu Dự Án](#-1-giới-thiệu-dự-án)
2. [Vai Trò Cá Nhân (Frontend Focus)](#-2-vai-trò-cá-nhân-frontend-focus)
3. [Công Nghệ Sử Dụng (Tech Stack)](#-3-công-nghệ-sử-dụng-tech-stack)
4. [Các Phân Hệ Chức Năng Chính](#-4-các-phân-hệ-chức-năng-chính)
5. [Cấu Trúc Thư Mục Dự Án](#-5-cấu-trúc-thư-mục-dự-án)
6. [Tài Khoản Dùng Thử (Demo Accounts)](#-6-tài-khoản-dùng-thử-demo-accounts)
7. [Hướng Dẫn Cài Đặt & Khởi Chạy](#-7-hướng-dẫn-cài-đặt--khởi-chạy)

---

## 🌟 1. Giới Thiệu Dự Án

Trung tâm thể thao đa năng **SportHub** phục vụ các bộ môn như: Cầu lông, Tennis, Pickleball, Bóng đá, Bơi lội, Gym & Thể hình... Ứng dụng được thiết kế cho 5 nhóm người dùng chính:
- **Hội viên (Member):** Đặt sân trực tuyến theo khung giờ, đăng ký lớp học, xem thẻ hội viên QR, theo dõi chỉ số cơ thể và trò chuyện với chatbot hỗ trợ.
- **Lễ tân (Receptionist):** Check-in hội viên qua mã QR, bán gói tập/nước uống tại quầy (POS) kèm in phiếu thanh toán, quản lý mượn/trả dụng cụ thể thao.
- **Huấn luyện viên (Coach):** Xem lịch dạy, điểm danh học viên, cập nhật lịch tập luyện, đăng ký lịch rảnh và gửi đơn xin nghỉ phép.
- **Quản lý (Manager):** Xem biểu đồ thống kê doanh thu, quản lý danh sách sân bãi & lịch bảo trì, quản lý gói tập, voucher và duyệt yêu cầu hoàn tiền.
- **Quản trị viên (Admin):** Quản lý tài khoản nhân sự, danh mục môn thể thao và theo dõi lịch sử hoạt động hệ thống.

---

## 👨‍💻 2. Vai Trò Cá Nhân (Frontend Focus)

Trong dự án nhóm **SWP391**, tôi phụ trách chính mảng **Frontend Development** và phối hợp tích hợp API:
- **Xây dựng giao diện người dùng (UI/UX):** Thiết kế và chia các reusable components bằng **React** và **Tailwind CSS** (Navbar, Modal, Bảng đặt lịch sân, Form đăng ký, Trang in hóa đơn...).
- **Phân luồng điều hướng & Phân quyền màn hình:** Sử dụng **React Router DOM** và **React Context (`AuthContext`)** để điều hướng và bảo vệ các trang theo từng vai trò (Role-based Routing cho Member, Receptionist, Coach, Manager, Admin).
- **Ghép nối RESTful API:** Kết nối giao diện Frontend với các endpoint **Spring Boot** của nhóm để hiển thị danh sách sân trống, xử lý đặt lịch, cập nhật trạng thái giỏ hàng POS và thống kê dữ liệu.
- **Kiểm thử giao diện:** Phối hợp kiểm thử các luồng thao tác người dùng chính trên trình duyệt bằng **Playwright**.

---

## 🛠️ 3. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Mô tả |
| :--- | :--- | :--- |
| **Frontend** | **React 19**, **Vite** | Xây dựng Single Page Application (SPA), quản lý state với Hooks & Context |
| **Styling & UI** | **Tailwind CSS** | Thiết kế giao diện hiện đại, responsive trên nhiều kích thước màn hình |
| **Routing** | **React Router DOM v7** | Quản lý điều hướng trang và bảo vệ route theo phân quyền đăng nhập |
| **Backend (Team)** | **Java 21**, **Spring Boot**, **Spring Data JPA** | Cung cấp hệ thống RESTful API và xử lý logic nghiệp vụ |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** | Lưu trữ dữ liệu người dùng, lịch đặt sân, lớp học và hóa đơn |
| **Công cụ hỗ trợ** | **Git / GitHub**, **Postman**, **Playwright** | Quản lý mã nguồn nhóm, test API và kiểm thử luồng giao diện |

---

## 🧩 4. Các Phân Hệ Chức Năng Chính

### 1. 👤 Phân Hệ Hội Viên (Member)
- Đăng ký, đăng nhập và quản lý thông tin cá nhân.
- Tìm kiếm sân thể thao, chọn khung giờ trống và đặt sân trực tuyến.
- Đăng ký tham gia các lớp học thể thao cùng huấn luyện viên.
- Xem lịch sử đặt sân, áp dụng mã giảm giá (voucher) và gửi yêu cầu hủy lịch/hoàn tiền.
- Xem thẻ hội viên điện tử (QR Code) và theo dõi chỉ số tiến độ tập luyện.

### 2. 🛎️ Phân Hệ Lễ Tân (Receptionist)
- Quét/nhập mã thẻ hội viên để check-in nhanh tại quầy.
- Màn hình bán hàng tại quầy (POS): đăng ký gói tập, bán phụ kiện và hiển thị mẫu hóa đơn in nhiệt.
- Quản lý cho mượn và nhận trả dụng cụ thể thao (vợt, bóng...).

### 3. 🏋️ Phân Hệ Huấn Luyện Viên (Coach)
- Theo dõi lịch dạy hàng tuần và danh sách học viên từng lớp.
- Điểm danh học viên theo buổi học và ghi chú tiến độ tập luyện.
- Đăng ký khung giờ rảnh và gửi yêu cầu nghỉ phép lên Quản lý.

### 4. 📊 Phân Hệ Quản Lý & Admin (Manager & Admin)
- Dashboard tổng hợp số liệu doanh thu, số lượng hội viên và tỷ lệ lấp đầy sân.
- Quản lý trạng thái sân (hoạt động / đang bảo trì), gói tập và chương trình khuyến mãi.
- Phê duyệt tài khoản nhân viên mới và quản lý danh mục hệ thống.

---

## 📂 5. Cấu Trúc Thư Mục Dự Án

```text
SWP391_SportsCenter/
├── frontend/                            # Mã nguồn giao diện Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/                  # Các component dùng chung (Navbar, Footer, Modal, Toast...)
│   │   ├── context/                     # Quản lý trạng thái đăng nhập (AuthContext) & dữ liệu chung
│   │   ├── pages/                       # Các màn hình chia theo 5 vai trò:
│   │   │   ├── member/                  # Giao diện Hội viên (Đặt sân, Lớp học, Thẻ QR, Hồ sơ)
│   │   │   ├── receptionist/            # Giao diện Lễ tân (Check-in, Quầy POS, Mượn trả đồ)
│   │   │   ├── coach/                   # Giao diện HLV (Lịch dạy, Điểm danh, Nghỉ phép)
│   │   │   ├── manager/                 # Giao diện Quản lý (Dashboard, Quản lý sân, Voucher)
│   │   │   ├── admin/                   # Giao diện Admin (Quản lý nhân sự, Cài đặt)
│   │   │   ├── AuthPage.jsx             # Màn hình Đăng nhập / Đăng ký
│   │   │   └── LandingPage.jsx          # Trang chủ giới thiệu trung tâm
│   │   ├── services/                    # Các hàm gọi REST API kết nối tới Backend
│   │   ├── App.jsx                      # Cấu hình Routing và phân quyền truy cập trang
│   │   └── main.jsx                     # Entry point của ứng dụng React
│   ├── e2e/                             # Các kịch bản kiểm thử giao diện Playwright
│   └── package.json
│
├── backend/                             # Mã nguồn Backend (Spring Boot REST API)
│   ├── src/main/java/com/sporthub/      # Controller, Service, Repository, Entity, DTO
│   ├── src/main/resources/              # Cấu hình application.properties & schema.sql
│   └── pom.xml
│
└── SportsCenterDB_Database.sql          # Script khởi tạo Cơ sở dữ liệu SQL Server
```

---

## 🔑 6. Tài Khoản Dùng Thử (Demo Accounts)

Sau khi khởi chạy hệ thống, có thể đăng nhập trải nghiệm giao diện của từng vai trò bằng các tài khoản mẫu sau (Mật khẩu chung: **`123456`**):

| Vai trò (Role) | Email đăng nhập | Mật khẩu |
| :--- | :--- | :---: |
| **Quản trị viên (Admin)** | `admin@sporthub.com` | `123456` |
| **Quản lý (Manager)** | `manager@sporthub.com` | `123456` |
| **Lễ tân (Receptionist)** | `reception@sporthub.com` | `123456` |
| **Huấn luyện viên (Coach)** | `coach.minh@sporthub.com` | `123456` |
| **Hội viên VIP (Member)** | `member.an@gmail.com` | `123456` |

---

## 🚀 7. Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Khởi tạo Cơ sở dữ liệu SQL Server
1. Mở **SQL Server Management Studio (SSMS)**, mở file [`SportsCenterDB_Database.sql`](./SportsCenterDB_Database.sql) và nhấn **Execute (F5)** để tạo database `SportsCenterDB`.
2. Kiểm tra thông tin kết nối SQL Server trong file `backend/src/main/resources/application.properties`.

### Bước 2: Chạy Backend (Spring Boot)
```bash
cd backend
mvn spring-boot:run
```
> Server API sẽ chạy tại: `http://localhost:8080`

### Bước 3: Chạy Frontend (React + Vite)
Mở một terminal mới:
```bash
cd frontend
npm install
npm run dev
```
> Mở trình duyệt truy cập giao diện tại: `http://localhost:5173`

---
*Dự án đồ án môn học **SWP391** — Phụ trách giao diện Frontend bởi **[Phạm Minh Hoàng (Louis Pham)](https://github.com/louispham812)**.*
