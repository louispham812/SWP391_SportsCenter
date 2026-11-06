CREATE DATABASE SportsCenterDB;
GO

USE SportsCenterDB;
GO

-- =============================================================================
-- 1. BẢNG NGƯỜI DÙNG (users)
-- FIXED: INT → BIGINT, added require_password_change, added 'PENDING' to status, VARCHAR → NVARCHAR(MAX) for avatar
-- =============================================================================
CREATE TABLE users (
    user_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(100) NOT NULL,
    phone VARCHAR(15) NULL,
    avatar NVARCHAR(MAX) NULL,
    date_of_birth DATE NULL,
    gender NVARCHAR(20) NULL,
    address NVARCHAR(500) NULL,
    emergency_contact_name NVARCHAR(100) NULL,
    emergency_contact_phone NVARCHAR(15) NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('MANAGER', 'RECEPTIONIST', 'COACH', 'MEMBER')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'PENDING')),
    require_password_change BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- =============================================================================
-- 2. HỒ SƠ SỨC KHỎE HỌC VIÊN (member_health_profiles)
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE member_health_profiles (
    profile_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL UNIQUE,
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
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE sports (
    sport_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sport_name NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX) NULL
);
GO

-- =============================================================================
-- 4. BẢNG SÂN TẬP / PHÒNG TẬP (facilities)
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE facilities (
    facility_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    facility_name NVARCHAR(100) NOT NULL,
    sport_id BIGINT NOT NULL,
    capacity INT NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'MAINTENANCE')),
    FOREIGN KEY (sport_id) REFERENCES sports(sport_id)
);
GO

-- =============================================================================
-- 5. BẢNG MÃ GIẢM GIÁ (vouchers)
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE vouchers (
    voucher_id BIGINT IDENTITY(1,1) PRIMARY KEY,
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
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE membership_packages (
    package_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    sport_id BIGINT NULL,
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
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE user_memberships (
    um_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'EXPIRED', 'FROZEN')),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (package_id) REFERENCES membership_packages(package_id)
);
GO

