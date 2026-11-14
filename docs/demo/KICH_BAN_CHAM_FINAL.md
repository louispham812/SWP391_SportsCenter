# 🏆 KỊCH BẢN KIỂM THỬ & DEMO BẢO VỆ ĐỒ ÁN FINAL (FULL-STACK E2E DEFENSE SCRIPT)
**Dự án:** Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng — **SportHub (SWP391)**  
**Môi trường thực thi:** 100% Real Stack (Frontend React 19 Vite `5173` + Backend Spring Boot `8080` + Microsoft SQL Server `1433` — **Tuyệt đối không dùng Mock**)  
**Trạng thái kiểm thử tự động:**
- **Backend Unit & Integration Tests (`mvn test`):** `84/84 PASS (100%)`
- **Frontend E2E Playwright Suite (`npx playwright test`):** `25/25 PASS (100%)` (Bao phủ trọn vẹn 7 Luồng Nghiệp Vụ Liên Thông & Đối Soát Đa Vai Trò)

---

## 🔑 1. BẢNG TÀI KHOẢN DEMO CHUẨN BỊ TRƯỚC HỘI ĐỒNG
> **Mật khẩu chung cho tất cả các tài khoản:** `SportHub@123`  
> **Mẹo trình diễn trước Hội đồng:** Mở sẵn **4 cửa sổ trình duyệt (hoặc 4 Profile/Incognito)** chia màn hình để Hội đồng thấy dữ liệu đồng bộ tức thì giữa các vai trò mà không cần đăng xuất/đăng nhập lại nhiều lần.

| Cửa sổ | Vai trò (Role) | Email đăng nhập | Họ và tên | Chức năng trọng tâm khi chấm |
| :--- | :--- | :--- | :--- | :--- |
| **Tab 1** | **ADMIN / MANAGER** | `manager@sporthub.com` | Nguyễn Văn Quản Lý | Dashboard doanh thu, Tạo Gói/Voucher, Khóa bảo trì sân, Duyệt gói/Hoàn tiền/Nhân sự/Nghỉ phép, Broadcast, AI Config, Audit Logs |
| **Tab 2** | **RECEPTIONIST** | `reception.le@sporthub.com` | Lê Thị Lễ Tân | Check-in QR/RFID (`RFID-SH-0009`), Bán gói POS & In hóa đơn nhiệt K80, Mượn/Trả dụng cụ, Liên hệ khẩn cấp SOS, Điểm danh hộ, Báo cáo ca |
| **Tab 3** | **COACH** | `coach.minh@sporthub.com` | Trần Văn Minh | Lịch dạy, Điểm danh học viên + Nhận xét, Soạn giáo án PT, Nhập Body Progress & 1RM, Khai báo lịch rảnh, Xin nghỉ phép, Xem hoa hồng & Đánh giá |
| **Tab 4** | **MEMBER (VIP)** | `khoa.member@gmail.com` | Nguyễn Anh Khoa | Đặt sân/Lớp học/PT (áp chiết khấu VIP + Voucher), Hủy lịch hoàn tiền, Mua/Nâng cấp gói, Thẻ số QR/RFID, Tiến độ cơ thể & 1RM, Bài tập PT, Chat AI Coach, Đánh giá 5 sao |

---

## 🎬 2. KỊCH BẢN DEMO LIÊN THÔNG 7 LUỒNG NGHIỆP VỤ (THEO ĐÚNG TRÌNH TỰ CHẤM FINAL)

### 🌟 LUỒNG 1: Quản Trị Gói Tập & Voucher $\rightarrow$ Hội Viên Mua Gói $\rightarrow$ Admin Duyệt Kích Hoạt
> **File test tự động:** [`frontend/e2e/flow1-packages-vouchers.spec.js`](./frontend/e2e/flow1-packages-vouchers.spec.js)

