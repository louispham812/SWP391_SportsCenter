IF OBJECT_ID(N'dbo.public_sports', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.public_sports (
        sport_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        slug NVARCHAR(80) NOT NULL UNIQUE,
        name NVARCHAR(100) NOT NULL,
        subtitle NVARCHAR(150) NULL,
        tag NVARCHAR(80) NULL,
        description NVARCHAR(1000) NULL,
        icon NVARCHAR(80) NULL,
        area NVARCHAR(150) NULL,
        active BIT NOT NULL CONSTRAINT DF_public_sports_active DEFAULT 1
    )
END;

IF OBJECT_ID(N'dbo.public_facilities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.public_facilities (
        facility_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        slug NVARCHAR(80) NOT NULL UNIQUE,
        name NVARCHAR(120) NOT NULL,
        description NVARCHAR(1000) NULL,
        icon NVARCHAR(80) NULL,
        highlight NVARCHAR(150) NULL,
        active BIT NOT NULL CONSTRAINT DF_public_facilities_active DEFAULT 1
    )
END;

IF OBJECT_ID(N'dbo.sports_courts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.sports_courts (
        court_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        sport_id BIGINT NOT NULL,
        court_name NVARCHAR(120) NOT NULL,
        description NVARCHAR(500) NULL,
        hourly_rate DECIMAL(12,2) NOT NULL,
        opens_at TIME NOT NULL,
        closes_at TIME NOT NULL,
        active BIT NOT NULL CONSTRAINT DF_sports_courts_active DEFAULT 1,
        CONSTRAINT FK_sports_courts_public_sports FOREIGN KEY (sport_id) REFERENCES dbo.public_sports(sport_id)
    )
END;

IF OBJECT_ID(N'dbo.payment_transactions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.payment_transactions (
        payment_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        member_id BIGINT NOT NULL,
        booking_type NVARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_method NVARCHAR(40) NOT NULL,
        payment_status NVARCHAR(20) NOT NULL,
        reference_code NVARCHAR(64) NOT NULL UNIQUE,
        created_at DATETIME2 NOT NULL
    )
END;

IF OBJECT_ID(N'dbo.court_bookings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.court_bookings (
        court_booking_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        member_id BIGINT NOT NULL,
        court_id BIGINT NOT NULL,
        start_time DATETIME2 NOT NULL,
        end_time DATETIME2 NOT NULL,
        amount_paid DECIMAL(12,2) NOT NULL,
        payment_id BIGINT NOT NULL,
        status NVARCHAR(20) NOT NULL,
        created_at DATETIME2 NOT NULL,
        CONSTRAINT FK_court_bookings_sports_courts FOREIGN KEY (court_id) REFERENCES dbo.sports_courts(court_id),
        CONSTRAINT FK_court_bookings_payment_transactions FOREIGN KEY (payment_id) REFERENCES dbo.payment_transactions(payment_id)
    )
END;

IF OBJECT_ID(N'dbo.auth_sessions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_sessions (
        token_hash CHAR(64) NOT NULL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        expires_at DATETIME2 NOT NULL
    )
END;

IF OBJECT_ID(N'dbo.class_sessions', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.class_sessions', N'price_amount') IS NULL
BEGIN
    ALTER TABLE dbo.class_sessions
        ADD price_amount DECIMAL(12,2) NOT NULL
            CONSTRAINT DF_class_sessions_price_amount DEFAULT 0
END;

IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.bookings', N'fee_amount') IS NULL
BEGIN
    ALTER TABLE dbo.bookings
        ADD fee_amount DECIMAL(12,2) NOT NULL
            CONSTRAINT DF_bookings_fee_amount DEFAULT 0
END;

IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.bookings', N'payment_id') IS NULL
BEGIN
    ALTER TABLE dbo.bookings ADD payment_id BIGINT NULL
END;

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'gym-fitness')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'gym-fitness', N'Gym & Fitness', N'Trang thiết bị hiện đại', N'Olympic Spec',
            N'Máy tập Technogym và Hammer Strength, khu tạ tự do chuẩn Olympic cùng thiết bị hỗ trợ đo lường.', N'fitness_center', N'Khu vực 800m²', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'pickleball')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'pickleball', N'Sân Pickleball', N'Cụm 5 sân có mái che', N'Hot Trend',
            N'Mặt sân giảm chấn và hệ thống đèn phục vụ luyện tập, thi đấu cả ngày lẫn đêm.', N'sports_tennis', N'Đạt chuẩn USAPA', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'tennis')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'tennis', N'Quần vợt Tennis', N'Sân chuẩn thi đấu', N'Chuẩn ITF',
            N'Sân đất nện nhân tạo và sân cứng, tích hợp máy bắn bóng cùng khu vực thay đồ.', N'sports_baseball', N'7 sân', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'yoga-pilates')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'yoga-pilates', N'Yoga & Pilates', N'Không gian tĩnh lặng', N'Phục hồi',
            N'Phòng tập yên tĩnh với thiết bị Reformer, phù hợp cho luyện tập và phục hồi thể chất.', N'self_improvement', N'Lớp tối đa 8 người', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.sports_courts c JOIN dbo.public_sports s ON s.sport_id = c.sport_id WHERE s.slug = N'pickleball' AND c.court_name = N'Pickleball Court 01')
    INSERT INTO dbo.sports_courts (sport_id, court_name, description, hourly_rate, opens_at, closes_at, active)
    SELECT sport_id, N'Pickleball Court 01', N'Sân có mái che, mặt sân tiêu chuẩn.', 180000, '06:00', '22:00', 1 FROM dbo.public_sports WHERE slug = N'pickleball';