-- =============================================================================
-- 8. BẢNG LỚP HỌC / LỊCH DẠY (class_sessions)
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE class_sessions (
    session_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    class_name NVARCHAR(100) NOT NULL,
    sport_id BIGINT NOT NULL,
    coach_id BIGINT NOT NULL,
    facility_id BIGINT NOT NULL,
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
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE bookings (
    booking_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
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
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE payments (
    payment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    um_id BIGINT NULL,
    voucher_id BIGINT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('ONLINE', 'CASH', 'TRANSFER', 'POS')),
    payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),
    approved_by BIGINT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (member_id) REFERENCES users(user_id),
    FOREIGN KEY (um_id) REFERENCES user_memberships(um_id),
    FOREIGN KEY (voucher_id) REFERENCES vouchers(voucher_id),
    FOREIGN KEY (approved_by) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 11. BẢNG ĐÁNH GIÁ (feedbacks)
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE feedbacks (
    feedback_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
    coach_id BIGINT NOT NULL,
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
-- FIXED: INT → BIGINT for foreign keys
-- =============================================================================
CREATE TABLE member_check_ins (
    check_in_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    checked_in_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    result NVARCHAR(20) NOT NULL CHECK (result IN (N'VALID', N'REJECTED')),
    recorded_by BIGINT NOT NULL,
    CONSTRAINT FK_member_check_ins_member FOREIGN KEY (member_id) REFERENCES users(user_id),
    CONSTRAINT FK_member_check_ins_recorder FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 13. BẢNG ĐƠN XIN NGHỈ HLV (coach_leave_requests)
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE coach_leave_requests (
    request_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    coach_id BIGINT NOT NULL,
    coach_name NVARCHAR(100) NULL,
    leave_type NVARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason NVARCHAR(1000) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'PENDING',
    approved_by BIGINT NULL,
    affected_bookings_count INT NOT NULL DEFAULT 0,
    reassigned_coach_id BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_coach_leave_coach FOREIGN KEY (coach_id) REFERENCES users(user_id),
    CONSTRAINT FK_coach_leave_approver FOREIGN KEY (approved_by) REFERENCES users(user_id),
    CONSTRAINT FK_coach_leave_reassigned FOREIGN KEY (reassigned_coach_id) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 14. BẢNG DỤNG CỤ & CHO THUÊ (equipments & equipment_loans)
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE equipments (
    item_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    item_name NVARCHAR(150) NOT NULL,
    category NVARCHAR(50) NOT NULL,
    rental_price_per_hour DECIMAL(12,2) NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'ACTIVE'
);
GO

CREATE TABLE equipment_loans (
    loan_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    member_name NVARCHAR(100) NULL,
    phone NVARCHAR(20) NULL,
    item_id BIGINT NOT NULL,
    item_name NVARCHAR(150) NULL,
    quantity INT NOT NULL DEFAULT 1,
    rental_price_per_hour DECIMAL(12,2) NOT NULL,
    loaned_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    returned_at DATETIME2 NULL,
    rental_fee DECIMAL(12,2) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT N'BORROWED',
    payment_method NVARCHAR(20) NULL,
    recorded_by BIGINT NULL,
    CONSTRAINT FK_equipment_loans_member FOREIGN KEY (member_id) REFERENCES users(user_id),
    CONSTRAINT FK_equipment_loans_item FOREIGN KEY (item_id) REFERENCES equipments(item_id),
    CONSTRAINT FK_equipment_loans_recorder FOREIGN KEY (recorded_by) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- 15. BẢNG PHẢN HỒI & HỖ TRỢ (support_tickets)
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE support_tickets (
    ticket_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
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
-- FIXED: INT → BIGINT
-- =============================================================================
CREATE TABLE refund_requests (
    refund_id BIGINT IDENTITY(1,1) PRIMARY KEY,
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
    status NVARCHAR(20) NOT NULL DEFAULT N'PENDING',
    approved_by BIGINT NULL,
    decision_note NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_refund_requests_member FOREIGN KEY (member_id) REFERENCES users(user_id),
    CONSTRAINT FK_refund_requests_approver FOREIGN KEY (approved_by) REFERENCES users(user_id)
);
GO

-- =============================================================================
-- SEED DATA (DỮ LIỆU MẪU)
-- FIXED: Plain text passwords → BCrypt hashed passwords
-- Password for all users: SportHub@123
-- BCrypt hash (rounds=10): $2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq
-- =============================================================================

-- Seed users (WITH BCRYPT HASHED PASSWORDS)
INSERT INTO users (full_name, email, password, phone, role, status, require_password_change) VALUES 
(N'Nguyễn Văn Quản Lý', 'manager@sporthub.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0901234567', 'MANAGER', 'ACTIVE', 0),
(N'Trần Thị Giám Đốc', 'director@sporthub.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0909876543', 'MANAGER', 'ACTIVE', 0),
(N'Lê Thị Lễ Tân', 'reception.le@sporthub.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0912345678', 'RECEPTIONIST', 'ACTIVE', 0),
(N'Phạm Minh Tú', 'reception.tu@sporthub.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0918765432', 'RECEPTIONIST', 'ACTIVE', 0),
(N'Trần Văn Minh', 'coach.minh@sporthub.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0923456789', 'COACH', 'ACTIVE', 0),
(N'Nguyễn Hoàng Nam', 'coach.nam@sporthub.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0928765432', 'COACH', 'ACTIVE', 0),
(N'Võ Tấn Phát', 'coach.phat@sporthub.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0921112223', 'COACH', 'ACTIVE', 0),
(N'Đặng Thu Thảo', 'coach.thao@sporthub.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0923334445', 'COACH', 'ACTIVE', 0),
(N'Nguyễn Anh Khoa', 'khoa.member@gmail.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0934567890', 'MEMBER', 'ACTIVE', 0),
(N'Hoàng Thị Ngọc', 'ngoc.hoang@gmail.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0938765432', 'MEMBER', 'ACTIVE', 0),
(N'Bùi Huy Hoàng', 'hoang.bui@gmail.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0931112233', 'MEMBER', 'ACTIVE', 0),
(N'Đỗ Phương Anh', 'anh.do@gmail.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0934445566', 'MEMBER', 'ACTIVE', 0),
(N'Vũ Trọng Tuấn', 'tuan.vu@gmail.com', '$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq', '0937778899', 'MEMBER', 'ACTIVE', 0);
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
-- END OF SQL SCRIPT
-- All tables have been created with BIGINT IDs and proper constraints
-- =============================================================================


-- =============================================================================
-- BẢNG PUBLIC_SPORTS (Danh sách môn thể thao công khai)
-- =============================================================================
CREATE TABLE public_sports (
    sport_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    slug NVARCHAR(80) NOT NULL UNIQUE,
    name NVARCHAR(100) NOT NULL,
    subtitle NVARCHAR(150) NULL,
    tag NVARCHAR(80) NULL,
    description NVARCHAR(1000) NULL,
    icon NVARCHAR(80) NULL,
    area NVARCHAR(150) NULL,
    active BIT NOT NULL DEFAULT 1
);
GO

-- Seed public_sports
INSERT INTO public_sports (slug, name, subtitle, tag, description, icon, area, active) VALUES
(N'gym-fitness', N'Gym & Fitness', N'Trang thiết bị hiện đại', N'Olympic Spec', N'Máy tập Technogym và Hammer Strength, khu tạ tự do chuẩn Olympic cùng thiết bị hỗ trợ đo lường.', N'fitness_center', N'Khu vực 800m²', 1),
(N'pickleball', N'Sân Pickleball', N'Cụm 5 sân có mái che', N'Hot Trend', N'Mặt sân giảm chấn và hệ thống đèn phục vụ luyện tập, thi đấu cả ngày lẫn đêm.', N'sports_tennis', N'Đạt chuẩn USAPA', 1),
(N'tennis', N'Quần vợt Tennis', N'Sân chuẩn thi đấu', N'Chuẩn ITF', N'Sân đất nện nhân tạo và sân cứng, tích hợp máy bắn bóng cùng khu vực thay đồ.', N'sports_baseball', N'7 sân', 1),
(N'yoga-pilates', N'Yoga & Pilates', N'Không gian tĩnh lặng', N'Phục hồi', N'Phòng tập yên tĩnh với thiết bị Reformer, phù hợp cho luyện tập và phục hồi thể chất.', N'self_improvement', N'Lớp tối đa 8 người', 1),
(N'football', N'Bóng đá', N'Sân bóng đá', N'Thể thao đồng đội', N'Bộ môn bóng đá dành cho luyện tập và thi đấu theo nhóm.', N'sports_soccer', N'Sân bóng đá', 1),
(N'badminton', N'Cầu lông', N'Sân cầu lông', N'Phổ biến', N'Bộ môn cầu lông dành cho luyện tập cá nhân và thi đấu đôi.', N'sports_tennis', N'Sân trong nhà', 1),
(N'volleyball', N'Bóng chuyền', N'Sân bóng chuyền', N'Thể thao đồng đội', N'Bộ môn bóng chuyền dành cho luyện tập và thi đấu theo đội.', N'sports_volleyball', N'Sân bóng chuyền', 1),
(N'table-tennis', N'Bóng bàn', N'Bàn bóng bàn', N'Phản xạ', N'Bộ môn bóng bàn phù hợp cho luyện tập kỹ thuật và thi đấu đơn hoặc đôi.', N'table_restaurant', N'Khu bóng bàn', 1),
(N'swimming', N'Bơi lội', N'Hồ bơi', N'Thể thao dưới nước', N'Bộ môn bơi lội dành cho luyện tập thể lực và cải thiện kỹ thuật bơi.', N'pool', N'Hồ bơi', 1),
(N'athletics', N'Điền kinh', N'Đường chạy điền kinh', N'Rèn thể lực', N'Bộ môn điền kinh gồm các hoạt động chạy bộ và rèn luyện sức bền.', N'directions_run', N'Đường chạy', 1);
GO

-- =============================================================================
-- BẢNG PUBLIC_FACILITIES (Danh sách tiện ích công khai)
-- =============================================================================
CREATE TABLE public_facilities (
    facility_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    slug NVARCHAR(80) NOT NULL UNIQUE,
    name NVARCHAR(120) NOT NULL,
    description NVARCHAR(1000) NULL,
    icon NVARCHAR(80) NULL,
    highlight NVARCHAR(150) NULL,
    active BIT NOT NULL DEFAULT 1
);
GO

-- =============================================================================
-- BẢNG SPORTS_COURTS (Sân thể thao)
-- =============================================================================
CREATE TABLE sports_courts (
    court_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    sport_id BIGINT NOT NULL,
    court_name NVARCHAR(120) NOT NULL,
    description NVARCHAR(500) NULL,
    hourly_rate DECIMAL(12,2) NOT NULL,
    opens_at TIME NOT NULL,
    closes_at TIME NOT NULL,
    active BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (sport_id) REFERENCES public_sports(sport_id)
);
GO

-- =============================================================================
-- BẢNG PAYMENT_TRANSACTIONS (Giao dịch thanh toán)
-- =============================================================================
CREATE TABLE payment_transactions (
    payment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    booking_type NVARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method NVARCHAR(40) NOT NULL,
    payment_status NVARCHAR(20) NOT NULL,
    reference_code NVARCHAR(64) NOT NULL UNIQUE,
    created_at DATETIME2 NOT NULL
);
GO

-- =============================================================================
-- BẢNG COURT_BOOKINGS (Đặt sân)
-- =============================================================================
CREATE TABLE court_bookings (
    court_booking_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    member_id BIGINT NOT NULL,
    court_id BIGINT NOT NULL,
    start_time DATETIME2 NOT NULL,
    end_time DATETIME2 NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_id BIGINT NOT NULL,
    status NVARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL,
    FOREIGN KEY (court_id) REFERENCES sports_courts(court_id),
    FOREIGN KEY (payment_id) REFERENCES payment_transactions(payment_id)
);
GO

-- =============================================================================
-- BẢNG AUTH_SESSIONS (Phiên đăng nhập)
-- =============================================================================
CREATE TABLE auth_sessions (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expires_at DATETIME2 NOT NULL
);
GO

-- =============================================================================
-- BẢNG VERIFICATION_TOKENS (OTP & Reset Password)
-- =============================================================================
CREATE TABLE verification_tokens (
    token_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(100) NOT NULL,
    token_hash NVARCHAR(64) NOT NULL,
    token_type NVARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL,
    used_at DATETIME2 NULL,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked BIT NOT NULL DEFAULT 0
);
GO

CREATE INDEX idx_email_type ON verification_tokens(email, token_type);
CREATE INDEX idx_token_hash ON verification_tokens(token_hash);
CREATE INDEX idx_expires_at ON verification_tokens(expires_at);
GO

-- =============================================================================
-- BẢNG AUDIT_LOGS (Nhật ký hệ thống)
-- =============================================================================
CREATE TABLE audit_logs (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    log_type NVARCHAR(50) NOT NULL,
    user_email NVARCHAR(100) NULL,
    user_id BIGINT NULL,
    ip_address NVARCHAR(50) NULL,
    user_agent NVARCHAR(500) NULL,
    action_detail NVARCHAR(MAX) NULL,
    status NVARCHAR(20) NOT NULL,
    error_message NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX idx_log_type ON audit_logs(log_type);
CREATE INDEX idx_user_email ON audit_logs(user_email);
CREATE INDEX idx_created_at ON audit_logs(created_at);
GO