1. **[Tab 1 - Admin]** Truy cập `/admin/packages`:
   - Bấm **"Thêm gói tập mới"**, nhập tên gói (VD: `Gói VIP Final Demo`), giá `5.500.000đ`, thời hạn `60 ngày` $\rightarrow$ Bấm **"Lưu gói tập"**.
   - Chuyển sang tab **"Mã giảm giá & Voucher"** $\rightarrow$ Bấm **"Tạo voucher mới"**, nhập mã `FINAL50K` (Giảm cố định `50.000đ`, đơn tối thiểu `100.000đ`) $\rightarrow$ Bấm **"Lưu Voucher"** và thử nút Bật/Tắt trạng thái.
2. **[Tab 4 - Guest/Member]** Mở `/pricing` (Trang công khai):
   - Chứng minh cho Hội đồng thấy gói `Gói VIP Final Demo` vừa tạo lập tức xuất hiện trên bảng giá công khai từ CSDL.
   - Đăng nhập Hội viên (`khoa.member@gmail.com`), vào `/member/packages` $\rightarrow$ Chọn gói vừa tạo $\rightarrow$ Bấm **"Nâng Cấp Lên Gói Này / Đăng Ký Gói Này"** $\rightarrow$ Bấm **"Tôi Đã Chuyển Khoản"**.
   - *Điểm nhấn nghiệp vụ (Business Rule):* Hệ thống chặn hạ cấp xuống gói rẻ hơn và tự động đặt trạng thái đơn mua ở chế độ chờ duyệt.
3. **[Tab 1 - Admin]** Truy cập `/admin/staff-approvals` $\rightarrow$ Chọn tab **"Duyệt gói hội viên"**:
   - Tìm dòng yêu cầu của `Nguyễn Anh Khoa` $\rightarrow$ Bấm **"Kích hoạt gói"**.
4. **[Tab 4 - Member]** Kiểm tra tại `/member` (Dashboard), `/member/profile` (Thẻ hội viên số QR/RFID) và `/member/transactions`:
   - Gói tập mới đã chuyển sang `ACTIVE`, hạn dùng được cộng/cập nhật chuẩn xác và lịch sử giao dịch ghi nhận đầy đủ.

---

### 🎾 LUỒNG 2: Đặt Sân Trực Tuyến, Chiết Khấu VIP + Áp Mã Voucher & Hủy Lịch Hoàn Tiền 100%
> **File test tự động:** [`frontend/e2e/flow2-booking-voucher-cancel.spec.js`](./frontend/e2e/flow2-booking-voucher-cancel.spec.js), [`frontend/e2e/court-booking.spec.js`](./frontend/e2e/court-booking.spec.js), [`frontend/e2e/class-options.spec.js`](./frontend/e2e/class-options.spec.js)

1. **[Tab 4 - Member]** Truy cập `/member/book` $\rightarrow$ Chọn **Đặt sân** hoặc **Lớp học** (`/member/book/courts/1` hoặc `/member/book/class/sports`):
   - Chọn ngày và khung giờ cách thời điểm hiện tại **$> 3$ tiếng**.
   - Bấm **"Tiếp tục thanh toán"**.
2. **[Tab 4 - Member - Màn hình Checkout]**:
   - Chỉ cho Hội đồng thấy hệ thống **tự động tính chiết khấu theo hạng thẻ VIP** (Silver -15%, Gold -30%, Diamond -50%).
   - Nhập thêm mã Voucher `SPORTSHUB10` (hoặc `FINAL50K`) vào ô mã ưu đãi $\rightarrow$ Bấm **"Áp Dụng"** $\rightarrow$ Tổng tiền giảm trực tiếp.
   - Chọn chế độ **Sandbox** $\rightarrow$ Bấm **"Xác Nhận & Thanh Toán"**.
   - Chuyển sang màn hình **Booking đã xác nhận (`PAID`)**.
