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

IF OBJECT_ID(N'dbo.auth_sessions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.auth_sessions (
        token_hash CHAR(64) NOT NULL PRIMARY KEY,
        user_id BIGINT NOT NULL,
        expires_at DATETIME2 NOT NULL
    )
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
