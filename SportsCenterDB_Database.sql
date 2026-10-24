CREATE DATABASE SportsCenterDB;
GO

USE SportsCenterDB;
GO

-- =============================================================================
-- 1. BẢNG NGƯỜI DÙNG (users)
-- =============================================================================
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NULL,
    avatar NVARCHAR(MAX) NULL,
    date_of_birth DATE NULL,
    gender NVARCHAR(20) NULL,
    address NVARCHAR(500) NULL,
    emergency_contact_name NVARCHAR(100) NULL,
    emergency_contact_phone NVARCHAR(15) NULL,
    rfid_code NVARCHAR(64) NULL,
    specialty NVARCHAR(200) NULL,
    experience_years INT NULL,
    certifications NVARCHAR(500) NULL,
    bio NVARCHAR(MAX) NULL,
    availability_json NVARCHAR(MAX) NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('MANAGER', 'RECEPTIONIST', 'COACH', 'MEMBER')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- =============================================================================
-- 2. HỒ SƠ SỨC KHỎE HỌC VIÊN (member_health_profiles)
-- =============================================================================
CREATE TABLE member_health_profiles (
    profile_id INT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL UNIQUE,
    fitness_level VARCHAR(30) DEFAULT 'BEGINNER',
    fitness_goals NVARCHAR(MAX) NULL,
    injury_history NVARCHAR(MAX) NULL,
    weight_kg DECIMAL(5,2) NULL,
    height_cm DECIMAL(5,2) NULL,
    smm_kg DECIMAL(5,2) NULL,
    pbf_percent DECIMAL(5,2) NULL,
    bmi DECIMAL(5,2) NULL,
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (member_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

-- =============================================================================
-- 3. BẢNG MÔN THỂ THAO (sports)
-- =============================================================================
CREATE TABLE sports (
    sport_id INT IDENTITY(1,1) PRIMARY KEY,
    sport_name NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX) NULL
);
GO

-- =============================================================================
-- 4. BẢNG SÂN TẬP / PHÒNG TẬP (facilities)
-- =============================================================================
CREATE TABLE facilities (
    facility_id INT IDENTITY(1,1) PRIMARY KEY,
    facility_name NVARCHAR(100) NOT NULL,
    sport_id INT NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'MAINTENANCE')),
    FOREIGN KEY (sport_id) REFERENCES sports(sport_id)
);
GO

-- =============================================================================
-- 5. BẢNG MÃ GIẢM GIÁ (vouchers)
-- =============================================================================
CREATE TABLE vouchers (
    voucher_id INT IDENTITY(1,1) PRIMARY KEY,
    code NVARCHAR(50) NOT NULL UNIQUE,
    discount_type NVARCHAR(20) NOT NULL DEFAULT N'PERCENT',
    discount_value DECIMAL(12,2) NULL,
    discount_percent INT NULL CHECK (discount_percent BETWEEN 1 AND 100),
    discount_amount DECIMAL(12,2) NULL,
    max_discount_amount DECIMAL(10,2) NULL,
    min_purchase DECIMAL(12,2) NOT NULL DEFAULT 0,
    valid_from DATE NULL,
    valid_until DATE NOT NULL,
    usage_limit INT NOT NULL DEFAULT 100,
    used_count INT NOT NULL DEFAULT 0,
    applies_to NVARCHAR(50) NOT NULL DEFAULT N'ALL',
    status NVARCHAR(20) NOT NULL DEFAULT N'ACTIVE' CHECK (status IN (N'ACTIVE', N'EXPIRED'))
);
GO

-- =============================================================================
-- 6. BẢNG GÓI TẬP (membership_packages)
-- =============================================================================
CREATE TABLE membership_packages (
    package_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    sport_id INT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL,
    access_type VARCHAR(20) DEFAULT 'ALL_DAY' CHECK (access_type IN ('ALL_DAY', 'PEAK', 'OFF_PEAK')),
    description NVARCHAR(MAX) NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    FOREIGN KEY (sport_id) REFERENCES sports(sport_id)
);
GO