3. **[Tab 4 - Member - Kiểm tra & Hủy lịch]** Vào `/member/schedule`:
   - Xem lịch đặt sân/lớp học vừa tạo trên thời khóa biểu cá nhân.
   - Bấm nút **"Hủy (Hoàn 100%)"** $\rightarrow$ Xác nhận trong hộp thoại.
   - *Điểm nhấn nghiệp vụ:* Hủy trước giờ bắt đầu $> 2$ tiếng được hoàn tiền tự động 100% và giải phóng slot sân ngay lập tức; nếu dưới 2 tiếng hệ thống sẽ khóa nút hủy.

---

### 🛎️ LUỒNG 3: Quầy Lễ Tân: Check-in QR/RFID, Bán Hàng POS In Hóa Đơn K80, Mượn/Trả Đồ & Kết Ca
> **File test tự động:** [`frontend/e2e/flow3-receptionist-desk.spec.js`](./frontend/e2e/flow3-receptionist-desk.spec.js), [`frontend/e2e/final-audit-cross-role.spec.js`](./frontend/e2e/final-audit-cross-role.spec.js)

1. **[Tab 2 - Receptionist]** Truy cập Quầy Check-in (`/receptionist/checkin`):
   - Nhập mã thẻ từ `RFID-SH-0009` (hoặc quét mã QR của hội viên Khoa) $\rightarrow$ Bấm **"Tra Cứu Thẻ"**.
   - Hệ thống hiển thị ảnh, hạng thẻ và trạng thái hợp lệ $\rightarrow$ Bấm **"XÁC NHẬN CHO VÀO TẬP"** $\rightarrow$ Ghi nhận vào bảng `member_check_ins`.
2. **[Tab 2 - Receptionist]** Truy cập Quầy POS (`/receptionist/pos`):
   - Tìm kiếm hội viên theo SĐT `0934567890` $\rightarrow$ Chọn `Nguyễn Anh Khoa`.
   - Chọn gói tập cần bán $\rightarrow$ Chọn phương thức thanh toán **Tiền mặt (`CASH`)** (hoặc Chuyển khoản / Cà thẻ POS).
   - Bấm **"Xác nhận và xuất biên lai POS"** $\rightarrow$ Hiển thị **Hóa đơn in nhiệt chuẩn khổ K80 (80mm)** sẵn sàng kết nối máy in nhiệt.
3. **[Tab 2 - Receptionist]** Truy cập Quản lý Thiết bị (`/receptionist/equipment`):
   - Tìm hội viên `0934567890` $\rightarrow$ Chọn dụng cụ (Vợt Tennis / Vợt Pickleball) $\rightarrow$ Bấm **"Xác nhận xuất mượn dụng cụ"** (Tồn kho tự động trừ).
   - Tại bảng **Đang mượn**, bấm **"Nhận trả đồ"** $\rightarrow$ Bấm **"Hoàn tất & In biên lai"** (Hệ thống tự tính phí thuê theo giờ và hoàn trả số lượng tồn kho).
4. **[Tab 2 & Tab 1 - Đối soát Doanh thu Thời gian thực]**:
   - Trên Tab 2, mở Báo cáo giao ca (`/receptionist/shift`): Kiểm tra tổng lượt check-in, số đơn POS, doanh thu phân tách theo nhân viên `approvedBy` và nút **"Xuất Báo Cáo (CSV)"**.
   - Trên Tab 1 (`/admin`), refresh Dashboard: Doanh thu tổng tăng đúng bằng số tiền vừa bán tại quầy POS (không lệch 1 đồng).

---

### 🏋️ LUỒNG 4: Huấn Luyện Viên Điểm Danh, Giao Giáo Án PT, Học Viên Tập Luyện & Đánh Giá 5 Sao
> **File test tự động:** [`frontend/e2e/flow4-coach-class-attendance.spec.js`](./frontend/e2e/flow4-coach-class-attendance.spec.js)

