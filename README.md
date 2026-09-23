# SWP391_SportsCenter

# 🏋️ Sports Center Management System (Hệ thống Quản lý Trung tâm Thể thao)

> Hệ thống quản lý toàn diện dành cho trung tâm thể thao / học viện đào tạo, hỗ trợ phân quyền đa vai trò (Center Manager, Coach, Member, Receptionist) và tích hợp trợ lý AI thông minh.

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