-- =============================================================================
-- 7. BẢNG GÓI TẬP CỦA HỌC VIÊN (user_memberships)
-- =============================================================================
CREATE TABLE user_memberships (
    um_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    package_id INT NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'FROZEN')),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (package_id) REFERENCES membership_packages(package_id)
);
GO

-- =============================================================================
-- 8. BẢNG LỚP HỌC / LỊCH DẠY (class_sessions)
-- =============================================================================
CREATE TABLE class_sessions (
    session_id INT IDENTITY(1,1) PRIMARY KEY,
    class_name NVARCHAR(100) NOT NULL,
    sport_id INT NOT NULL,
    coach_id INT NOT NULL,
    facility_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_slots INT NOT NULL,
    booked_slots INT DEFAULT 0,
    price_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    FOREIGN KEY (sport_id) REFERENCES sports(sport_id),
    FOREIGN KEY (coach_id) REFERENCES users(user_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(facility_id)
);
GO

-- =============================================================================
-- 9. BẢNG ĐẶT CHỖ (bookings)
-- =============================================================================
CREATE TABLE bookings (
    booking_id INT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL,
    session_id INT NOT NULL,
    booking_time DATETIME DEFAULT GETDATE(),
    status VARCHAR(20) DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'WAITLIST', 'CANCELLED')),
    attendance_status VARCHAR(20) DEFAULT 'PENDING' CHECK (attendance_status IN ('PENDING', 'PRESENT', 'ABSENT')),
    coach_note NVARCHAR(MAX) NULL,
    homework_note NVARCHAR(MAX) NULL,
    FOREIGN KEY (member_id) REFERENCES users(user_id),
    FOREIGN KEY (session_id) REFERENCES class_sessions(session_id)
);
GO

-- =============================================================================
-- 10. BẢNG THANH TOÁN (payments)
-- =============================================================================
CREATE TABLE payments (
    payment_id INT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL,
    um_id INT NULL,
    voucher_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('ONLINE', 'CASH', 'TRANSFER', 'POS')),
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    approved_by INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (member_id) REFERENCES users(user_id),
    FOREIGN KEY (um_id) REFERENCES user_memberships(um_id),
    FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 11. BẢNG ĐÁNH GIÁ (feedbacks)