1. **[Tab 3 - Coach]** Truy cập Lịch dạy (`/coach/schedule`) & Điểm danh (`/coach/attendance`):
   - Chọn ca học đang phụ trách $\rightarrow$ Đánh dấu học viên **`PRESENT` (Có mặt)** (hoặc Vắng có phép / không phép).
   - Nhập nhận xét chuyên môn: *"Học viên tiếp thu tốt, đúng kỹ thuật động tác"* $\rightarrow$ Bấm **"Lưu Điểm Danh"**.
2. **[Tab 3 - Coach]** Đối soát Thu nhập (`/coach/income`):
   - Xem thống kê số buổi dạy thực tế và tiền hoa hồng tích lũy (các ca `CANCELLED` tự động bị loại trừ).
3. **[Tab 3 - Coach]** Soạn & Giao Giáo Án Tập Luyện (`/coach/students`):
   - Bấm **"Soạn Giáo Án"** (cho học viên PT riêng) hoặc **"Giao Giáo Án Cả Lớp"** $\rightarrow$ Nhập danh sách bài tập & bài tập về nhà (Homework) $\rightarrow$ Bấm **"Lưu Giáo Án"**.
4. **[Tab 4 - Member]** Xem Giáo án & Tích hoàn thành bài tập (`/member/workout-plans`):
   - Hội viên mở trang Kế hoạch tập luyện $\rightarrow$ Click tích chọn hoàn thành từng bài tập (`completed: true`).
   - *Đồng bộ 2 chiều:* HLV mở lại hồ sơ học viên sẽ thấy ngay tiến độ phần trăm bài tập học viên đã hoàn thành!
5. **[Tab 4 - Member]** Kiểm tra Chuyên cần (`/member/attendance`) & Gửi Đánh giá (`/member/reviews`):
   - Xem lịch sử điểm danh kèm lời phê của HLV.
   - Chấm **5 sao** và gửi bình luận đánh giá HLV $\rightarrow$ **[Tab 3 - Coach]** vào `/coach/reviews` thấy ngay đánh giá mới.

---

### 🛡️ LUỒNG 5: Quản Trị Hệ Thống: Khóa Tài Khoản, KPI Nhân Sự, Broadcast Đa Kênh & Audit Logs
> **File test tự động:** [`frontend/e2e/flow5-admin-ops-broadcast.spec.js`](./frontend/e2e/flow5-admin-ops-broadcast.spec.js)

1. **[Tab 1 - Admin]** Quản lý Hội viên (`/admin/members`):
   - Tìm kiếm hội viên `Khoa` $\rightarrow$ Thử bấm nút **Khóa tài khoản** (chặn đăng nhập/check-in khi vi phạm) và bấm lại để **Mở khóa**.
2. **[Tab 1 - Admin]** Quản lý Nhân sự & KPI Hoa hồng (`/admin/staff`):
   - Xem danh sách nhân viên hoặc mở modal **"Thêm người dùng mới"**.
   - Chuyển sang tab **"Hiệu suất & Hoa hồng"** để xem KPI lượt check-in, doanh số POS của Lễ tân và tổng chi phí hoa hồng phải trả cho từng HLV (`totalCoachPayout`).
3. **[Tab 1 - Admin]** Phát sóng Thông báo Toàn Hệ Thống (`/admin/broadcast`):
   - Nhập tiêu đề & nội dung thông báo $\rightarrow$ Bấm **"Gửi thông báo"**.
   - Kiểm tra trên **[Tab 4 - Member]** (`/member/notifications`) và **[Tab 3 - Coach]** (`/coach/notifications`): Cả hai vai trò nhận được thông báo tức thì.
4. **[Tab 1 - Admin]** Cấu hình Hệ thống (`/admin/settings`) & Nhật ký Kiểm toán (`/admin/audit-logs`):
   - Tại `/admin/settings`: Tinh chỉnh tham số vận hành và cấu hình AI Assistant (Model `gemini-flash-lite-latest`, Temperature, System Prompt) $\rightarrow$ Bấm **"Lưu Cấu Hình"**.
   - Tại `/admin/audit-logs`: Kiểm tra bảng nhật ký an toàn hệ thống ghi nhận đầy đủ mọi hành động nhạy cảm kèm thời gian và người thực hiện.

