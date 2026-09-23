# 🛠️ Quy Tắc Làm Việc Với Git & Hướng Dẫn Khởi Chạy Dự Án

---

## 🌿 1. Quy Tắc & Chiến Lược Phân Nhánh Git (Git Workflow)

### Các nhánh chính:
- **`main`**: Nhánh lưu trữ mã nguồn ổn định, đã kiểm thử hoàn chỉnh dùng để phát hành / demo. **Tuyệt đối KHÔNG commit hay push code trực tiếp lên `main`**.
- **`develop`**: Nhánh làm việc chung của cả nhóm. Mọi tính năng sau khi hoàn thành sẽ được tạo Pull Request (PR) để merge vào đây.
- **`feature/<role>-<tinh-nang>`**: Nhánh riêng lẻ được tách từ `develop` mỗi khi một thành viên làm một màn hình / chức năng mới.

---







### 🔄 Quy trình làm việc 5 bước hàng ngày (Bắt buộc cho từng task)

#### Bước 1: Luôn cập nhật code mới nhất từ nhánh `develop`
Trước khi bắt tay vào làm bất kỳ tính năng nào:
```bash
git checkout develop
git pull origin develop

```

#### Bước 2: Tạo nhánh tính năng mới (`feature/*`)

Đặt tên nhánh rõ ràng theo cấu trúc:

```bash
# Cú pháp: git checkout -b feature/<role>-<ten-tinh-nang>

# Ví dụ 1: Làm chức năng điểm danh của Coach
git checkout -b feature/coach-class-attendance

# Ví dụ 2: Làm chức năng quản lý gói tập của Manager
git checkout -b feature/manager-packages

```

#### Bước 3: Code và Commit tại máy cá nhân

Nên chia nhỏ các commit và đặt tên commit rõ ràng (Conventional Commits):

```bash
git add .
git commit -m "feat: hoàn thiện giao diện checklist điểm danh học viên"

```

*Quy ước tiền tố commit:*

* `feat:` Thêm tính năng mới
* `fix:` Sửa lỗi / bug
* `style:` Chỉnh sửa giao diện, CSS không ảnh hưởng logic
* `refactor:` Tối ưu, cơ cấu lại code

#### Bước 4: Kéo code mới nhất từ `develop` về để xử lý Conflict (nếu có)

Trước khi đẩy lên GitHub, hãy đồng bộ lại với `develop` để tránh xung đột trên Remote:

```bash
git pull origin develop

```

*Nếu có xung đột (Conflict): Mở file báo đỏ trong VS Code -> Chọn code đúng -> Lưu lại -> Chạy tiếp:*

```bash
git add .
git commit -m "fix: resolve merge conflicts with develop"

```

#### Bước 5: Đẩy nhánh lên GitHub và tạo Pull Request (PR)

```bash
# Đẩy nhánh tính năng lên GitHub
git push -u origin feature/coach-class-attendance

```

1. Mở trang Repository trên GitHub, nhấn nút **Compare & pull request**.
2. **Chọn nhánh:**
* **Base:** `develop` ⬅️ **Compare:** `feature/<ten-nhanh-cua-ban>`


3. Gán ít nhất **1 thành viên / Tech Lead** vào mục **Reviewers**.
4. Sau khi PR được duyệt và merge vào `develop`:

```bash
# Về lại máy cá nhân, chuyển về develop và xóa nhánh tính năng cũ
git checkout develop
git pull origin develop
git branch -d feature/coach-class-attendance

```

---

## 🚀 2. Hướng Dẫn Khởi Chạy Dự Án Lần Đầu (First-time Setup)

### Yêu cầu trước khi cài đặt:

* Đã cài đặt **Git** và **Node.js** (khuyến nghị phiên bản v18.x hoặc v20.x).
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
