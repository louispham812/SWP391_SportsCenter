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

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
    EXEC(N'
        DECLARE @statusConstraintName sysname;
        DECLARE @dropStatusConstraintSql nvarchar(500);
        WHILE 1 = 1
        BEGIN
            SELECT TOP (1) @statusConstraintName = name
            FROM sys.check_constraints
            WHERE parent_object_id = OBJECT_ID(N''dbo.users'')
              AND definition LIKE N''%status%''
              AND definition NOT LIKE N''%PENDING%'';

            IF @statusConstraintName IS NULL BREAK;

            SET @dropStatusConstraintSql = N''ALTER TABLE dbo.users DROP CONSTRAINT ''
                + QUOTENAME(@statusConstraintName);
            EXEC(@dropStatusConstraintSql);
            SET @statusConstraintName = NULL;
        END
    ');

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE parent_object_id = OBJECT_ID(N'dbo.users')
         AND definition LIKE N'%status%'
         AND definition LIKE N'%PENDING%'
         AND definition LIKE N'%ACTIVE%'
         AND definition LIKE N'%INACTIVE%'
         AND definition LIKE N'%LOCKED%'
   )
    ALTER TABLE dbo.users
        ADD CONSTRAINT CK_users_registration_status
        CHECK (status IN ('ACTIVE', 'PENDING', 'INACTIVE', 'LOCKED'));

IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.users', N'date_of_birth') IS NULL
    ALTER TABLE dbo.users ADD date_of_birth DATE NULL;
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.users', N'gender') IS NULL
    ALTER TABLE dbo.users ADD gender NVARCHAR(20) NULL;
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.users', N'address') IS NULL
    ALTER TABLE dbo.users ADD address NVARCHAR(500) NULL;
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.users', N'emergency_contact_name') IS NULL
    ALTER TABLE dbo.users ADD emergency_contact_name NVARCHAR(100) NULL;
IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.users', N'emergency_contact_phone') IS NULL
    ALTER TABLE dbo.users ADD emergency_contact_phone NVARCHAR(15) NULL;

IF OBJECT_ID(N'dbo.member_health_profiles', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.member_health_profiles', N'smm_kg') IS NULL
    ALTER TABLE dbo.member_health_profiles ADD smm_kg DECIMAL(5,2) NULL;
IF OBJECT_ID(N'dbo.member_health_profiles', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.member_health_profiles', N'pbf_percent') IS NULL
    ALTER TABLE dbo.member_health_profiles ADD pbf_percent DECIMAL(5,2) NULL;
IF OBJECT_ID(N'dbo.member_health_profiles', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.member_health_profiles', N'bmi') IS NULL
    ALTER TABLE dbo.member_health_profiles ADD bmi DECIMAL(5,2) NULL;

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

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'football')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'football', N'Bóng đá', N'Sân bóng đá', N'Thể thao đồng đội',
            N'Bộ môn bóng đá dành cho luyện tập và thi đấu theo nhóm.', N'sports_soccer', N'Sân bóng đá', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'badminton')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'badminton', N'Cầu lông', N'Sân cầu lông', N'Phổ biến',
            N'Bộ môn cầu lông dành cho luyện tập cá nhân và thi đấu đôi.', N'sports_tennis', N'Sân trong nhà', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'volleyball')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'volleyball', N'Bóng chuyền', N'Sân bóng chuyền', N'Thể thao đồng đội',
            N'Bộ môn bóng chuyền dành cho luyện tập và thi đấu theo đội.', N'sports_volleyball', N'Sân bóng chuyền', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'table-tennis')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'table-tennis', N'Bóng bàn', N'Bàn bóng bàn', N'Phản xạ',
            N'Bộ môn bóng bàn phù hợp cho luyện tập kỹ thuật và thi đấu đơn hoặc đôi.', N'table_restaurant', N'Khu bóng bàn', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'swimming')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'swimming', N'Bơi lội', N'Hồ bơi', N'Thể thao dưới nước',
            N'Bộ môn bơi lội dành cho luyện tập thể lực và cải thiện kỹ thuật bơi.', N'pool', N'Hồ bơi', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.public_sports WHERE slug = N'athletics')
    INSERT INTO dbo.public_sports (slug, name, subtitle, tag, description, icon, area, active)
    VALUES (N'athletics', N'Điền kinh', N'Đường chạy điền kinh', N'Rèn thể lực',
            N'Bộ môn điền kinh gồm các hoạt động chạy bộ và rèn luyện sức bền.', N'directions_run', N'Đường chạy', 1);