---

### 🤖 LUỒNG 6: Hồ Sơ Cá Nhân Đa Vai Trò & Trợ Lý Thể Thao AI Assistant (`gemini-flash-lite-latest`)
> **File test tự động:** [`frontend/e2e/flow6-profiles-ai.spec.js`](./frontend/e2e/flow6-profiles-ai.spec.js)

1. **Cập nhật Hồ sơ 3 Vai trò**:
   - **Member** (`/member/profile`), **Receptionist** (`/receptionist/profile`), **Coach** (`/coach/profile`): Cập nhật thông tin liên hệ/địa chỉ $\rightarrow$ Bấm Lưu $\rightarrow$ Dữ liệu lưu bền vững vào SQL Server.
2. **[Tab 4 - Member]** Tương tác Trợ lý Thể thao AI (`/member/ai-assistant`):
   - Nhập câu hỏi: *"Tư vấn cho tôi lịch tập luyện nâng cao thể lực và chế độ dinh dưỡng tăng cơ"* $\rightarrow$ Bấm **"Gửi câu hỏi"**.
   - Trợ lý AI phân tích dựa trên hồ sơ thể trạng của hội viên và phản hồi chi tiết trên khung chat.

---

### 🔥 LUỒNG 7: 6 Nghiệp Vụ Nâng Cao & Kiểm Thử Phòng Thủ (Các Câu Hỏi Khó Của Hội Đồng)
> **File test tự động:** [`frontend/e2e/flow7-advanced-defense-flows.spec.js`](./frontend/e2e/flow7-advanced-defense-flows.spec.js), [`frontend/e2e/maintenance-lock.spec.js`](./frontend/e2e/maintenance-lock.spec.js), [`frontend/e2e/swimming-lane-maintenance.spec.js`](./frontend/e2e/swimming-lane-maintenance.spec.js)

1. **Theo dõi Chỉ số Cơ thể (Body Progress) & Kỷ lục Mức tạ (1RM Max Lift)**:
   - Tại `/member/ai-assistant` (hoặc HLV nhập tại `/coach/students`), bấm **"Ghi nhận chỉ số & 1RM"** $\rightarrow$ Nhập Cân nặng (`75kg`), Chiều cao (`176cm`), SMM, PBF, mức tạ 1RM (`125kg`) $\rightarrow$ Lưu thành công và tự động cập nhật biểu đồ tiến độ & `member_health_profiles`.
2. **Yêu cầu Hoàn tiền Trực tuyến (Refund Request) & Phê duyệt**:
   - Hội viên vào `/member/transactions` $\rightarrow$ Bấm **"Yêu Cầu Hoàn Tiền"** $\rightarrow$ Chọn giao dịch, nhập lý do và số tài khoản ngân hàng (chống spam gửi trùng đơn `PENDING`).
   - Admin vào `/admin/staff-approvals` $\rightarrow$ Tab **"Yêu cầu hoàn tiền"** $\rightarrow$ Bấm **"Phê duyệt hoàn"** $\rightarrow$ Giao dịch gốc tự động chuyển sang `REFUNDED` (hiển thị duy nhất 1 dòng chuẩn kế toán).
3. **HLV Khai báo Lịch rảnh & Xin nghỉ phép $\rightarrow$ Quản lý Thẩm định**:
   - HLV vào `/coach/schedule` $\rightarrow$ Tab **"Khai báo lịch rảnh"** $\rightarrow$ Lưu lên máy chủ.
   - Chuyển sang tab **"Đơn xin nghỉ & đổi ca"** $\rightarrow$ Gửi đơn xin nghỉ phép kèm lý do.
   - Admin vào `/admin/staff-approvals` $\rightarrow$ Tab **"Đơn nghỉ Coach"** $\rightarrow$ Duyệt đơn nghỉ (hoặc phân công HLV dạy thay) / Từ chối.
