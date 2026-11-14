# Kịch Bản Demo Bảo Vệ Đồ Án Trước Hội Đồng — SportHub (SWP391 SportsCenter)

> Tài liệu thao tác trực tiếp trên dữ liệu sạch từ [DATABASEchuan.sql](file:///C:/Users/ASUS/Documents/GitHub/SWP391_SportsCenter/DATABASEchuan.sql) (32 bảng chuẩn hóa, 49 khóa ngoại, mốc ngày tự động cập nhật theo `@Today` / `@Now`).

---

## 1. Chuẩn bị Môi trường & Reset Database Trước Giờ Chấm

Chạy lệnh sau tại thư mục gốc repo để nạp lại dữ liệu sạch 100% trước khi demo (script tự xóa toàn bộ bảng/FK cũ trong `SportsCenterDB` nên chạy an toàn ngay cả khi Spring Boot hoặc SSMS đang kết nối; lưu ý dùng đúng cổng `localhost,1433` khớp với `backend/.env` và `application.properties`):

```powershell
sqlcmd -S localhost,1433 -U sa -P 12345 -C -f 65001 -b -i ".\DATABASEchuan.sql"
```

Khởi động Backend & Frontend (2 terminal riêng):

```powershell
# Terminal 1 - Backend (http://localhost:8080)
cd backend
mvn spring-boot:run

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Mở sẵn **4 tab trình duyệt** (hoặc 4 Profile/Incognito) cho 4 vai trò: **Member**, **Receptionist**, **Coach**, **Manager**.

---

## 2. Danh Sách Tài Khoản Đăng Nhập Demo

**Mật khẩu dùng chung cho tất cả tài khoản:** `SportHub@123`

| ID | Vai trò (`role`) | Họ tên | Email đăng nhập | SĐT | RFID / QR Token | Trạng thái & Dữ liệu seed sẵn | Portal URL |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `MANAGER` | Nguyễn Văn Quản Lý | `manager@sporthub.com` | `0901234567` | — | `ACTIVE` — Tài khoản Quản lý chính | `/admin` |
| 2 | `MANAGER` | Trần Thị Giám Đốc | `director@sporthub.com` | `0909876543` | — | `ACTIVE` — Quản lý dự phòng | `/admin` |
| 3 | `RECEPTIONIST` | Lê Thị Lễ Tân | `reception.le@sporthub.com` | `0912345678` | — | `ACTIVE` — Lễ tân ca chính | `/receptionist` |
| 4 | `RECEPTIONIST` | Phạm Minh Tú | `reception.tu@sporthub.com` | `0918765432` | — | `ACTIVE` — Lễ tân ca phụ | `/receptionist` |
| 5 | `COACH` | Trần Văn Minh | `coach.minh@sporthub.com` | `0923456789` | — | `ACTIVE` — HLV Tennis/Pickleball (có lớp hôm nay 19:00 & lịch sử thu nhập) | `/coach` |
| 6 | `COACH` | Nguyễn Hoàng Nam | `coach.nam@sporthub.com` | `0928765432` | — | `ACTIVE` — Có đơn xin nghỉ phép `PENDING` (`request_id=101`) | `/coach` |
| 7 | `COACH` | Võ Tấn Phát | `coach.phat@sporthub.com` | `0921112223` | — | `ACTIVE` — HLV Bóng đá / Điền kinh | `/coach` |
| 8 | `COACH` | Đặng Thu Thảo | `coach.thao@sporthub.com` | `0923334445` | — | `ACTIVE` — HLV Cầu lông / Yoga (có lớp hôm nay 18:00) | `/coach` |
| 9 | `MEMBER` | Nguyễn Anh Khoa | `khoa.member@gmail.com` | `0934567890` | `RFID-SH-0009` / `SPORTHUB-MEMBER-9` | `ACTIVE` — **Hội viên Demo chính**: có thẻ VIP + gói Pickleball, 4 mốc InBody, 2 giáo án, 1 lớp hôm nay, 1 buổi `PRESENT` chờ review, 1 lịch ngày mai để hủy, 1 vợt đang mượn (`loan_id=501`) | `/member` |
| 10 | `MEMBER` | Hoàng Thị Ngọc | `ngoc.hoang@gmail.com` | `0938765432` | `RFID-SH-0010` / `SPORTHUB-MEMBER-10` | `ACTIVE` — Gói VIP Diamond, có lịch sử hoàn tiền thành công | `/member` |
| 11 | `MEMBER` | Bùi Huy Hoàng | `hoang.bui@gmail.com` | `0931112233` | `RFID-SH-0011` / `SPORTHUB-MEMBER-11` | `ACTIVE` — Gói hết hạn (`EXPIRED`), có yêu cầu hoàn tiền `PENDING_APPROVAL` (`refund_id=801`) | `/member` |
| 12 | `MEMBER` | Đỗ Phương Anh | `anh.do@gmail.com` | `0934445566` | `RFID-SH-0012` / `SPORTHUB-MEMBER-12` | `ACTIVE` — Có gói mua tại quầy chờ Manager duyệt (`um_id=5`, `PENDING_APPROVAL`) | `/member` |
| 13 | `MEMBER` | Vũ Trọng Tuấn | `tuan.vu@gmail.com` | `0937778899` | `RFID-SH-0013` / `SPORTHUB-MEMBER-13` | `ACTIVE` — Hội viên cơ bản chưa mua gói (dùng test bán gói mới tại POS) | `/member` |
| 14 | `MEMBER` | Lê Minh Châu | `chau.le@gmail.com` | `0935556677` | `RFID-SH-0014` / `SPORTHUB-MEMBER-14` | `ACTIVE` — VIP Diamond | `/member` |
| 15 | `COACH` | Trương Quốc Bảo | `bao.coach.pending@sporthub.com` | `0926667788` | — | `PENDING` — **Dùng để test Manager duyệt hồ sơ HLV** | — |
| 16 | `MEMBER` | Ngô Thanh Sơn | `son.locked@gmail.com` | `0939990011` | `RFID-SH-0016` / `SPORTHUB-MEMBER-16` | `LOCKED` — **Dùng để test chặn check-in & Manager mở khóa** | — |

### Mã Voucher hợp lệ để gõ trực tiếp khi thanh toán

| Mã Voucher | Loại giảm | Mức giảm | Đơn tối thiểu | Trạng thái |
| :--- | :--- | :--- | :--- | :--- |
| `WELCOME2026` | Phần trăm | 20% (tối đa 200.000đ) | 0đ | `ACTIVE` |
| `SPORTSHUB10` | Phần trăm | 10% (tối đa 100.000đ) | 0đ | `ACTIVE` |
| `VIPMEMBER` | Phần trăm | 15% (tối đa 300.000đ) | 0đ | `ACTIVE` |
| `GIAM50K` | Số tiền cố định | 50.000đ | 150.000đ | `ACTIVE` |
| `SUMMEREND` | Phần trăm | 30% | 0đ | `EXPIRED` *(dùng test báo lỗi hết hạn)* |

---

## 3. Kịch Bản Trình Diễn Trực Tiếp (10–15 Phút)

### Phần 1: Cổng Công Khai & Phân Quyền Hệ Thống (1 phút)
1. Mở trang chủ `/` (chưa đăng nhập): giới thiệu 10 bộ môn, danh sách cơ sở vật chất `/facilities`, bảng giá gói tập `/pricing` đồng bộ từ database (`public_sports`, `public_facilities`, `membership_packages`).
2. Thử truy cập thẳng `/admin` khi chưa đăng nhập -> hệ thống tự điều hướng về `/login` (kiểm chứng bảo vệ route theo JWT & Role).

---

### Phần 2: Luồng Hội Viên (`MEMBER`) — Tab 1 (3–4 phút)
Đăng nhập: `khoa.member@gmail.com` / `SportHub@123`.

1. **Hồ sơ, Thẻ Số & Tiến độ InBody (`/member/profile`)**:
   - Chỉ cho hội đồng xem **Thẻ hội viên số** hiển thị hạng **`VIP`** (tính động từ gói `VIP` đang `ACTIVE`), mã QR `SPORTHUB-MEMBER-9` và mã RFID `RFID-SH-0009`.
   - Mở tab **Sức khỏe & Tiến độ**: xem biểu đồ InBody 4 mốc thời gian (`-42 ngày` -> `hôm qua`: cân nặng 74.0kg -> 71.5kg, cơ xương 32.1kg -> 34.2kg, 1RM 95kg -> 117.5kg).
2. **Đặt Sân / Đặt Lớp dùng Quota Hội Viên (`/member/book`, `/member/classes`)**:
   - Đặt 1 khung giờ sân ngày mai hoặc đặt lớp `Lớp Pickleball Kỹ Thuật Dink & Volley` (ngày +2): chọn thanh toán bằng **Quyền lợi gói hội viên (`MEMBERSHIP_QUOTA`)** -> tổng tiền `0đ`, trạng thái quota chuyển thành `HELD` (`held_quota` tăng 1, `remaining_quota` giảm 1).
   - *(Tùy chọn)* Thử đặt 1 sân trả phí trực tiếp và nhập voucher `SUMMEREND` (báo hết hạn) rồi đổi sang `GIAM50K` / `SPORTSHUB10` (giảm tiền tức thì).
3. **Chính sách Hủy lịch & Hoàn tiền trước > 2 giờ (`/member/schedule`)**:
   - Chọn lịch ngày mai (`Lớp Tennis Chiến Thuật Đánh Đôi` hoặc `Tennis Court 01` 18:00-19:00) -> bấm **Hủy lịch** / **Gửi yêu cầu hoàn tiền** -> minh họa hệ thống kiểm tra điều kiện thời gian `> 2 giờ` trước giờ bắt đầu.
4. **Đánh giá buổi tập đã tham gia (`/member/reviews`)**:
   - Tại mục buổi tập đủ điều kiện đánh giá, chọn **`Lớp Pickleball Căn Bản K12`** (HLV Trần Văn Minh, trạng thái `PRESENT` đã điểm danh), chấm **5 sao** và gửi nhận xét.
5. **Giáo án & Trợ lý AI (`/member/workout-plans`, `/member/ai-assistant`)**:
   - Mở `Giáo án Sức Mạnh & Phản Xạ Pickleball (Tuần 3)` -> tick hoàn thành 1 bài tập.
   - Chuyển qua `/member/ai-assistant` hỏi nhanh một câu tư vấn lịch tập dựa trên chỉ số InBody hiện tại.

---

### Phần 3: Luồng Lễ Tân (`RECEPTIONIST`) — Tab 2 (2–3 phút)
Đăng nhập: `reception.le@sporthub.com` / `SportHub@123`.

1. **Check-in Bằng RFID / QR / SĐT (`/receptionist/checkin`)**:
   - Nhập `RFID-SH-0016` (hoặc SĐT `0939990011` của `Ngô Thanh Sơn`) -> hệ thống hiển thị trạng thái **`LOCKED`** và chặn check-in.
   - Nhập `RFID-SH-0009` (hoặc `SPORTHUB-MEMBER-9` / `0934567890` của `Nguyễn Anh Khoa`) -> hiện đầy đủ thông tin thẻ `VIP`, gói còn hạn và các buổi tập hôm nay -> bấm **Xác nhận Check-in**.
2. **Quản lý Mượn / Trả Thiết Bị (`/receptionist/equipment`)**:
   - Chọn phiếu đang mượn **`loan_id=501`** (`Nguyễn Anh Khoa` mượn `Vợt Tennis Wilson Pro Staff`, `30.000đ/giờ`) -> bấm **Trả thiết bị**, hệ thống tự tính phí thuê và cộng trả `available_quantity` về kho (`19 -> 20`).
3. **Bán Gói Hội Viên tại Quầy POS (`/receptionist/pos`)**:
   - Tìm hội viên `Vũ Trọng Tuấn` (`0937778899`), chọn gói `Gói Tập Cầu Lông Học Sinh / Sinh Viên` (`800.000đ`), áp mã `SPORTSHUB10`, thu tiền mặt (`CASH`) -> tạo giao dịch `PAID` và gói `PENDING_APPROVAL` chờ Manager kích hoạt.
4. **Lớp hôm nay & Chốt ca (`/receptionist/classes`, `/receptionist/shift`)**:
   - Xem tổng kết doanh thu ca làm việc của Lễ tân theo thời gian thực.

---

### Phần 4: Luồng Huấn Luyện Viên (`COACH`) — Tab 3 (2 phút)
Đăng nhập: `coach.minh@sporthub.com` / `SportHub@123`.

1. **Điểm danh & Kết sổ Quota (`/coach/attendance`)**:
   - Mở buổi **`Lớp Pickleball Nâng Cao K05`** (Hôm nay 19:00): thấy `Nguyễn Anh Khoa` và `Hoàng Thị Ngọc` đang `PENDING`.
   - Đánh dấu **`PRESENT`** cho `Nguyễn Anh Khoa` và nhập ghi chú buổi tập -> quota từ `HELD` chuyển sang `USED` (chính thức trừ lượt gói của hội viên).
2. **Học viên & Giáo án (`/coach/students`)**:
   - Xem hồ sơ sức khỏe, tiền sử chấn thương cổ chân của `Nguyễn Anh Khoa` và giao/cập nhật bài tập về nhà.
3. **Thu nhập & Đánh giá (`/coach/income`, `/coach/reviews`)**:
   - Chỉ cho hội đồng thấy đánh giá 5 sao vừa gửi từ Tab Member đã xuất hiện tức thì tại `/coach/reviews`.
   - Xem bảng kê thu nhập tính theo quy tắc **40% doanh thu lớp, tối thiểu `200.000đ`/buổi không hủy**.

---

### Phần 5: Luồng Quản Lý (`MANAGER`) — Tab 4 (3 phút)
Đăng nhập: `manager@sporthub.com` / `SportHub@123`.

1. **Dashboard Tổng quan (`/admin`)**:
   - Xem tổng doanh thu, biểu đồ phân bổ gói hội viên, đặt sân, lớp học và cảnh báo vận hành.
2. **Trung tâm Phê duyệt Tập trung (`/admin/staff-approvals`)**:
   - **Duyệt Nhân sự / HLV**: chọn `Trương Quốc Bảo` (`bao.coach.pending@sporthub.com`, `PENDING`) -> bấm **Approve** -> kích hoạt tài khoản `ACTIVE`.
   - **Duyệt Gói Hội viên POS**: chọn hồ sơ của `Đỗ Phương Anh` (`um_id=5`, `PENDING_APPROVAL`) (và hồ sơ vừa bán ở bước POS nếu cần) -> bấm **Duyệt** -> gói chuyển `ACTIVE` và cấp đủ `quota_sessions` / `quota_courts`.
   - **Duyệt Hoàn tiền**: chọn yêu cầu **`refund_id=801`** (`Bùi Huy Hoàng` — `350.000đ` — `CRT-2026-0015`) -> bấm **Approve** -> giao dịch chuyển `REFUNDED`.
   - **Duyệt Nghỉ phép HLV**: chọn đơn **`request_id=101`** của `Nguyễn Hoàng Nam` -> bấm **Duyệt**.
3. **Đối soát Cổng thanh toán (`/admin/payment-reconciliation`)**:
   - Xem biên lai **`receipt_id=6`** (`VNP-CRT-100015` — trạng thái `REVIEW_REQUIRED`) để xử lý đối soát giao dịch VNPay.
4. **Quản lý Hội viên & Nhật ký Hệ thống (`/admin/members`, `/admin/audit-logs`)**:
   - Tìm `Ngô Thanh Sơn` (`son.locked@gmail.com`) -> bấm **Mở khóa (`Unlock`)** chuyển từ `LOCKED` sang `ACTIVE`.
   - Mở `/admin/audit-logs` chứng minh mọi thao tác nhạy cảm (duyệt hoàn tiền, duyệt gói, mở khóa tài khoản, đối soát) đều được lưu vết đầy đủ.

---

## 4. Giải Đáp Nhanh Câu Hỏi Hội Đồng (Business Rules)

- **Cơ chế Quota Hội viên hoạt động thế nào?**
  - Không giảm % cứng trên mỗi lượt đặt lẻ; thay vào đó hội viên mua gói (`VIP`, `CLASS`, `PT`) được cấp `quota_sessions` (buổi lớp) và `quota_courts` (giờ sân).
  - Khi đặt lịch bằng quota: giá hiển thị `0đ`, phương thức `MEMBERSHIP_QUOTA`, quota chuyển sang `HELD`. Khi HLV điểm danh `PRESENT` (hoặc quá giờ sử dụng sân), quota chốt thành `USED`; nếu hủy hợp lệ trước giờ bắt đầu, quota được hoàn trả về `remaining_quota`.
- **Chính sách hủy & hoàn tiền?**
  - Chỉ cho phép hủy/hoàn tiền với booking đã thanh toán còn cách giờ bắt đầu tối thiểu **2 giờ**. Các yêu cầu hoàn tiền về tài khoản ngân hàng đi qua quy trình phê duyệt của Quản lý (`PENDING_APPROVAL` -> `APPROVED` / `REJECTED`) và ghi `audit_logs`.
- **Công thức tính thu nhập Huấn luyện viên?**
  - Tính trên các lớp không bị `CANCELLED`: `MAX(40% × giá buổi × số học viên đã đặt, 200.000đ)`.
- **Đảm bảo tính toàn vẹn dữ liệu thanh toán?**
  - Tách 3 lớp: `payment_transactions` (sổ cái nghiệp vụ) -> `payment_attempts` (phiên thanh toán VNPay có `expires_at`) -> `gateway_receipts` (biên lai IPN/đối soát, gắn cờ `REVIEW_REQUIRED` khi có sai lệch hoặc hoàn tiền).