IF OBJECT_ID(N'dbo.sports', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM dbo.sports WHERE sport_id BETWEEN 5 AND 10)
    INSERT INTO dbo.sports (sport_name, description)
    VALUES
        (N'Bóng đá', N'Sân bóng đá cỏ nhân tạo.'),
        (N'Cầu lông', N'Sân cầu lông trong nhà.'),
        (N'Bóng chuyền', N'Sân bóng chuyền.'),
        (N'Bóng bàn', N'Khu bàn bóng bàn.'),
        (N'Bơi lội', N'Hồ bơi và làn bơi.'),
        (N'Điền kinh', N'Đường chạy điền kinh.');

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

INSERT INTO dbo.sports_courts (sport_id, court_name, description, hourly_rate, opens_at, closes_at, active)
SELECT sport.sport_id, seed.court_name, seed.description, seed.hourly_rate,
       seed.opens_at, seed.closes_at, 1
FROM (VALUES
    (N'football', N'Sân bóng đá 7 người 01', N'Sân cỏ nhân tạo 7 người.', 500000, '06:00', '22:00'),
    (N'football', N'Sân bóng đá 7 người 02', N'Sân cỏ nhân tạo 7 người, có đèn buổi tối.', 550000, '06:00', '22:00'),
    (N'badminton', N'Sân cầu lông 01', N'Sân cầu lông trong nhà.', 100000, '06:00', '22:00'),
    (N'badminton', N'Sân cầu lông 02', N'Sân cầu lông trong nhà, thảm tiêu chuẩn.', 120000, '06:00', '22:00'),
    (N'volleyball', N'Sân bóng chuyền 01', N'Sân bóng chuyền trong nhà.', 250000, '06:00', '22:00'),
    (N'volleyball', N'Sân bóng chuyền 02', N'Sân bóng chuyền đa năng.', 280000, '06:00', '22:00'),
    (N'table-tennis', N'Bàn bóng bàn 01', N'Bàn bóng bàn khu luyện tập.', 50000, '06:00', '22:00'),
    (N'table-tennis', N'Bàn bóng bàn 02', N'Bàn bóng bàn thi đấu.', 60000, '06:00', '22:00'),
    (N'swimming', N'Làn bơi 01', N'Làn bơi tiêu chuẩn.', 180000, '06:00', '21:00'),
    (N'swimming', N'Làn bơi 02', N'Làn bơi khu luyện tập.', 220000, '06:00', '21:00'),
    (N'athletics', N'Đường chạy 01', N'Khu đường chạy luyện tập.', 80000, '05:00', '21:00'),
    (N'athletics', N'Đường chạy 02', N'Khu đường chạy tiêu chuẩn.', 100000, '05:00', '21:00')
) AS seed(sport_slug, court_name, description, hourly_rate, opens_at, closes_at)
JOIN dbo.public_sports sport ON sport.slug = seed.sport_slug
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.sports_courts existing
    WHERE existing.sport_id = sport.sport_id
      AND existing.court_name = seed.court_name
);