4. **Lễ tân Cập nhật Liên hệ Khẩn cấp (SOS) & Điểm danh hộ tại Quầy**:
   - Lễ tân vào `/receptionist/members` $\rightarrow$ Tìm hội viên $\rightarrow$ Bấm nút **"Khẩn cấp"** $\rightarrow$ Lưu người liên hệ SOS (`emergencyContactName`, `emergencyContactPhone`).
   - Lễ tân vào `/receptionist/classes` $\rightarrow$ Bấm **"Xem danh sách & Sửa điểm danh"** $\rightarrow$ Điểm danh hộ học viên có mặt tại quầy.
5. **Quy trình Tuyển dụng Nhân sự Mới (`/register` $\rightarrow$ `PENDING` $\rightarrow$ Admin Duyệt `ACTIVE`)**:
   - Mở `/register` $\rightarrow$ Chọn vai trò **Huấn luyện viên** (hoặc Lễ tân) $\rightarrow$ Đăng ký tài khoản mới. Hệ thống khóa ở trạng thái `PENDING` (chưa cho phép đăng nhập).
   - Admin vào `/admin/staff-approvals` $\rightarrow$ Tab **"Phê duyệt nhân viên"** $\rightarrow$ Bấm **"Phê duyệt"** kích hoạt `ACTIVE`.
   - Nhân viên mới đăng nhập thành công và vào thẳng cổng `/coach`.
6. **Khóa Bảo trì Sân / Làn Bơi $\rightarrow$ Chặn Đặt Chỗ Thời Gian Thực (`HTTP 409 Conflict`)**:
   - Admin vào `/admin/facilities`:
     - Cách 1: Bấm **"Tạm khóa bảo trì"** trên thẻ Cơ sở vật chất (VD: `Hồ Bơi - Làn S1`) $\rightarrow$ Trang công khai `/facilities` và trang đặt sân `/member/book/courts/9` lập tức khóa làn bơi và hiện nhãn **"Đang bảo trì - Tạm ngưng nhận đặt"**.
     - Cách 2: Chuyển sang tab **Lịch bảo trì** $\rightarrow$ Bấm **"Lên lịch mới"** khóa `Tennis Court 01` theo khung giờ $\rightarrow$ Mọi nỗ lực đặt sân hoặc gọi API trong khung giờ đó đều bị chặn đứng với mã lỗi **`409 Conflict`**. Khi Admin xóa lịch bảo trì, toàn bộ khung giờ tự động mở lại ngay lập tức.

---

## ⚡ 3. LỆNH CHẠY KIỂM THỬ TỰ ĐỘNG TRƯỚC HỘI ĐỒNG (LIVE VERIFICATION COMMANDS)

Nếu Hội đồng yêu cầu chạy kiểm thử tự động để chứng minh toàn bộ tính năng hoạt động thật 100% với Database:

```powershell
# 1. Chạy toàn bộ 84 Unit & Integration Tests tại Backend (Spring Boot + SQL Server)
cd backend
mvn test

# 2. Chạy toàn bộ 25 kịch bản E2E Playwright trên trình duyệt Chromium (Frontend + Backend + DB)
cd ../frontend
npx playwright test

# 3. Hoặc chạy trình diễn trực quan có mở cửa sổ trình duyệt (Headed mode) cho từng luồng:
npx playwright test e2e/flow1-packages-vouchers.spec.js --headed
npx playwright test e2e/flow2-booking-voucher-cancel.spec.js --headed
npx playwright test e2e/flow3-receptionist-desk.spec.js --headed
npx playwright test e2e/flow4-coach-class-attendance.spec.js --headed
npx playwright test e2e/flow5-admin-ops-broadcast.spec.js --headed
npx playwright test e2e/flow6-profiles-ai.spec.js --headed
npx playwright test e2e/flow7-advanced-defense-flows.spec.js --headed
```