-- =============================================================================
CREATE TABLE feedbacks (
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL,
    session_id INT NOT NULL,
    coach_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (member_id) REFERENCES users(user_id),
    FOREIGN KEY (session_id) REFERENCES class_sessions(session_id),
    FOREIGN KEY (coach_id) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 12. BẢNG CHECK-IN HỘI VIÊN (member_check_ins)
-- =============================================================================
CREATE TABLE member_check_ins (
    check_in_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL,
    checked_in_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    result NVARCHAR(20) NOT NULL CHECK (result IN (N'VALID', N'REJECTED')),
    recorded_by INT NOT NULL,
    CONSTRAINT FK_member_check_ins_member FOREIGN KEY (member_id) REFERENCES users(user_id),
    CONSTRAINT FK_member_check_ins_recorder FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 13. BẢNG ĐƠN XIN NGHỈ HLV (coach_leave_requests)
-- =============================================================================
CREATE TABLE coach_leave_requests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    coach_id INT NOT NULL,
    coach_name NVARCHAR(100) NULL,
    leave_type NVARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason NVARCHAR(1000) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'PENDING',
    approved_by INT NULL,
    affected_bookings_count INT NOT NULL DEFAULT 0,
    reassigned_coach_id INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_coach_leave_coach FOREIGN KEY (coach_id) REFERENCES users(user_id),
    CONSTRAINT FK_coach_leave_approver FOREIGN KEY (approved_by) REFERENCES users(user_id),
    CONSTRAINT FK_coach_leave_reassigned FOREIGN KEY (reassigned_coach_id) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 14. BẢNG DỤNG CỤ & CHO THUÊ (equipments & equipment_loans)
-- =============================================================================
CREATE TABLE equipments (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    item_name NVARCHAR(150) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    rental_price_per_hour DECIMAL(12,2) NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'ACTIVE'
);
GO

CREATE TABLE equipment_loans (
    loan_id INT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL,
    member_name NVARCHAR(100) NULL,
    phone NVARCHAR(20) NULL,
    item_id INT NOT NULL,
    item_name NVARCHAR(150) NULL,
    quantity INT NOT NULL DEFAULT 1,
    rental_price_per_hour DECIMAL(12,2) NOT NULL,
    loaned_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    returned_at DATETIME2 NULL,
    rental_fee DECIMAL(12,2) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'BORROWED',
    payment_method NVARCHAR(20) NULL,
    recorded_by INT NULL,
    CONSTRAINT FK_equipment_loans_member FOREIGN KEY (member_id) REFERENCES users(user_id),
    CONSTRAINT FK_equipment_loans_item FOREIGN KEY (item_id) REFERENCES equipments(item_id),
    CONSTRAINT FK_equipment_loans_recorder FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 15. BẢNG PHẢN HỒI & HỖ TRỢ (support_tickets)
-- =============================================================================
CREATE TABLE support_tickets (
    ticket_id INT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL,
    member_name NVARCHAR(100) NULL,
    category NVARCHAR(50) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    severity NVARCHAR(20) NOT NULL DEFAULT N'NORMAL',
    status NVARCHAR(20) NOT NULL DEFAULT N'SUBMITTED',
    admin_response NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_support_tickets_member FOREIGN KEY (member_id) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 16. BẢNG YÊU CẦU HOÀN TIỀN (refund_requests)
-- =============================================================================
CREATE TABLE refund_requests (
    refund_id INT IDENTITY(1,1) PRIMARY KEY,
    member_id INT NOT NULL,
    member_name NVARCHAR(100) NULL,
    phone NVARCHAR(20) NULL,
    transaction_id INT NULL,
    reference_code NVARCHAR(50) NULL,
    booking_description NVARCHAR(255) NULL,
    refund_amount DECIMAL(12,2) NOT NULL,
    reason NVARCHAR(1000) NOT NULL,
    bank_name NVARCHAR(100) NULL,
    bank_account NVARCHAR(50) NULL,
    account_holder NVARCHAR(100) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'PENDING',
    approved_by INT NULL,
    decision_note NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_refund_requests_member FOREIGN KEY (member_id) REFERENCES users(user_id),
    CONSTRAINT FK_refund_requests_approver FOREIGN KEY (approved_by) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- SEED DATA (DỮ LIỆU MẪU)
-- =============================================================================

-- Seed users
INSERT INTO users (full_name, email, password, phone, role, status) VALUES 
(N'Nguyễn Văn Quản Lý', 'manager@sporthub.com', 'SportHub@123', '0901234567', 'MANAGER', 'ACTIVE'),
(N'Trần Thị Giám Đốc', 'director@sporthub.com', 'SportHub@123', '0909876543', 'MANAGER', 'ACTIVE'),
(N'Lê Thị Lễ Tân', 'reception.le@sporthub.com', 'SportHub@123', '0912345678', 'RECEPTIONIST', 'ACTIVE'),
(N'Phạm Minh Tú', 'reception.tu@sporthub.com', 'SportHub@123', '0918765432', 'RECEPTIONIST', 'ACTIVE'),
(N'Trần Văn Minh', 'coach.minh@sporthub.com', 'SportHub@123', '0923456789', 'COACH', 'ACTIVE'),
(N'Nguyễn Hoàng Nam', 'coach.nam@sporthub.com', 'SportHub@123', '0928765432', 'COACH', 'ACTIVE'),
(N'Võ Tấn Phát', 'coach.phat@sporthub.com', 'SportHub@123', '0921112223', 'COACH', 'ACTIVE'),
(N'Đặng Thu Thảo', 'coach.thao@sporthub.com', 'SportHub@123', '0923334445', 'COACH', 'ACTIVE'),
(N'Nguyễn Anh Khoa', 'khoa.member@gmail.com', 'SportHub@123', '0934567890', 'MEMBER', 'ACTIVE'),
(N'Hoàng Thị Ngọc', 'ngoc.hoang@gmail.com', 'SportHub@123', '0938765432', 'MEMBER', 'ACTIVE'),
(N'Bùi Huy Hoàng', 'hoang.bui@gmail.com', 'SportHub@123', '0931112233', 'MEMBER', 'ACTIVE'),
(N'Đỗ Phương Anh', 'anh.do@gmail.com', 'SportHub@123', '0934445566', 'MEMBER', 'ACTIVE'),
(N'Vũ Trọng Tuấn', 'tuan.vu@gmail.com', 'SportHub@123', '0937778899', 'MEMBER', 'ACTIVE');
GO

-- Seed member_health_profiles
INSERT INTO member_health_profiles (member_id, fitness_level, fitness_goals, injury_history, weight_kg, height_cm) VALUES 
(9,  'AMATEUR',  N'Tăng sức bền, rèn kỹ thuật Pickleball', N'Tiền sử lật sơ mi cổ chân trái năm 2024', 68.5, 172.0),
(10, 'BEGINNER', N'Giảm cân, cải thiện vóc dáng',           N'Không có',                                58.0, 160.0),
(11, 'ADVANCED', N'Thi đấu giải Tennis phong trào',         N'Đau cơ vai nhẹ sau các trận đấu kéo dài', 74.0, 178.0),
(12, 'BEGINNER', N'Tập phản xạ và cardio cùng bạn bè',      N'Không có',                                52.0, 158.0);
GO

-- Seed sports (Đã lọc trùng lặp)
INSERT INTO sports (sport_name, description) VALUES 
(N'Pickleball', N'Bộ môn thể thao hiện đại kết hợp giữa Tennis, Cầu lông và Bóng bàn.'),
(N'Tennis',     N'Bộ môn Tennis tiêu chuẩn chuẩn thi đấu quốc tế, sân mặt cứng có đèn chiếu sáng.'),
(N'Bóng đá',    N'Sân bóng đá cỏ nhân tạo 7 người đạt chuẩn, hệ thống thoát nước hiện đại.'),
(N'Cầu lông',   N'Thảm cầu lông Yonex tiêu chuẩn trong nhà, hệ thống điều hòa thoáng mát.'),
(N'Bóng chuyền', N'Sân bóng chuyền đa năng phục vụ luyện tập và thi đấu.'),
(N'Bóng bàn',   N'Khu bàn bóng bàn phục vụ luyện tập và thi đấu.'),
(N'Bơi lội',    N'Hồ bơi và làn bơi phục vụ luyện tập các cấp độ.'),
(N'Điền kinh',  N'Đường chạy phục vụ luyện tập sức bền và điền kinh.');
GO

-- Seed facilities
INSERT INTO facilities (facility_name, sport_id, capacity, status) VALUES 
(N'Cụm Sân Pickleball - Sân P1 (Indoor)', 1, 4, 'AVAILABLE'),
(N'Cụm Sân Pickleball - Sân P2 (Indoor)', 1, 4, 'AVAILABLE'),
(N'Cụm Sân Pickleball - Sân P3 (Outdoor)', 1, 4, 'MAINTENANCE'),
(N'Sân Tennis Đơn & Đôi - Sân T1',        2, 4, 'AVAILABLE'),
(N'Sân Tennis Đơn & Đôi - Sân T2',        2, 4, 'AVAILABLE'),
(N'Sân Cỏ Nhân Tạo 7 Người - Sân A',     3, 14, 'AVAILABLE'),
(N'Sân Cỏ Nhân Tạo 7 Người - Sân B',     3, 14, 'AVAILABLE'),
(N'Sân Cầu Lông Thảm Yonex - Sân L1',     4, 4, 'AVAILABLE'),
(N'Sân Cầu Lông Thảm Yonex - Sân L2',     4, 4, 'AVAILABLE'),
(N'Sân Bóng Chuyền - Sân V1',             5, 12, 'AVAILABLE'),
(N'Khu Bóng Bàn - Bàn T1',                6, 4, 'AVAILABLE'),
(N'Hồ Bơi - Làn S1',                     7, 8, 'AVAILABLE'),
(N'Đường Chạy Điền Kinh - Khu A1',        8, 12, 'AVAILABLE');
GO

-- Seed vouchers
INSERT INTO vouchers (code, discount_percent, max_discount_amount, valid_until, usage_limit, status) VALUES 
(N'WELCOME2026', 20, 200000.00, '2026-12-31', 200, N'ACTIVE'),
(N'SPORTSHUB10', 10, 100000.00, '2026-11-30', 100, N'ACTIVE'),
(N'VIPMEMBER',   15, 300000.00, '2026-12-31', 50,  N'ACTIVE'),
(N'SUMMEREND',   30, 500000.00, '2026-09-30', 0,   N'EXPIRED');
GO

-- Seed membership_packages
INSERT INTO membership_packages (name, sport_id, price, duration_days, access_type, description, status) VALUES 
(N'Thẻ Hội Viên VIP Diamond (Toàn Hệ Thống)', NULL, 2800000.00, 30, 'ALL_DAY',  N'Tập không giới hạn tất cả các bộ môn, free Locker & nước uống.', 'ACTIVE'),
(N'Thẻ Hội Viên Vàng Off-Peak',               NULL, 1500000.00, 30, 'OFF_PEAK', N'Tập tất cả các môn từ 08:00 - 16:00 các ngày trong tuần.',       'ACTIVE'),
(N'Khóa Học Pickleball Căn Bản (10 Buổi)',      1,    1800000.00, 45, 'ALL_DAY',  N'Bao gồm 10 buổi học kỹ thuật cầm vợt, di chuyển cùng HLV.',     'ACTIVE'),
(N'Thẻ Hội Viên Tennis Tháng',                 2,    2000000.00, 30, 'PEAK',     N'Miễn phí đặt sân Tennis vào khung giờ vàng (17:00 - 21:00).',     'ACTIVE'),
(N'Gói Tập Cầu Lông Học Sinh / Sinh Viên',    4,    800000.00,  30, 'OFF_PEAK', N'Dành riêng cho HS-SV với giá ưu đãi.',                         'ACTIVE');
GO

-- Seed user_memberships
INSERT INTO user_memberships (user_id, package_id, start_date, end_date, status) VALUES 
(9,  3, '2026-10-01', '2026-11-15', 'ACTIVE'),
(10, 2, '2026-10-05', '2026-11-05', 'ACTIVE'),
(11, 4, '2026-09-01', '2026-10-01', 'EXPIRED'),
(12, 5, '2026-10-10', '2026-11-10', 'PENDING');
GO

-- Seed class_sessions
INSERT INTO class_sessions (class_name, sport_id, coach_id, facility_id, start_time, end_time, max_slots, booked_slots, status, price_amount) VALUES 
(N'Lớp Tennis Chuyên Kỹ Thuật Serve', 2, 5, 4, '2026-10-12 17:00:00', '2026-10-12 18:30:00', 6, 2, 'SCHEDULED', 200000),
(N'Lớp Pickleball Căn Bản K12',        1, 6, 1, '2026-10-12 18:00:00', '2026-10-12 19:30:00', 8, 3, 'SCHEDULED', 150000),
(N'Lớp Điền Kinh Căn Bản',           8, 7, 13, '2026-10-13 06:30:00', '2026-10-13 08:00:00', 12, 0, 'SCHEDULED', 110000),
(N'Lớp Cầu Lông Phản Xạ Nhanh',       4, 8, 8, '2026-10-13 18:00:00', '2026-10-13 19:30:00',  8, 1, 'SCHEDULED', 150000),
(N'Lớp Pickleball Nâng Cao K05',      1, 6, 2, '2026-10-14 18:00:00', '2026-10-14 19:30:00', 8, 4, 'SCHEDULED', 180000),
(N'Lớp Bóng Bàn Căn Bản',             6, 5, 11, '2026-10-14 18:30:00', '2026-10-14 20:00:00', 8, 0, 'SCHEDULED', 120000),
(N'Lớp Bóng Đá Cơ Bản',                3, 7, 6, '2026-10-15 17:30:00', '2026-10-15 19:00:00', 14, 1, 'SCHEDULED', 180000),
(N'Lớp Bơi Lội Căn Bản',               7, 6, 12, '2026-10-16 16:30:00', '2026-10-16 18:00:00',  8, 0, 'SCHEDULED', 170000),
(N'Lớp Cầu Lông Căn Bản',              4, 8, 9, '2026-10-16 18:30:00', '2026-10-16 20:00:00',  8, 0, 'SCHEDULED', 140000),
(N'Lớp Tennis Chiến Thuật Đánh Đôi',  2, 5, 5, '2026-10-17 08:00:00', '2026-10-17 09:30:00',  6, 4, 'COMPLETED', 220000),
(N'Lớp Bóng Chuyền Căn Bản',          5, 6, 10, '2026-10-17 16:00:00', '2026-10-17 17:30:00', 12, 0, 'SCHEDULED', 160000);
GO

-- Seed bookings
INSERT INTO bookings (member_id, session_id, booking_time, status, attendance_status, coach_note, homework_note) VALUES 
(9,  1, '2026-10-02 09:15:00', 'BOOKED', 'PENDING', NULL, NULL),
(10, 1, '2026-10-02 10:30:00', 'BOOKED', 'PENDING', NULL, NULL),
(11, 3, '2026-10-03 14:00:00', 'BOOKED', 'PENDING', NULL, NULL),
(9,  4, '2026-10-08 11:00:00', 'BOOKED', 'PRESENT', N'Động tác phát bóng tốt, cần chú ý bộ chân khi di chuyển lùi.', N'Tập nhảy dây 500 cái tại nhà'),
(12, 4, '2026-10-08 15:20:00', 'BOOKED', 'PRESENT', N'Cần thả lỏng cổ tay khi giao bóng.', N'Xem lại video kỹ thuật tay cầm vợt Continental'),
(13, 4, '2026-10-08 16:00:00', 'BOOKED', 'ABSENT',  N'Vắng mặt không lý do.', NULL);
GO

-- Seed payments
INSERT INTO payments (member_id, um_id, voucher_id, amount, payment_method, payment_status, approved_by, created_at) VALUES 
(9,  1, 1, 1600000.00, 'ONLINE',   'COMPLETED', 3, '2026-10-01 09:30:00'),
(10, 2, 2, 1350000.00, 'TRANSFER', 'COMPLETED', 3, '2026-10-05 14:15:00'),
(11, 3, NULL, 2000000.00, 'CASH',     'COMPLETED', 3, '2026-09-01 08:00:00'),
(12, 4, NULL, 800000.00,  'POS',      'PENDING',   4, '2026-10-10 10:00:00');
GO

-- Seed feedbacks
INSERT INTO feedbacks (member_id, session_id, coach_id, rating, comment, created_at) VALUES 
(9,  4, 5, 5, N'HLV Minh hướng dẫn rất nhiệt tình, sửa dáng giao bóng chuẩn từng chút một!', '2026-10-10 10:00:00'),
(12, 4, 5, 4, N'Buổi tập vui vẻ, không khí lớp học năng động. Sân bãi sạch đẹp.',        '2026-10-10 10:30:00');
GO

-- =============================================================================
-- 12. BẢNG COACH LEAVE REQUESTS (ĐƠN XIN NGHỈ / ĐỔI CA HUẤN LUYỆN VIÊN)
-- =============================================================================
IF OBJECT_ID(N'dbo.coach_leave_requests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.coach_leave_requests (
        request_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        coach_id BIGINT NOT NULL,
        coach_name NVARCHAR(100) NULL,
        leave_type NVARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason NVARCHAR(1000) NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_coach_leave_status DEFAULT N'PENDING',
        approved_by BIGINT NULL,
        affected_bookings_count INT NOT NULL CONSTRAINT DF_coach_leave_affected DEFAULT 0,
        reassigned_coach_id BIGINT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_coach_leave_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 13. BẢNG DỤNG CỤ & THIẾT BỊ CHO THUÊ
-- =============================================================================
IF OBJECT_ID(N'dbo.equipments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipments (
        item_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        item_name NVARCHAR(150) NOT NULL,
        category NVARCHAR(50) NOT NULL,
        rental_price_per_hour DECIMAL(12,2) NOT NULL,
        total_quantity INT NOT NULL,
        available_quantity INT NOT NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_equipments_status DEFAULT N'ACTIVE'
    );
END;
GO

IF OBJECT_ID(N'dbo.equipment_loans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.equipment_loans (
        loan_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        member_id BIGINT NOT NULL,
        member_name NVARCHAR(100) NULL,
        phone NVARCHAR(20) NULL,
        item_id BIGINT NOT NULL,
        item_name NVARCHAR(150) NULL,
        quantity INT NOT NULL CONSTRAINT DF_equipment_loans_quantity DEFAULT 1,
        rental_price_per_hour DECIMAL(12,2) NOT NULL,
        loaned_at DATETIME2 NOT NULL CONSTRAINT DF_equipment_loans_loaned DEFAULT SYSDATETIME(),
        returned_at DATETIME2 NULL,
        rental_fee DECIMAL(12,2) NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_equipment_loans_status DEFAULT N'BORROWED',
        payment_method NVARCHAR(20) NULL,
        recorded_by BIGINT NULL
    );
END;
GO

-- =============================================================================
-- 14. BẢNG PHẢN HỒI & KHIẾU NẠI (SUPPORT TICKETS)
-- =============================================================================
IF OBJECT_ID(N'dbo.support_tickets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.support_tickets (
        ticket_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        member_id BIGINT NOT NULL,
        member_name NVARCHAR(100) NULL,
        category NVARCHAR(50) NOT NULL,
        title NVARCHAR(200) NOT NULL,
        description NVARCHAR(MAX) NOT NULL,
        severity NVARCHAR(20) NOT NULL CONSTRAINT DF_support_tickets_severity DEFAULT N'NORMAL',
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_support_tickets_status DEFAULT N'SUBMITTED',
        admin_response NVARCHAR(MAX) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_support_tickets_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 15. BẢNG YÊU CẦU HOÀN TIỀN (REFUND REQUESTS)
-- =============================================================================
IF OBJECT_ID(N'dbo.refund_requests', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.refund_requests (
        refund_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        member_id BIGINT NOT NULL,
        member_name NVARCHAR(100) NULL,
        phone NVARCHAR(20) NULL,
        transaction_id BIGINT NULL,
        reference_code NVARCHAR(50) NULL,
        booking_description NVARCHAR(255) NULL,
        refund_amount DECIMAL(12,2) NOT NULL,
        reason NVARCHAR(1000) NOT NULL,
        bank_name NVARCHAR(100) NULL,
        bank_account NVARCHAR(50) NULL,
        account_holder NVARCHAR(100) NULL,
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_refund_requests_status DEFAULT N'PENDING',
        approved_by BIGINT NULL,
        decision_note NVARCHAR(500) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_refund_requests_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 16. BẢNG THÔNG BÁO HỆ THỐNG (NOTIFICATIONS - MEM-25, COA-16, MGR-20)
-- =============================================================================
IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.notifications (
        notification_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        title NVARCHAR(200) NOT NULL,
        message NVARCHAR(MAX) NOT NULL,
        type VARCHAR(30) NULL,
        is_read BIT NOT NULL CONSTRAINT DF_notifications_read DEFAULT 0,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_notifications_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 17. BẢNG NHẬT KÝ HỆ THỐNG (AUDIT LOGS - MGR-14)
-- =============================================================================
IF OBJECT_ID(N'dbo.audit_logs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.audit_logs (
        log_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        actor_id BIGINT NULL,
        actor_name NVARCHAR(100) NULL,
        actor_role VARCHAR(20) NULL,
        action VARCHAR(60) NOT NULL,
        detail NVARCHAR(1000) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_audit_logs_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 18. BẢNG LỊCH BẢO TRÌ SÂN (COURT MAINTENANCE - MGR-19)
-- =============================================================================
IF OBJECT_ID(N'dbo.court_maintenance', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.court_maintenance (
        maintenance_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        court_id BIGINT NOT NULL,
        start_time DATETIME2 NOT NULL,
        end_time DATETIME2 NOT NULL,
        reason NVARCHAR(500) NULL,
        created_by BIGINT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_court_maintenance_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 19. BẢNG KẾ HOẠCH TẬP PT & KẾT QUẢ BUỔI TẬP (COA-07..10, MEM-20..23)
-- =============================================================================
IF OBJECT_ID(N'dbo.workout_plans', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.workout_plans (
        plan_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        member_id BIGINT NOT NULL,
        coach_id BIGINT NULL,
        coach_name NVARCHAR(100) NULL,
        title NVARCHAR(200) NOT NULL,
        goal NVARCHAR(300) NULL,
        exercises_json NVARCHAR(MAX) NOT NULL,
        session_result NVARCHAR(MAX) NULL,
        coach_feedback NVARCHAR(MAX) NULL,
        homework NVARCHAR(MAX) NULL,
        source VARCHAR(20) NOT NULL CONSTRAINT DF_workout_plans_source DEFAULT 'COACH',
        created_at DATETIME2 NOT NULL CONSTRAINT DF_workout_plans_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 20. BẢNG THEO DÕI TIẾN ĐỘ CƠ THỂ & 1RM (COA-08, MEM-21)
-- =============================================================================
IF OBJECT_ID(N'dbo.body_progress_logs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.body_progress_logs (
        progress_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        member_id BIGINT NOT NULL,
        recorded_date DATE NOT NULL,
        weight_kg DECIMAL(5,2) NULL,
        height_cm DECIMAL(5,2) NULL,
        smm_kg DECIMAL(5,2) NULL,
        pbf_percent DECIMAL(5,2) NULL,
        bmi DECIMAL(5,2) NULL,
        max_lift_kg DECIMAL(6,2) NULL,
        note NVARCHAR(300) NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_body_progress_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 21. BẢNG CẤU HÌNH HỆ THỐNG & AI (MGR-15)
-- =============================================================================
IF OBJECT_ID(N'dbo.system_settings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.system_settings (
        setting_key VARCHAR(60) NOT NULL PRIMARY KEY,
        setting_value NVARCHAR(MAX) NULL,
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_system_settings_created DEFAULT SYSDATETIME()
    );
END;
GO

-- =============================================================================
-- 22. DONG BO BOOKED_SLOTS CHO CLASS_SESSIONS VOI BOOKINGS THUC TE
-- =============================================================================
UPDATE s
SET s.booked_slots = ISNULL(b.actual_count, 0)
FROM dbo.class_sessions s
LEFT JOIN (
    SELECT session_id, COUNT(*) AS actual_count
    FROM dbo.bookings
    WHERE status IN ('BOOKED', 'CONFIRMED')
    GROUP BY session_id
) b ON s.session_id = b.session_id;
GO