IF OBJECT_ID(N'dbo.facilities', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.public_facilities', N'U') IS NOT NULL
    INSERT INTO dbo.facilities (facility_name, sport_id, capacity, status)
    SELECT seed.facility_name, sport.sport_id, seed.capacity, 'AVAILABLE'
    FROM (VALUES
        (5, N'Sân Bóng Đá 7 Người - Sân F1', 14),
        (5, N'Sân Bóng Đá 7 Người - Sân F2', 14),
        (6, N'Sân Cầu Lông Trong Nhà - Sân B1', 4),
        (6, N'Sân Cầu Lông Trong Nhà - Sân B2', 4),
        (7, N'Sân Bóng Chuyền - Sân V1', 12),
        (7, N'Sân Bóng Chuyền - Sân V2', 12),
        (8, N'Khu Bóng Bàn - Bàn T1', 4),
        (8, N'Khu Bóng Bàn - Bàn T2', 4),
        (9, N'Hồ Bơi - Làn S1', 8),
        (9, N'Hồ Bơi - Làn S2', 8),
        (10, N'Đường Chạy Điền Kinh - Khu A1', 12),
        (10, N'Đường Chạy Điền Kinh - Khu A2', 12)
    ) AS seed(sport_id, facility_name, capacity)
    JOIN dbo.sports sport ON sport.sport_id = seed.sport_id
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.facilities existing WHERE existing.facility_name = seed.facility_name
    );

IF EXISTS (
    SELECT 1
    FROM dbo.facilities facility
    JOIN (VALUES
        (N'Sân Bóng Đá 7 Người - Sân F1', N'booking-football-01'),
        (N'Sân Bóng Đá 7 Người - Sân F2', N'booking-football-02'),
        (N'Sân Cầu Lông Trong Nhà - Sân B1', N'booking-badminton-01'),
        (N'Sân Cầu Lông Trong Nhà - Sân B2', N'booking-badminton-02'),
        (N'Sân Bóng Chuyền - Sân V1', N'booking-volleyball-01'),
        (N'Sân Bóng Chuyền - Sân V2', N'booking-volleyball-02'),
        (N'Khu Bóng Bàn - Bàn T1', N'booking-table-tennis-01'),
        (N'Khu Bóng Bàn - Bàn T2', N'booking-table-tennis-02'),
        (N'Hồ Bơi - Làn S1', N'booking-swimming-01'),
        (N'Hồ Bơi - Làn S2', N'booking-swimming-02'),
        (N'Đường Chạy Điền Kinh - Khu A1', N'booking-athletics-01'),
        (N'Đường Chạy Điền Kinh - Khu A2', N'booking-athletics-02')
    ) AS seed(facility_name, slug) ON seed.facility_name = facility.facility_name
    JOIN dbo.public_facilities publicFacility
      ON publicFacility.facility_id = facility.facility_id
      OR publicFacility.slug = seed.slug
    WHERE publicFacility.facility_id <> facility.facility_id
       OR publicFacility.slug <> seed.slug
)
    THROW 51000, 'Booking facilities must use matching IDs in facilities and public_facilities.', 1;

