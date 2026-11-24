-- Retire the old catalog; existing memberships, payments and held quotas keep their IDs.
-- Run after schema.sql. Reruns preserve manager edits to the new tiers.
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM dbo.membership_packages WHERE membership_tier IS NOT NULL)
BEGIN
    UPDATE dbo.membership_packages SET status = 'INACTIVE' WHERE status = 'ACTIVE'
    INSERT INTO dbo.membership_packages
        (name, sport_id, price, duration_days, access_type, description, status, package_type, quota_sessions, quota_courts, membership_tier)
    VALUES
        (N'Hạng Bạc', NULL, 800000, 30, 'OFF_PEAK', N'10 buổi lớp học hoặc PT và 5 giờ sân trong 30 ngày. Áp dụng mọi bộ môn vào giờ thấp điểm, theo lịch còn chỗ.', 'ACTIVE', 'VIP', 10, 5, 'SILVER'),
        (N'Hạng Vàng', NULL, 1500000, 30, 'ALL_DAY', N'20 buổi lớp học hoặc PT và 10 giờ sân trong 30 ngày. Áp dụng mọi bộ môn trong giờ hoạt động, theo lịch còn chỗ.', 'ACTIVE', 'VIP', 20, 10, 'GOLD'),
        (N'Hạng Kim Cương', NULL, 2800000, 30, 'ALL_DAY', N'30 buổi lớp học hoặc PT và 15 giờ sân trong 30 ngày. Áp dụng mọi bộ môn trong giờ hoạt động, theo lịch còn chỗ.', 'ACTIVE', 'VIP', 30, 15, 'DIAMOND')
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_membership_packages_active_tier' AND object_id = OBJECT_ID(N'dbo.membership_packages'))
    CREATE UNIQUE INDEX UX_membership_packages_active_tier ON dbo.membership_packages(membership_tier)
        WHERE status = 'ACTIVE' AND membership_tier IS NOT NULL;

COMMIT TRANSACTION;
