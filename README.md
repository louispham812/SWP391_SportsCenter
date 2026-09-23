# SWP391_SportsCenter

# 🏋️ Sports Center Management System (Hệ thống Quản lý Trung tâm Thể thao)

> Hệ thống quản lý toàn diện dành cho trung tâm thể thao / học viện đào tạo, hỗ trợ phân quyền đa vai trò (Center Manager, Coach, Member, Receptionist) và tích hợp trợ lý AI thông minh.

---

## 👥 Thành viên nhóm & Phân công vai trò (Team 5)

| STT | Họ và Tên | GitHub Username | Vai trò chính trong dự án |
|:---:|:---|:---|:---|
| 1 | **[Tên Trưởng nhóm]** | `@leader_github` | **Team Leader / Fullstack / DevOps** |
| 2 | **[Thành viên 2]** | `@member2_github` | **Frontend Developer (Manager & Dashboard)** |
| 3 | **[Thành viên 3]** | `@member3_github` | **Frontend Developer (Coach & Member App)** |
| 4 | **[Thành viên 4]** | `@member4_github` | **Backend Developer (Auth, Database, API Core)** |
| 5 | **[Thành viên 5]** | `@member5_github` | **Backend & AI Integration (AI Assistant, Reports)** |

---

## 📌 Các phân hệ & Vai trò người dùng (User Roles)

1. **Center Manager (Quản lý trung tâm):**
   - Quản lý học viên, HLV và nhân viên.
   - Quản lý lớp học, phòng tập, bộ môn, lịch hoạt động và phân công giảng dạy.
   - Thống kê doanh thu, gói tập, báo cáo số lượng học viên.
   - Phân quyền người dùng và kiểm tra nhật ký hệ thống (System Logs).

2. **Coach (Huấn luyện viên):**
   - Theo dõi lịch dạy và danh sách học viên theo lớp.
   - Điểm danh, ghi nhận kết quả và đánh giá tiến độ từng buổi.
   - Tạo giáo án tập luyện, gửi bài tập về nhà.
   - Sử dụng trợ lý AI để gợi ý bài tập phù hợp thể trạng/mục tiêu học viên.

3. **Member (Học viên / Khách hàng):**
   - Đăng ký tài khoản, mua/gia hạn các gói tập và dịch vụ.
   - Đặt chỗ, hủy lớp học, xem lịch tập cá nhân.
   - Xem nhận xét, đánh giá từ HLV và lịch sử điểm danh.
   - Tương tác với trợ lý AI để hỏi đáp lịch tập và bài tập.

4. **Receptionist (Nhân viên lễ tân):**
   - Tìm kiếm thông tin hội viên, hỗ trợ check-in tại quầy.
   - Đăng ký thẻ tập trực tiếp, tiếp nhận lịch tập cho khách hàng.

---

## 🌿 Chiến lược phân nhánh Git (Branching Strategy)

Hệ thống tuân thủ mô hình **Git Feature Branch Workflow**:

- **`main`**: Nhánh mặc định chứa mã nguồn ổn định, đã kiểm thử hoàn chỉnh dùng để phát hành (Production / Demo). **Tuyệt đối KHÔNG push code trực tiếp lên `main`**.
- **`develop`**: Nhánh tích hợp chính của team trong quá trình phát triển (Staging / Development). Tất cả các tính năng sẽ được merge vào đây trước khi ra `main`.
- **`feature/<ten-tinh-nang>`**: Nhánh riêng lẻ được tạo từ `develop` mỗi khi một thành viên làm một màn hình/chức năng mới.
- **`hotfix/<ten-loi>`**: Nhánh sửa lỗi khẩn cấp trực tiếp từ `main`.

---

## 🚀 Hướng dẫn cài đặt & Triển khai lần đầu (First-time Deployment)

### 1. Yêu cầu môi trường
- **Node.js** (v18.x trở lên) / **Java JDK** (v17+) / **Docker** *(tùy theo tech stack của nhóm)*
- **Git** đã được cài đặt trên máy.
- Hệ quản trị cơ sở dữ liệu: **PostgreSQL / MySQL / MongoDB**.

### 2. Các bước cài đặt cục bộ (Local Setup)

```bash
# 1. Clone repository về máy cá nhân
git clone [https://github.com/](https://github.com/)<your-username>/sports-center-management-system.git
cd sports-center-management-system

# 2. Chuyển sang nhánh develop
git checkout develop

# 3. Cấu hình biến môi trường
# Copy file .env.example thành .env và điền các thông tin kết nối DB, API Key AI
cp .env.example .env

# 4. Cài đặt dependencies (ví dụ với Node.js)
npm install
# hoặc nếu dùng yarn / pnpm:
# yarn install

# 5. Chạy migrate database & seed dữ liệu mẫu
npm run db:migrate
npm run db:seed

# 6. Khởi chạy server ở chế độ Development
npm run dev