EXEC(N'SET IDENTITY_INSERT dbo.public_facilities ON;
INSERT INTO dbo.public_facilities (facility_id, slug, name, description, icon, highlight, active)
SELECT facility.facility_id, seed.slug, seed.public_name, seed.description, seed.icon, seed.highlight, 1
FROM dbo.facilities facility
JOIN (VALUES
    (N''Sân Bóng Đá 7 Người - Sân F1'', N''booking-football-01'', N''Sân bóng đá 7 người - Sân F1'', N''Sân cỏ nhân tạo phục vụ lớp học và luyện tập.'', N''sports_soccer'', N''Sân cỏ nhân tạo''),
    (N''Sân Bóng Đá 7 Người - Sân F2'', N''booking-football-02'', N''Sân bóng đá 7 người - Sân F2'', N''Sân cỏ nhân tạo có đèn buổi tối.'', N''sports_soccer'', N''Sân cỏ nhân tạo''),
    (N''Sân Cầu Lông Trong Nhà - Sân B1'', N''booking-badminton-01'', N''Sân cầu lông - Sân B1'', N''Sân cầu lông trong nhà phục vụ lớp học và luyện tập.'', N''sports_tennis'', N''Sân trong nhà''),
    (N''Sân Cầu Lông Trong Nhà - Sân B2'', N''booking-badminton-02'', N''Sân cầu lông - Sân B2'', N''Sân cầu lông trong nhà thảm tiêu chuẩn.'', N''sports_tennis'', N''Sân trong nhà''),
    (N''Sân Bóng Chuyền - Sân V1'', N''booking-volleyball-01'', N''Sân bóng chuyền - Sân V1'', N''Sân trong nhà phục vụ lớp học và luyện tập.'', N''sports_volleyball'', N''Sân trong nhà''),
    (N''Sân Bóng Chuyền - Sân V2'', N''booking-volleyball-02'', N''Sân bóng chuyền - Sân V2'', N''Sân đa năng phục vụ luyện tập và thi đấu.'', N''sports_volleyball'', N''Sân đa năng''),
    (N''Khu Bóng Bàn - Bàn T1'', N''booking-table-tennis-01'', N''Bàn bóng bàn T1'', N''Bàn bóng bàn khu luyện tập.'', N''table_restaurant'', N''Bàn tiêu chuẩn''),
    (N''Khu Bóng Bàn - Bàn T2'', N''booking-table-tennis-02'', N''Bàn bóng bàn T2'', N''Bàn bóng bàn thi đấu.'', N''table_restaurant'', N''Bàn tiêu chuẩn''),
    (N''Hồ Bơi - Làn S1'', N''booking-swimming-01'', N''Hồ bơi - Làn S1'', N''Làn bơi tiêu chuẩn phục vụ lớp học và luyện tập.'', N''pool'', N''Làn bơi''),
    (N''Hồ Bơi - Làn S2'', N''booking-swimming-02'', N''Hồ bơi - Làn S2'', N''Làn bơi khu luyện tập.'', N''pool'', N''Làn bơi''),
    (N''Đường Chạy Điền Kinh - Khu A1'', N''booking-athletics-01'', N''Đường chạy điền kinh A1'', N''Khu đường chạy phục vụ lớp học và luyện tập.'', N''directions_run'', N''Đường chạy''),
    (N''Đường Chạy Điền Kinh - Khu A2'', N''booking-athletics-02'', N''Đường chạy điền kinh A2'', N''Khu đường chạy tiêu chuẩn.'', N''directions_run'', N''Đường chạy'')
) AS seed(facility_name, slug, public_name, description, icon, highlight)
  ON seed.facility_name = facility.facility_name
WHERE NOT EXISTS (
    SELECT 1
    FROM dbo.public_facilities existing
    WHERE existing.facility_id = facility.facility_id
       OR existing.slug = seed.slug
);
SET IDENTITY_INSERT dbo.public_facilities OFF;');

WITH class_seed AS (
    SELECT *
    FROM (VALUES
        (N'football', N'Lớp Bóng Đá Cơ Bản', N'coach.phat@sporthub.com', N'Sân Bóng Đá 7 Người - Sân F1', 1080, 90, 14, 180000),
        (N'badminton', N'Lớp Cầu Lông Căn Bản', N'coach.thao@sporthub.com', N'Sân Cầu Lông Trong Nhà - Sân B1', 1140, 90, 8, 140000),
        (N'volleyball', N'Lớp Bóng Chuyền Căn Bản', N'coach.nam@sporthub.com', N'Sân Bóng Chuyền - Sân V1', 1080, 90, 12, 160000),
        (N'table-tennis', N'Lớp Bóng Bàn Căn Bản', N'coach.minh@sporthub.com', N'Khu Bóng Bàn - Bàn T1', 1140, 60, 8, 120000),
        (N'swimming', N'Lớp Bơi Lội Căn Bản', N'coach.nam@sporthub.com', N'Hồ Bơi - Làn S1', 1020, 60, 8, 170000),
        (N'athletics', N'Lớp Điền Kinh Căn Bản', N'coach.phat@sporthub.com', N'Đường Chạy Điền Kinh - Khu A1', 420, 60, 12, 110000)
    ) AS seed(sport_slug, class_name, coach_email, facility_name, start_minute, duration_minute, max_slots, price_amount)
)
INSERT INTO dbo.class_sessions (
    class_name, sport_id, coach_id, facility_id, start_time, end_time,
    max_slots, booked_slots, status, price_amount
)
SELECT seed.class_name, sport.sport_id, COALESCE(preferredCoach.user_id, anyCoach.user_id),
       facility.facility_id, classTime.start_time,
       DATEADD(MINUTE, seed.duration_minute, classTime.start_time),
       seed.max_slots, 0, 'SCHEDULED', seed.price_amount
FROM class_seed seed
JOIN dbo.public_sports sport ON sport.slug = seed.sport_slug
JOIN dbo.sports legacySport ON legacySport.sport_id = sport.sport_id
JOIN dbo.facilities facility ON facility.facility_name = seed.facility_name
CROSS APPLY (
    SELECT DATEADD(MINUTE, seed.start_minute,
                   DATEADD(DAY, 3, CAST(CAST(GETDATE() AS date) AS datetime))) AS start_time
) classTime
OUTER APPLY (
    SELECT TOP (1) coach.user_id
    FROM dbo.users coach
    WHERE coach.email = seed.coach_email
      AND coach.role = 'COACH'
      AND coach.status = 'ACTIVE'
    ORDER BY coach.user_id
) preferredCoach
OUTER APPLY (
    SELECT TOP (1) coach.user_id
    FROM dbo.users coach
    WHERE coach.role = 'COACH'
      AND coach.status = 'ACTIVE'
    ORDER BY coach.user_id
) anyCoach
WHERE COALESCE(preferredCoach.user_id, anyCoach.user_id) IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.class_sessions existing
      WHERE existing.sport_id = sport.sport_id
        AND existing.class_name = seed.class_name
        AND existing.start_time > GETDATE()
  );

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

