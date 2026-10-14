# 🏆 SportHub - Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng (SWP391)

> **SportHub (SWP391_SportsCenter)** là nền tảng quản trị và vận hành toàn diện cho trung tâm thể thao đa năng, hỗ trợ tối ưu quy trình quản lý sân bãi, lịch học thể thao, hội viên, bán hàng tại quầy (POS), điểm danh học viên và phân tích báo cáo doanh thu theo thời gian thực.

---

## 📌 Mục Lục
1. [Giới Thiệu Dự Án](#-1-giới-thiệu-dự-án)
2. [Công Nghệ Sử Dụng (Tech Stack)](#-2-công-nghệ-sử-dụng-tech-stack)
3. [Cấu Trúc Thư Mục Dự Án](#-3-cấu-trúc-thư-mục-dự-án)
4. [Các Phân Quyền & Tính Năng Chính](#-4-các-phân-quyền--tính-năng-chính)
5. [Tài Khoản Dùng Thử (Demo Accounts)](#-5-tài-khoản-dùng-thử-demo-accounts)
6. [Hướng Dẫn Khởi Chạy Dự Án (Setup Guide)](#-6-hướng-dẫn-khởi-chạy-dự-án-setup-guide)
   - [Yêu cầu tiên quyết](#yêu-cầu-tiên-quyết)
   - [Bước 1: Cài đặt và cấu hình Database (SQL Server)](#bước-1-cài-đặt-và-cấu-hình-database-sql-server)
   - [Bước 2: Khởi chạy Backend (Spring Boot API)](#bước-2-khởi-chạy-backend-spring-boot-api)
   - [Bước 3: Khởi chạy Frontend (React + Vite)](#bước-3-khởi-chạy-frontend-react--vite)
7. [Kiểm Thử (Testing & Quality Assurance)](#-7-kiểm-thử-testing--quality-assurance)
8. [Quy Tắc Làm Việc Với Git (Git Workflow)](#-8-quy-tắc-làm-việc-với-git-git-workflow)

---

## 🌟 1. Giới Thiệu Dự Án

Trung tâm thể thao đa năng **SportHub** phục vụ các bộ môn như: Tennis, Pickleball, Bóng đá, Cầu lông, Gym, Bơi lội... Ứng dụng cung cấp giải pháp chuyển đổi số toàn diện cho 4 nhóm đối tượng:
- **Hội viên (Member):** Tự đặt sân, đăng ký lớp học thể thao, theo dõi lịch trình cá nhân, quản lý hồ sơ sức khỏe và nhận gợi ý từ Trợ lý AI.
- **Lễ tân (Receptionist):** Check-in hội viên vào sân/lớp, bán gói tập tại quầy (POS), kiểm soát sĩ số các lớp và lập báo cáo kết ca.
- **Huấn luyện viên (Coach):** Quản lý lịch dạy, theo dõi danh sách học viên, điểm danh và ghi chú tiến độ buổi học.
- **Quản lý / Ban giám đốc (Manager / Admin):** Theo dõi dashboard doanh thu & booking, quản lý cơ sở vật chất/sân bãi, cấu hình gói tập và phê duyệt nhân viên.

Tài liệu thiết kế kiến trúc và mô hình dữ liệu trong dự án:
- Sơ đồ thực thể kết nối: [`ERD.drawio.png`](./ERD.drawio.png) / [`update_ERD.drawio`](./update_ERD.drawio)
- Sơ đồ ca sử dụng: [`Usecase diagram.jpg`](./Usecase%20diagram.jpg)
- Script khởi tạo cơ sở dữ liệu: [`SportsCenterDB_Database.sql`](./SportsCenterDB_Database.sql)

---

## 💻 2. Công Nghệ Sử Dụng (Tech Stack)

| Thành phần | Công nghệ / Thư viện | Mô tả |
| :--- | :--- | :--- |
| **Backend Framework** | **Java 21**, **Spring Boot 4.x / 3.x** | RESTful API, mô hình MVC nhiều lớp |
| **Bảo mật & Phân quyền**| **Spring Security**, Bearer Token Authentication, BCrypt | Xác thực bảo mật và phân quyền tài khoản |
| **ORM & Data Access** | **Spring Data JPA**, Hibernate | Tự động hóa truy vấn và ánh xạ quan hệ cơ sở dữ liệu |
| **Cơ sở dữ liệu** | **Microsoft SQL Server** (MSSQL) | Cơ sở dữ liệu quan hệ chính (`SportsCenterDB`) |
| **Frontend Framework** | **React 19**, **Vite** | Single Page Application (SPA), HMR siêu tốc |
| **Giao diện & Styling** | **Tailwind CSS v3**, Lucide Icons | Giao diện hiện đại, trực quan, hỗ trợ responsive |
| **Routing** | **React Router DOM v7** | Quản lý điều hướng và Route Guards theo Role |
| **Testing & Linter** | **JUnit 5**, **Playwright E2E**, **Oxlint** | Kiểm thử đơn vị, kiểm thử luồng người dùng E2E, linter |

---

## 📁 3. Cấu Trúc Thư Mục Dự Án

```
SWP391_SportsCenter/
├── backend/                               # Mã nguồn Backend (Spring Boot)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/sporthub/backend/
│   │   │   │   ├── config/                # Cấu hình Security, CORS, Application Beans
│   │   │   │   ├── controller/            # REST API Controllers (Auth, Booking, Manager...)
│   │   │   │   ├── dto/                   # Data Transfer Objects (Request/Response)
│   │   │   │   ├── entity/                # JPA Entities tương ứng các bảng cơ sở dữ liệu
│   │   │   │   ├── repository/            # Spring Data JPA Repositories
│   │   │   │   ├── security/              # Bộ lọc xác thực Bearer Token
│   │   │   │   ├── service/               # Nghiệp vụ (AuthService, BookingService...)
│   │   │   │   └── BackendApplication.java # Entry point khởi chạy Spring Boot
│   │   │   └── resources/
│   │   │       ├── application.properties # Cấu hình database, port, hibernate
│   │   │       └── schema.sql             # Tạo bảng & seed dữ liệu công khai tự động
│   │   └── test/                          # Unit & Integration Tests (JUnit 5)
│   └── pom.xml                            # Quản lý dependencies Maven
│
├── frontend/                              # Mã nguồn Frontend (React + Vite)
│   ├── e2e/                               # Kịch bản kiểm thử tự động Playwright E2E
│   ├── public/                            # Tài nguyên tĩnh
│   ├── src/
│   │   ├── components/                    # Các Component tái sử dụng (Navbar, Toast...)
│   │   ├── context/                       # Quản lý State toàn cục (AppContext, Auth...)
│   │   ├── pages/                         # Các màn hình theo từng phân quyền:
│   │   │   ├── admin/                     # Dashboard, quản lý sân bãi, nhân viên, gói tập
│   │   │   ├── coach/                     # Lịch dạy, danh sách học viên, điểm danh
│   │   │   ├── member/                    # Đặt sân, đặt lớp, lịch tập, hồ sơ sức khỏe, AI
│   │   │   ├── receptionist/              # Check-in, quầy POS, quản lý lớp, báo cáo ca
│   │   │   ├── AuthPage.jsx               # Đăng nhập & Đăng ký
│   │   │   └── LandingPage.jsx            # Trang chủ giới thiệu trung tâm
│   │   ├── services/                      # Gọi API Backend (apiClient, publicContentApi)
│   │   ├── App.jsx                        # Khai báo tuyến đường (Routes) và bảo vệ phân quyền
│   │   └── main.jsx                       # Entry point React
│   ├── package.json                       # Khai báo dependencies Frontend
│   ├── tailwind.config.js                 # Cấu hình giao diện Tailwind CSS
│   └── vite.config.js                     # Cấu hình build & dev server Vite
│
├── SportsCenterDB_Database.sql            # Script SQL Server toàn diện (Bảng, Quan hệ, Dữ liệu mẫu)
├── runtime-validation-report.md           # Báo cáo kiểm định môi trường và kết quả E2E test
├── ERD.drawio.png                         # Sơ đồ thực thể cơ sở dữ liệu
├── update_ERD.drawio                      # Sơ đồ ERD cập nhật
└── Usecase diagram.jpg                    # Sơ đồ Use Case chức năng hệ thống
```

---

## 🎯 4. Các Phân Quyền & Tính Năng Chính

### 1. 👤 Hội Viên (Member)
- **Đăng ký & Đăng nhập:** Tạo tài khoản mới, lưu trữ phiên đăng nhập bảo mật qua Token.
- **Khám phá dịch vụ:** Xem danh mục các môn thể thao (Tennis, Pickleball, Cầu lông, Bóng đá...), cơ sở vật chất và bảng giá gói tập.
- **Đặt sân trực tuyến (Court Booking):** Chọn môn thể thao, sân tập, khung giờ trống (time slot) và thanh toán SANDBOX.
- **Đăng ký lớp học (Class Booking):** Lựa chọn lớp học sắp diễn ra, xem thông tin Huấn luyện viên, sĩ số và đặt chỗ.
- **Lịch tập cá nhân (Member Schedule):** Xem thời khóa biểu các ca sân và buổi học đã đăng ký; theo dõi trạng thái thanh toán.
- **Hồ sơ sức khỏe (Health Profile):** Quản lý chỉ số cơ thể (chiều cao, cân nặng, mục tiêu rèn luyện, tiền sử chấn thương).
- **Trợ lý thể thao AI (AI Assistant):** Tư vấn môn tập luyện phù hợp dựa trên hồ sơ thể trạng.

### 2. 🛎️ Lễ Tân (Receptionist)
- **Check-in hội viên:** Tra cứu và xác nhận check-in trực tiếp khi học viên đến trung tâm theo ca đặt.
- **Điểm bán hàng tại quầy (POS - Point of Sale):** Đăng ký hội viên mới, thanh toán gói tập trực tiếp tại quầy, áp dụng mã giảm giá (Voucher).
- **Quản lý danh sách hội viên:** Tìm kiếm, kiểm tra trạng thái thẻ hội viên (ACTIVE / INACTIVE).
- **Quản lý lớp học trong ngày:** Theo dõi danh sách các lớp diễn ra trong ca trực, kiểm tra sĩ số thực tế.
- **Báo cáo kết ca (Shift Report):** Thống kê tổng lượt check-in, số đơn hàng POS và tổng doanh thu thu được trong ca làm việc.

### 3. 🏋️ Huấn Luyện Viên (Coach)
- **Lịch dạy cá nhân:** Xem danh sách các buổi học được phân công theo ngày / tuần.
- **Điểm danh học viên (Attendance):** Đánh dấu trạng thái có mặt / vắng mặt của học viên trong từng buổi học.
- **Quản lý học viên & Tiến độ:** Ghi chú nhận xét (coach note) và bài tập bổ trợ tại nhà (homework) cho từng học viên.
- **Thống kê buổi dạy:** Theo dõi số ca dạy đã hoàn thành.

### 4. 👔 Quản Lý Trung Tâm (Manager / Admin)
- **Dashboard phân tích:** Báo cáo trực quan về tổng doanh thu, số lượt đặt sân, số lượng hội viên mới và hiệu suất sử dụng sân.
- **Quản lý cơ sở vật chất (Facilities & Courts):** Thêm mới, chỉnh sửa thông tin sân bãi, thời gian mở/đóng cửa, giá thuê theo giờ.
- **Quản lý gói tập (Membership Packages):** Thiết lập các gói tập (tháng, quý, năm, VIP), giá bán và thời hạn áp dụng.
- **Quản lý hội viên:** Theo dõi danh sách, trạng thái tài khoản (ACTIVE, LOCKED) và lịch sử tham gia.
- **Quản lý & Phê duyệt nhân sự:** Phê duyệt đơn đăng ký của nhân viên mới (Coach, Receptionist) và quản lý danh sách nhân sự trung tâm.

---

## 🔑 5. Tài Khoản Dùng Thử (Demo Accounts)

Cơ sở dữ liệu mẫu đã được nạp sẵn các tài khoản tương ứng với từng vai trò. Tất cả tài khoản demo sử dụng chung mật khẩu mặc định: **`SportHub@123`**

| Vai trò (Role) | Họ và tên | Email đăng nhập | Mật khẩu mặc định | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **MANAGER** | Nguyễn Văn Quản Lý | `manager@sporthub.com` | `SportHub@123` | Quản lý toàn bộ hệ thống, dashboard & cấu hình |
| **MANAGER** | Trần Thị Giám Đốc | `director@sporthub.com` | `SportHub@123` | Giám đốc điều hành trung tâm |
| **RECEPTIONIST** | Lê Thị Lễ Tân | `reception.le@sporthub.com` | `SportHub@123` | Lễ tân ca 1 (Check-in, POS bán hàng, Báo cáo ca) |
| **RECEPTIONIST** | Phạm Minh Tú | `reception.tu@sporthub.com` | `SportHub@123` | Lễ tân ca 2 |
| **COACH** | Trần Văn Minh | `coach.minh@sporthub.com` | `SportHub@123` | HLV môn Tennis (Xem lịch dạy, điểm danh học viên) |
| **COACH** | Nguyễn Hoàng Nam | `coach.nam@sporthub.com` | `SportHub@123` | HLV môn Pickleball |
| **COACH** | Võ Tấn Phát | `coach.phat@sporthub.com` | `SportHub@123` | HLV môn Bóng đá |
| **COACH** | Đặng Thu Thảo | `coach.thao@sporthub.com` | `SportHub@123` | HLV môn Cầu lông |
| **MEMBER** | Nguyễn Anh Khoa | `khoa.member@gmail.com` | `SportHub@123` | Hội viên (Đã có sẵn lịch tập & hồ sơ sức khỏe) |
| **MEMBER** | Hoàng Thị Ngọc | `ngoc.hoang@gmail.com` | `SportHub@123` | Hội viên mẫu |

---

## 🚀 6. Hướng Dẫn Khởi Chạy Dự Án (Setup Guide)

### Yêu cầu tiên quyết:
- **Java Development Kit (JDK):** Phiên bản **21** trở lên.
- **Apache Maven:** Phiên bản **3.9+** (hoặc sử dụng Maven tích hợp sẵn trong IDE như IntelliJ IDEA, Eclipse, VS Code).
- **Node.js:** Phiên bản **18.x**, **20.x** hoặc mới hơn & **npm**.
- **Microsoft SQL Server:** Phiên bản 2019 / 2022 hoặc SQL Server Express đang chạy trên cổng mặc định `1433`.
- **SQL Server Management Studio (SSMS)** hoặc Azure Data Studio để quản lý CSDL.
- **Git** đã được cài đặt trên máy.

---

### Bước 1: Cài đặt và cấu hình Database (SQL Server)

1. Mở **SQL Server Management Studio (SSMS)** và kết nối tới SQL Server instance của bạn (ví dụ: `localhost` hoặc `localhost\SQLEXPRESS`).
2. Mở file [`SportsCenterDB_Database.sql`](./SportsCenterDB_Database.sql) nằm ở thư mục gốc của dự án.
3. Nhấn **Execute (F5)** để chạy toàn bộ script. Script sẽ tự động:
   - Tạo cơ sở dữ liệu `SportsCenterDB`.
   - Tạo toàn bộ hệ thống bảng và ràng buộc khóa ngoại (Foreign Keys).
   - Nạp dữ liệu mẫu ban đầu (tài khoản demo, danh mục môn thể thao, cơ sở vật chất, gói tập, lịch học, mã giảm giá...).
4. Mở file cấu hình `backend/src/main/resources/application.properties` và điều chỉnh thông tin kết nối phù hợp với máy của bạn:

```properties
server.port=8080
spring.application.name=backend

# Cấu hình kết nối SQL Server
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=SportsCenterDB;encrypt=false;trustServerCertificate=true
spring.datasource.username=sa
spring.datasource.password=12345
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver

# Hibernate Config
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect

# Tự động đồng bộ các bảng thông tin trang chủ (schema.sql)
spring.sql.init.mode=always
```

> 💡 **Lưu ý:** Nếu SQL Server của bạn đặt mật khẩu `sa` khác với `12345` hoặc sử dụng cổng/instance khác (ví dụ: `localhost\\SQLEXPRESS`), hãy cập nhật lại `spring.datasource.password` hoặc `spring.datasource.url`.

---

### Bước 2: Khởi chạy Backend (Spring Boot API)

Mở một cửa sổ Terminal thứ nhất và di chuyển vào thư mục `backend`:

#### Cách A: Chạy bằng dòng lệnh Maven:
```bash
cd backend

# Tải dependencies và biên dịch dự án
mvn clean install -DskipTests

# Khởi chạy Spring Boot Server
mvn spring-boot:run
```

#### Cách B: Chạy qua IDE (IntelliJ IDEA / VS Code / Eclipse):
1. Mở thư mục `backend` như một Maven Project trong IDE.
2. Đợi IDE tải hoàn tất các thư viện trong `pom.xml`.
3. Tìm đến file: `src/main/java/com/sporthub/backend/BackendApplication.java`.
4. Nhấn **Run / Debug**.

> 🟢 **Backend API sẵn sàng tại:** `http://localhost:8080`  
> 🔗 **Root API:** `http://localhost:8080/api/v1`

---

### Bước 3: Khởi chạy Frontend (React + Vite)

Mở một cửa sổ Terminal thứ hai (giữ Terminal Backend tiếp tục chạy):

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói phụ thuộc npm
npm install

# 3. (Tùy chọn) Tạo file cấu hình môi trường nếu backend chạy trên địa chỉ khác
# Mặc định frontend đã tự động trỏ tới http://localhost:8080/api/v1
# Bạn có thể tạo file .env.local nếu cần ghi đè:
# echo "VITE_API_BASE_URL=http://localhost:8080/api/v1" > .env.local

# 4. Khởi chạy máy chủ phát triển Vite
npm run dev
```

> 🟢 **Giao diện người dùng mở tại:** `http://localhost:5173` (hoặc đường dẫn hiển thị trên terminal).

---

## 🧪 7. Kiểm Thử (Testing & Quality Assurance)

Dự án đã được tích hợp bộ kiểm thử đa tầng từ Unit Test phía Backend đến End-to-End (E2E) Test phía Frontend:

### 1. Backend Tests (JUnit 5 & Spring Boot Test):
Tại thư mục `backend`, chạy lệnh:
```bash
mvn test
```
*Kiểm tra khả năng kết nối SQL Server, các controller nghiệp vụ (`BookingController`, `FacilityManagementController`, `ManagerController`, `ReceptionistController`) và logic tính toán của `BookingService`.*

### 2. Frontend Lint:
Tại thư mục `frontend`, chạy lệnh:
```bash
npm run lint
```

### 3. Frontend End-to-End Tests (Playwright):
Tại thư mục `frontend`, chạy lệnh:
```bash
npm run test:e2e
```
*Tự động hóa kiểm thử luồng đăng ký tài khoản thành viên mới, tải danh mục sân bãi / lớp học trực tiếp từ SQL Server, quy trình đặt sân & đặt lớp học qua SANDBOX checkout, và xác thực hiển thị lịch tập trên giao diện người dùng (xem chi tiết tại [`runtime-validation-report.md`](./runtime-validation-report.md)).*

---

## 🌿 8. Quy Tắc Làm Việc Với Git (Git Workflow)

### Các nhánh chính:
- **`main`**: Nhánh lưu trữ mã nguồn ổn định nhất, đã qua kiểm thử nghiệm thu dùng để phát hành / demo. **Tuyệt đối KHÔNG commit hay push code trực tiếp lên `main`**.
- **`develop`**: Nhánh phát triển chung của toàn nhóm. Mọi tính năng sau khi hoàn thành sẽ được tạo Pull Request (PR) để merge vào đây.
- **`feature/<role>-<tinh-nang>`**: Nhánh độc lập được tách từ `develop` mỗi khi một thành viên phụ trách một màn hình / chức năng mới.

---

### 🔄 Quy trình 5 bước phát triển tính năng hàng ngày:

#### Bước 1: Luôn cập nhật code mới nhất từ nhánh `develop`
Trước khi bắt tay vào làm bất kỳ tính năng nào:
```bash
git checkout develop
git pull origin develop
```

#### Bước 2: Tạo nhánh tính năng mới (`feature/*`)
Đặt tên nhánh rõ ràng theo cấu trúc phân quyền và tên chức năng:
```bash
# Cú pháp: git checkout -b feature/<role>-<ten-tinh-nang>

# Ví dụ 1: Làm tính năng điểm danh học viên của HLV
git checkout -b feature/coach-class-attendance

# Ví dụ 2: Làm tính năng quản lý cơ sở vật chất của Manager
git checkout -b feature/manager-facilities-management

# Ví dụ 3: Làm tính năng bán hàng POS của Lễ tân
git checkout -b feature/receptionist-pos-checkout
```

#### Bước 3: Code và Commit tại máy cá nhân
Chia nhỏ các commit theo chuẩn Conventional Commits:
```bash
git add .
git commit -m "feat: hoàn thiện giao diện checklist điểm danh học viên"
```

*Quy ước tiền tố commit:*
- `feat:` Thêm tính năng mới
- `fix:` Sửa lỗi / bug
- `style:` Chỉnh sửa giao diện, CSS không ảnh hưởng logic
- `refactor:` Tối ưu cấu trúc mã nguồn
- `docs:` Bổ sung / chỉnh sửa tài liệu
- `test:` Thêm hoặc sửa kịch bản kiểm thử

#### Bước 4: Đồng bộ lại với `develop` để xử lý Conflict (nếu có)
Trước khi đẩy lên GitHub, kéo code mới nhất từ `develop` về:
```bash
git pull origin develop
```
*Nếu có xung đột (Conflict): Mở file thông báo xung đột trong VS Code -> Chọn bản code chính xác -> Lưu lại -> Commit:*
```bash
git add .
git commit -m "fix: resolve merge conflicts with develop"
```

#### Bước 5: Đẩy nhánh lên GitHub và tạo Pull Request (PR)
```bash
# Đẩy nhánh tính năng lên GitHub
git push -u origin feature/<ten-nhanh-cua-ban>
```
1. Mở Repository trên GitHub, chọn **Compare & pull request**.
2. **Chọn nhánh:**
   - **Base:** `develop` ⬅️ **Compare:** `feature/<ten-nhanh-cua-ban>`
3. Gán ít nhất **1 thành viên / Tech Lead** vào mục **Reviewers**.
4. Sau khi PR được duyệt và merge vào `develop`:
```bash
# Quay lại máy cá nhân, chuyển về develop và xóa nhánh feature đã hoàn thành
git checkout develop
git pull origin develop
git branch -d feature/<ten-nhanh-cua-ban>
```

---

## 🚀 2. Hướng Dẫn Khởi Chạy Dự Án Lần Đầu (First-time Setup)

### Yêu cầu trước khi cài đặt:

* Đã cài đặt **Git** và **Node.js** (khuyến nghị phiên bản v18.x hoặc v20.x).
* Đã cài đặt **JDK 25** để chạy backend Java.
* Đã cài đặt và khởi động cơ sở dữ liệu: **PostgreSQL** (hoặc **MySQL**).

---

### Bước 0: Clone Repository về máy

```bash
git clone [https://github.com/](https://github.com/)<your-username>/<repo-name>.git
cd <repo-name>
git checkout develop

```

---

### 🖥️ A. KHỞI CHẠY BACKEND (Chạy trước để cấp Database & API)

Mở cửa sổ Terminal thứ nhất:

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt các thư viện phụ thuộc
npm install

# 3. Tạo file cấu hình môi trường (.env)
cp .env.example .env

# 4. Mở file .env và cập nhật thông tin kết nối Database của máy bạn:
# DATABASE_URL=postgresql://postgres:mat_khau_cua_ban@localhost:5432/sports_center_db
# PORT=5000

# 5. Chạy migration để tự động tạo các bảng trong Database
npm run db:migrate

# 6. Nạp dữ liệu mẫu (tài khoản demo, các lớp học mặc định)
npm run db:seed

# 7. Khởi chạy Backend Server ở chế độ dev
npm run dev

```

> 🟢 **Backend chạy thành công tại:** `http://localhost:5000`

---

### 💻 B. KHỞI CHẠY FRONTEND (Giao diện người dùng)

Mở một cửa sổ Terminal thứ hai (vẫn giữ Terminal Backend tiếp tục chạy):

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Tạo file cấu hình môi trường frontend
cp .env.example .env.local

# 4. Đảm bảo file .env.local trỏ đúng vào port của Backend:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# (hoặc VITE_API_URL=http://localhost:5000/api nếu dùng Vite)

# 5. Khởi chạy ứng dụng Frontend
npm run dev

```

## ⚠️ Lưu ý quan trọng

* **Tuyệt đối không commit file `.env` hoặc `.env.local` lên GitHub** (các file này phải luôn nằm trong `.gitignore`).
* Nếu gặp lỗi kết thúc dòng `'LF'/'CRLF'` trên Windows, chạy lệnh cấu hình một lần duy nhất:
```bash
git config --global core.autocrlf false

```