IF NOT EXISTS (SELECT 1 FROM dbo.sports_courts c JOIN dbo.public_sports s ON s.sport_id = c.sport_id WHERE s.slug = N'pickleball' AND c.court_name = N'Pickleball Court 02')
    INSERT INTO dbo.sports_courts (sport_id, court_name, description, hourly_rate, opens_at, closes_at, active)
    SELECT sport_id, N'Pickleball Court 02', N'Sân mái che khu vực trung tâm.', 200000, '06:00', '22:00', 1 FROM dbo.public_sports WHERE slug = N'pickleball';
IF NOT EXISTS (SELECT 1 FROM dbo.sports_courts c JOIN dbo.public_sports s ON s.sport_id = c.sport_id WHERE s.slug = N'tennis' AND c.court_name = N'Tennis Court 01')
    INSERT INTO dbo.sports_courts (sport_id, court_name, description, hourly_rate, opens_at, closes_at, active)
    SELECT sport_id, N'Tennis Court 01', N'Sân tennis ngoài trời, mặt sân tiêu chuẩn.', 320000, '06:00', '22:00', 1 FROM dbo.public_sports WHERE slug = N'tennis';
IF NOT EXISTS (SELECT 1 FROM dbo.sports_courts c JOIN dbo.public_sports s ON s.sport_id = c.sport_id WHERE s.slug = N'tennis' AND c.court_name = N'Tennis Court 02')
    INSERT INTO dbo.sports_courts (sport_id, court_name, description, hourly_rate, opens_at, closes_at, active)
    SELECT sport_id, N'Tennis Court 02', N'Sân tennis có đèn chiếu sáng buổi tối.', 350000, '06:00', '22:00', 1 FROM dbo.public_sports WHERE slug = N'tennis';
IF NOT EXISTS (SELECT 1 FROM dbo.sports_courts c JOIN dbo.public_sports s ON s.sport_id = c.sport_id WHERE s.slug = N'gym-fitness' AND c.court_name = N'Fitness Studio 01')
    INSERT INTO dbo.sports_courts (sport_id, court_name, description, hourly_rate, opens_at, closes_at, active)
    SELECT sport_id, N'Fitness Studio 01', N'Phòng tập nhóm và tập tự do.', 120000, '06:00', '22:00', 1 FROM dbo.public_sports WHERE slug = N'gym-fitness';
IF NOT EXISTS (SELECT 1 FROM dbo.sports_courts c JOIN dbo.public_sports s ON s.sport_id = c.sport_id WHERE s.slug = N'gym-fitness' AND c.court_name = N'Fitness Studio 02')
    INSERT INTO dbo.sports_courts (sport_id, court_name, description, hourly_rate, opens_at, closes_at, active)
    SELECT sport_id, N'Fitness Studio 02', N'Studio riêng dành cho các buổi tập nhóm.', 150000, '06:00', '22:00', 1 FROM dbo.public_sports WHERE slug = N'gym-fitness';
IF NOT EXISTS (SELECT 1 FROM dbo.sports_courts c JOIN dbo.public_sports s ON s.sport_id = c.sport_id WHERE s.slug = N'yoga-pilates' AND c.court_name = N'Yoga Studio 01')
    INSERT INTO dbo.sports_courts (sport_id, court_name, description, hourly_rate, opens_at, closes_at, active)
    SELECT sport_id, N'Yoga Studio 01', N'Phòng yoga và pilates yên tĩnh.', 160000, '06:00', '22:00', 1 FROM dbo.public_sports WHERE slug = N'yoga-pilates';

IF OBJECT_ID(N'dbo.class_sessions', N'U') IS NOT NULL
    UPDATE dbo.class_sessions
       SET price_amount = 100000 + (session_id % 5) * 25000
     WHERE price_amount = 0;

IF NOT EXISTS (SELECT 1 FROM dbo.public_facilities WHERE slug = N'check-in-qr')
    INSERT INTO dbo.public_facilities (slug, name, description, icon, highlight, active)
    VALUES (N'check-in-qr', N'Check-in QR & RFID',
            N'Hội viên chủ động check-in tại quầy bằng QR hoặc thẻ RFID, giúp việc vào trung tâm thuận tiện hơn.',
            N'lock_open', N'Check-in tự động', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_facilities WHERE slug = N'coach')
    INSERT INTO dbo.public_facilities (slug, name, description, icon, highlight, active)
    VALUES (N'coach', N'Đội ngũ huấn luyện viên',
            N'Đội ngũ huấn luyện viên đồng hành, tư vấn và cá nhân hóa nội dung luyện tập theo mục tiêu hội viên.',
            N'verified_user', N'Kèm 1-1 chuyên sâu', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_facilities WHERE slug = N'ai-assistant')
    INSERT INTO dbo.public_facilities (slug, name, description, icon, highlight, active)
    VALUES (N'ai-assistant', N'Trợ lý luyện tập thông minh',
            N'Trợ lý hỗ trợ giải đáp, theo dõi thông tin thể trạng và gợi ý lộ trình luyện tập phù hợp.',
            N'smart_toy', N'Hỗ trợ luyện tập', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_facilities WHERE slug = N'flexible-hours')
    INSERT INTO dbo.public_facilities (slug, name, description, icon, highlight, active)
    VALUES (N'flexible-hours', N'Thời gian tập linh hoạt',
            N'Lịch hoạt động linh hoạt giúp hội viên chủ động sắp xếp thời gian đến tập và sử dụng dịch vụ.',
            N'access_time', N'Lịch linh hoạt', 1);