IF OBJECT_ID(N'dbo.member_check_ins', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.member_check_ins (
        check_in_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        member_id INT NOT NULL,
        checked_in_at DATETIME2 NOT NULL,
        result NVARCHAR(20) NOT NULL,
        recorded_by INT NOT NULL,
        CONSTRAINT FK_member_check_ins_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
        CONSTRAINT FK_member_check_ins_recorder FOREIGN KEY (recorded_by) REFERENCES dbo.users(user_id),
        CONSTRAINT CK_member_check_ins_result CHECK (result IN ('VALID', 'REJECTED'))
    )
END;

-- BẢNG VOUCHERS (MÃ GIẢM GIÁ / KHUYẾN MÃI)
IF OBJECT_ID(N'dbo.vouchers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.vouchers (
        voucher_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        code NVARCHAR(50) NOT NULL UNIQUE,
        discount_type NVARCHAR(20) NOT NULL CONSTRAINT DF_vouchers_type DEFAULT N'PERCENT',
        discount_value DECIMAL(12,2) NULL,
        discount_percent INT NULL,
        discount_amount DECIMAL(12,2) NULL,
        min_purchase DECIMAL(12,2) NOT NULL CONSTRAINT DF_vouchers_min_purchase DEFAULT 0,
        valid_from DATE NULL,
        valid_until DATE NOT NULL,
        usage_limit INT NOT NULL CONSTRAINT DF_vouchers_usage_limit DEFAULT 100,
        used_count INT NOT NULL CONSTRAINT DF_vouchers_used_count DEFAULT 0,
        applies_to NVARCHAR(50) NOT NULL CONSTRAINT DF_vouchers_applies DEFAULT N'ALL',
        status NVARCHAR(20) NOT NULL CONSTRAINT DF_vouchers_status DEFAULT N'ACTIVE'
    )
END;

IF COL_LENGTH('dbo.vouchers', 'discount_type') IS NULL
    ALTER TABLE dbo.vouchers ADD discount_type NVARCHAR(20) NOT NULL CONSTRAINT DF_vouchers_type DEFAULT N'PERCENT';
IF COL_LENGTH('dbo.vouchers', 'discount_value') IS NULL
    ALTER TABLE dbo.vouchers ADD discount_value DECIMAL(12,2) NULL;
IF COL_LENGTH('dbo.vouchers', 'discount_percent') IS NULL
    ALTER TABLE dbo.vouchers ADD discount_percent INT NULL;
IF COL_LENGTH('dbo.vouchers', 'discount_amount') IS NULL
    ALTER TABLE dbo.vouchers ADD discount_amount DECIMAL(12,2) NULL;
IF COL_LENGTH('dbo.vouchers', 'min_purchase') IS NULL
    ALTER TABLE dbo.vouchers ADD min_purchase DECIMAL(12,2) NOT NULL CONSTRAINT DF_vouchers_min_purchase DEFAULT 0;
IF COL_LENGTH('dbo.vouchers', 'valid_from') IS NULL
    ALTER TABLE dbo.vouchers ADD valid_from DATE NULL;
IF COL_LENGTH('dbo.vouchers', 'used_count') IS NULL
    ALTER TABLE dbo.vouchers ADD used_count INT NOT NULL CONSTRAINT DF_vouchers_used_count DEFAULT 0;
IF COL_LENGTH('dbo.vouchers', 'applies_to') IS NULL
    ALTER TABLE dbo.vouchers ADD applies_to NVARCHAR(50) NOT NULL CONSTRAINT DF_vouchers_applies DEFAULT N'ALL';

IF OBJECT_ID(N'dbo.vouchers', N'U') IS NOT NULL
    EXEC(N'
        DECLARE @voucherStatusConstraint sysname;
        DECLARE @dropVoucherStatusConstraintSql nvarchar(500);
        WHILE 1 = 1
        BEGIN
            SELECT TOP (1) @voucherStatusConstraint = name
            FROM sys.check_constraints
            WHERE parent_object_id = OBJECT_ID(N''dbo.vouchers'')
              AND definition LIKE N''%status%''
              AND definition NOT LIKE N''%INACTIVE%'';

            IF @voucherStatusConstraint IS NULL BREAK;

            SET @dropVoucherStatusConstraintSql = N''ALTER TABLE dbo.vouchers DROP CONSTRAINT ''
                + QUOTENAME(@voucherStatusConstraint);
            EXEC(@dropVoucherStatusConstraintSql);
            SET @voucherStatusConstraint = NULL;
        END
    ');

IF OBJECT_ID(N'dbo.vouchers', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.check_constraints
       WHERE parent_object_id = OBJECT_ID(N'dbo.vouchers')
         AND definition LIKE N'%status%'
         AND definition LIKE N'%INACTIVE%'
   )
    ALTER TABLE dbo.vouchers
        ADD CONSTRAINT CK_vouchers_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED'));

IF COL_LENGTH('dbo.vouchers', 'max_discount_amount') IS NOT NULL
    EXEC(N'UPDATE dbo.vouchers SET discount_amount = max_discount_amount WHERE discount_amount IS NULL AND max_discount_amount IS NOT NULL;');

UPDATE dbo.vouchers SET discount_value = discount_percent WHERE discount_value IS NULL AND discount_percent IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM dbo.vouchers WHERE code = N'TET2026')
    INSERT INTO dbo.vouchers (code, discount_type, discount_value, discount_percent, discount_amount, min_purchase, valid_until, usage_limit, used_count, applies_to, status)
    VALUES (N'TET2026', N'PERCENT', 20, 20, 500000, 500000, '2026-12-31', 200, 15, N'ALL', N'ACTIVE');

IF NOT EXISTS (SELECT 1 FROM dbo.vouchers WHERE code = N'GIAM50K')
    INSERT INTO dbo.vouchers (code, discount_type, discount_value, discount_percent, discount_amount, min_purchase, valid_until, usage_limit, used_count, applies_to, status)
    VALUES (N'GIAM50K', N'FIXED', 50000, NULL, 50000, 150000, '2026-12-31', 500, 48, N'ALL', N'ACTIVE');

IF NOT EXISTS (SELECT 1 FROM dbo.vouchers WHERE code = N'WELCOME20')
    INSERT INTO dbo.vouchers (code, discount_type, discount_value, discount_percent, discount_amount, min_purchase, valid_until, usage_limit, used_count, applies_to, status)
    VALUES (N'WELCOME20', N'PERCENT', 20, 20, 300000, 100000, '2026-12-31', 1000, 89, N'ALL', N'ACTIVE');

-- BẢNG COACH LEAVE REQUESTS (ĐƠN XIN NGHỈ / ĐỔI CA HUẤN LUYỆN VIÊN)
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
    )
