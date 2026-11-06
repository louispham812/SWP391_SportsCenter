USE SportsCenterDB;
SET NOCOUNT ON;

-- 1. Xóa toàn bộ các bản ghi bị lỗi font (Mojibake)
DELETE FROM dbo.class_sessions WHERE session_id >= 12;
DELETE FROM dbo.public_facilities;
DELETE FROM dbo.facilities WHERE facility_id >= 14;
DBCC CHECKIDENT ('dbo.facilities', RESEED, 13);

DELETE FROM dbo.sports_courts WHERE court_id >= 8;
DBCC CHECKIDENT ('dbo.sports_courts', RESEED, 7);

DELETE FROM dbo.equipment_loans;
DELETE FROM dbo.equipments;
DBCC CHECKIDENT ('dbo.equipments', RESEED, 0);

DELETE FROM dbo.refund_requests;
DELETE FROM dbo.coach_leave_requests;

-- 2. Đảm bảo bảng dbo.sports có đầy đủ 10 môn chuẩn UTF-8
SET IDENTITY_INSERT dbo.sports ON;
IF NOT EXISTS (SELECT 1 FROM dbo.sports WHERE sport_id = 9)
    INSERT INTO dbo.sports (sport_id, sport_name, description) VALUES (9, N'Bơi lội', N'Hồ bơi và làn bơi phục vụ luyện tập các cấp độ.');
IF NOT EXISTS (SELECT 1 FROM dbo.sports WHERE sport_id = 10)
    INSERT INTO dbo.sports (sport_id, sport_name, description) VALUES (10, N'Điền kinh', N'Đường chạy phục vụ luyện tập sức bền và điền kinh.');
SET IDENTITY_INSERT dbo.sports OFF;

UPDATE dbo.sports SET sport_name = N'Gym & Fitness', description = N'Khu vực tập Gym, Cardio và rèn luyện thể lực.' WHERE sport_id = 1;
UPDATE dbo.sports SET sport_name = N'Pickleball', description = N'Bộ môn thể thao hiện đại kết hợp giữa Tennis, Cầu lông và Bóng bàn. Phù hợp mọi lứa tuổi.' WHERE sport_id = 2;
UPDATE dbo.sports SET sport_name = N'Tennis', description = N'Bộ môn Tennis tiêu chuẩn chuẩn thi đấu quốc tế, sân mặt cứng có đèn chiếu sáng ban đêm.' WHERE sport_id = 3;
UPDATE dbo.sports SET sport_name = N'Yoga & Pilates', description = N'Phòng tập Yoga và Pilates yên tĩnh tiêu chuẩn.' WHERE sport_id = 4;
UPDATE dbo.sports SET sport_name = N'Bóng đá', description = N'Sân bóng đá cỏ nhân tạo 7 người đạt chuẩn, hệ thống thoát nước hiện đại.' WHERE sport_id = 5;
UPDATE dbo.sports SET sport_name = N'Cầu lông', description = N'Thảm cầu lông Yonex tiêu chuẩn trong nhà, hệ thống điều hòa thoáng mát.' WHERE sport_id = 6;
UPDATE dbo.sports SET sport_name = N'Bóng chuyền', description = N'Sân bóng chuyền đa năng phục vụ luyện tập và thi đấu.' WHERE sport_id = 7;
UPDATE dbo.sports SET sport_name = N'Bóng bàn', description = N'Khu bàn bóng bàn phục vụ luyện tập và thi đấu.' WHERE sport_id = 8;
UPDATE dbo.sports SET sport_name = N'Bơi lội', description = N'Hồ bơi và làn bơi phục vụ luyện tập các cấp độ.' WHERE sport_id = 9;
UPDATE dbo.sports SET sport_name = N'Điền kinh', description = N'Đường chạy phục vụ luyện tập sức bền và điền kinh.' WHERE sport_id = 10;
DELETE FROM dbo.sports WHERE sport_id > 10;

-- 3. Cập nhật sport_id cho các cơ sở 1..13 phù hợp danh mục môn thể thao
UPDATE dbo.facilities SET sport_id = 2 WHERE facility_id IN (1, 2, 3); -- Pickleball
UPDATE dbo.facilities SET sport_id = 3 WHERE facility_id IN (4, 5);    -- Tennis
UPDATE dbo.facilities SET sport_id = 5 WHERE facility_id IN (6, 7);    -- Bóng đá
UPDATE dbo.facilities SET sport_id = 6 WHERE facility_id IN (8, 9);    -- Cầu lông
UPDATE dbo.facilities SET sport_id = 7 WHERE facility_id = 10;         -- Bóng chuyền
UPDATE dbo.facilities SET sport_id = 8 WHERE facility_id = 11;         -- Bóng bàn
UPDATE dbo.facilities SET sport_id = 9 WHERE facility_id = 12;         -- Bơi lội
UPDATE dbo.facilities SET sport_id = 10 WHERE facility_id = 13;        -- Điền kinh

-- 4. Cập nhật sport_id cho các lớp 1..11
UPDATE dbo.class_sessions SET sport_id = 3 WHERE session_id IN (1, 10); -- Tennis
UPDATE dbo.class_sessions SET sport_id = 2 WHERE session_id IN (2, 5);  -- Pickleball
UPDATE dbo.class_sessions SET sport_id = 10 WHERE session_id = 3;       -- Điền kinh
UPDATE dbo.class_sessions SET sport_id = 6 WHERE session_id IN (4, 9);  -- Cầu lông
UPDATE dbo.class_sessions SET sport_id = 8 WHERE session_id = 6;        -- Bóng bàn
UPDATE dbo.class_sessions SET sport_id = 5 WHERE session_id = 7;        -- Bóng đá
UPDATE dbo.class_sessions SET sport_id = 9 WHERE session_id = 8;        -- Bơi lội
UPDATE dbo.class_sessions SET sport_id = 7 WHERE session_id = 11;       -- Bóng chuyền

-- 5. Cập nhật membership_packages sport_id
UPDATE dbo.membership_packages SET sport_id = 2 WHERE package_id = 3; -- Pickleball
UPDATE dbo.membership_packages SET sport_id = 3 WHERE package_id = 4; -- Tennis
UPDATE dbo.membership_packages SET sport_id = 6 WHERE package_id = 5; -- Cầu lông