END;

IF COL_LENGTH('dbo.coach_leave_requests', 'coach_name') IS NULL
    ALTER TABLE dbo.coach_leave_requests ADD coach_name NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.coach_leave_requests', 'affected_bookings_count') IS NULL
    ALTER TABLE dbo.coach_leave_requests ADD affected_bookings_count INT NOT NULL CONSTRAINT DF_coach_leave_affected DEFAULT 0;
IF COL_LENGTH('dbo.coach_leave_requests', 'reassigned_coach_id') IS NULL
    ALTER TABLE dbo.coach_leave_requests ADD reassigned_coach_id BIGINT NULL;

IF NOT EXISTS (SELECT 1 FROM dbo.coach_leave_requests WHERE request_id = 101)
    EXEC(N'SET IDENTITY_INSERT dbo.coach_leave_requests ON;
    INSERT INTO dbo.coach_leave_requests (request_id, coach_id, coach_name, leave_type, start_date, end_date, reason, status, affected_bookings_count, created_at)
    VALUES (101, 2, N''Coach Nguyễn Văn A'', N''SICK_LEAVE'', ''2026-10-25'', ''2026-10-26'', N''Sốt xuất huyết cần theo dõi tại cơ sở y tế'', N''PENDING'', 2, ''2026-10-20T08:00:00'');
    SET IDENTITY_INSERT dbo.coach_leave_requests OFF;');

-- BẢNG DỤNG CỤ & THIẾT BỊ CHO THUÊ (REC-13)
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
    )
END;

IF NOT EXISTS (SELECT 1 FROM dbo.equipments WHERE item_name = N'Vợt Tennis Wilson Pro Staff')
    INSERT INTO dbo.equipments (item_name, category, rental_price_per_hour, total_quantity, available_quantity, status)
    VALUES (N'Vợt Tennis Wilson Pro Staff', N'Vợt', 30000, 20, 16, N'ACTIVE');

IF NOT EXISTS (SELECT 1 FROM dbo.equipments WHERE item_name = N'Vợt Pickleball Franklin Ben Johns')
    INSERT INTO dbo.equipments (item_name, category, rental_price_per_hour, total_quantity, available_quantity, status)
    VALUES (N'Vợt Pickleball Franklin Ben Johns', N'Vợt', 20000, 30, 24, N'ACTIVE');

IF NOT EXISTS (SELECT 1 FROM dbo.equipments WHERE item_name = N'Giày Thi Đấu Asics Court FF (Size 40-43)')
    INSERT INTO dbo.equipments (item_name, category, rental_price_per_hour, total_quantity, available_quantity, status)
    VALUES (N'Giày Thi Đấu Asics Court FF (Size 40-43)', N'Giày', 40000, 15, 12, N'ACTIVE');

IF NOT EXISTS (SELECT 1 FROM dbo.equipments WHERE item_name = N'Khăn Thể Thao Cao Cấp F Sport')
    INSERT INTO dbo.equipments (item_name, category, rental_price_per_hour, total_quantity, available_quantity, status)
    VALUES (N'Khăn Thể Thao Cao Cấp F Sport', N'Khăn', 0, 50, 42, N'ACTIVE');

IF NOT EXISTS (SELECT 1 FROM dbo.equipments WHERE item_name = N'Rổ Bóng Tennis 50 Quả (Tập phát bóng)')
    INSERT INTO dbo.equipments (item_name, category, rental_price_per_hour, total_quantity, available_quantity, status)
    VALUES (N'Rổ Bóng Tennis 50 Quả (Tập phát bóng)', N'Bóng', 50000, 10, 8, N'ACTIVE');

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
    )
END;

IF COL_LENGTH('dbo.equipment_loans', 'member_name') IS NULL
    ALTER TABLE dbo.equipment_loans ADD member_name NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.equipment_loans', 'phone') IS NULL
    ALTER TABLE dbo.equipment_loans ADD phone NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.equipment_loans', 'item_name') IS NULL
    ALTER TABLE dbo.equipment_loans ADD item_name NVARCHAR(150) NULL;
IF COL_LENGTH('dbo.equipment_loans', 'payment_method') IS NULL
    ALTER TABLE dbo.equipment_loans ADD payment_method NVARCHAR(20) NULL;

IF NOT EXISTS (SELECT 1 FROM dbo.equipment_loans WHERE loan_id = 501)
    EXEC(N'SET IDENTITY_INSERT dbo.equipment_loans ON;
    INSERT INTO dbo.equipment_loans (loan_id, member_id, member_name, phone, item_id, item_name, quantity, rental_price_per_hour, loaned_at, status)
    VALUES (501, 1, N''Nguyễn Văn Member'', N''0901 234 567'', 1, N''Vợt Tennis Wilson Pro Staff'', 1, 30000, DATEADD(minute, -90, SYSDATETIME()), N''BORROWED'');
    SET IDENTITY_INSERT dbo.equipment_loans OFF;');

-- BẢNG PHẢN HỒI & KHIẾU NẠI (SUPPORT TICKETS / COMPLAINTS)
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
    )
END;

IF COL_LENGTH('dbo.support_tickets', 'member_name') IS NULL
    ALTER TABLE dbo.support_tickets ADD member_name NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.support_tickets', 'admin_response') IS NULL
    ALTER TABLE dbo.support_tickets ADD admin_response NVARCHAR(MAX) NULL;

-- BẢNG YÊU CẦU HOÀN TIỀN (REFUND REQUESTS - MEM-31 / MGR-16)
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
    )
END;

IF COL_LENGTH('dbo.refund_requests', 'booking_description') IS NULL
    ALTER TABLE dbo.refund_requests ADD booking_description NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.refund_requests', 'decision_note') IS NULL
    ALTER TABLE dbo.refund_requests ADD decision_note NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM dbo.refund_requests WHERE refund_id = 801)
    EXEC(N'SET IDENTITY_INSERT dbo.refund_requests ON;
    INSERT INTO dbo.refund_requests (refund_id, member_id, member_name, phone, booking_description, refund_amount, reason, status, created_at)
    VALUES (801, 5, N''Vũ Đức Minh'', N''0933 111 222'', N''Thuê sân Tennis Sân 1 (18:00 - 19:00)'', 300000, N''Hủy booking đúng hạn trước 2 giờ theo chính sách MEM-30'', N''PENDING'', ''2026-10-20T15:00:00'');
    INSERT INTO dbo.refund_requests (refund_id, member_id, member_name, phone, booking_description, refund_amount, reason, status, created_at)
    VALUES (802, 7, N''Đỗ Hải Yến'', N''0912 333 444'', N''Lớp Cầu Lông Cơ Bản Kèm HLV'', 180000, N''Vắng có phép được Coach xác nhận EXCUSED_ABSENCE'', N''PENDING'', ''2026-10-19T17:30:00'');
    SET IDENTITY_INSERT dbo.refund_requests OFF;');
