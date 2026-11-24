-- Manual cleanup of the retired, unranked catalog and its dependent demo data.
-- Run after taking a full backup: sqlcmd -S tcp:localhost,1433 -E -d SportsCenterDB -I -b -f 65001 -i <this file>
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
IF DB_NAME() <> N'SportsCenterDB' OR @@SERVICENAME <> N'HOANGPM'
    THROW 51100, 'Use SportsCenterDB on tcp:localhost,1433 (HOANGPM).', 1;

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @OldPackages TABLE (id bigint PRIMARY KEY, name nvarchar(100));
    INSERT INTO @OldPackages SELECT package_id,name FROM dbo.membership_packages WHERE membership_tier IS NULL;
    DECLARE @OldMemberships TABLE (id bigint PRIMARY KEY, user_id bigint);
    INSERT INTO @OldMemberships SELECT um_id,user_id FROM dbo.user_memberships WHERE package_id IN (SELECT id FROM @OldPackages);
    DECLARE @OldBookings TABLE (id bigint PRIMARY KEY, member_id bigint, session_id bigint);
    INSERT INTO @OldBookings SELECT booking_id,member_id,session_id FROM dbo.bookings WHERE membership_id IN (SELECT id FROM @OldMemberships);
    DECLARE @OldCourts TABLE (id bigint PRIMARY KEY);
    INSERT INTO @OldCourts SELECT court_booking_id FROM dbo.court_bookings WHERE membership_id IN (SELECT id FROM @OldMemberships);
    DECLARE @OldPayments TABLE (id bigint PRIMARY KEY);
    INSERT INTO @OldPayments
        SELECT payment_id FROM dbo.payment_transactions WHERE membership_id IN (SELECT id FROM @OldMemberships)
        UNION SELECT payment_id FROM dbo.bookings WHERE booking_id IN (SELECT id FROM @OldBookings) AND payment_id IS NOT NULL
        UNION SELECT payment_id FROM dbo.court_bookings WHERE court_booking_id IN (SELECT id FROM @OldCourts) AND payment_id IS NOT NULL;
    INSERT INTO @OldBookings SELECT booking_id,member_id,session_id FROM dbo.bookings
        WHERE payment_id IN (SELECT id FROM @OldPayments) AND booking_id NOT IN (SELECT id FROM @OldBookings);
    INSERT INTO @OldCourts SELECT court_booking_id FROM dbo.court_bookings
        WHERE payment_id IN (SELECT id FROM @OldPayments) AND court_booking_id NOT IN (SELECT id FROM @OldCourts);

    DELETE n FROM dbo.notifications n WHERE EXISTS (
        SELECT 1 FROM @OldPackages p WHERE n.message LIKE N'%'+p.name+N'%' OR n.title LIKE N'%'+p.name+N'%');
    DELETE n FROM dbo.notifications n WHERE EXISTS (
        SELECT 1 FROM @OldBookings b JOIN dbo.class_sessions s ON s.session_id=b.session_id
        WHERE (n.type='BOOKING' AND n.user_id=b.member_id OR n.type IN ('SCHEDULE','FEEDBACK') AND n.user_id=s.coach_id)
          AND (n.message LIKE N'%'+s.class_name+N'%' OR n.title LIKE N'%'+s.class_name+N'%'));
    DELETE a FROM dbo.audit_logs a WHERE EXISTS (
        SELECT 1 FROM @OldPackages p WHERE CONCAT(a.detail,N' ',a.action_detail) LIKE N'%'+p.name+N'%')
        OR (a.action='POS_MEMBERSHIP_SALE' AND EXISTS (
            SELECT 1 FROM @OldMemberships m WHERE CONCAT(a.action_detail,N' ') LIKE N'%um_id='+CONVERT(nvarchar(30),m.id)+N',%'));
    DELETE t FROM dbo.support_tickets t WHERE EXISTS (
        SELECT 1 FROM @OldPackages p WHERE CONCAT(t.title,N' ',t.description) LIKE N'%'+p.name+N'%')
        OR CONCAT(t.title,N' ',t.description) LIKE N'%gói VIP Diamond%';

    UPDATE v SET used_count=CASE WHEN v.used_count>=d.removed_count THEN v.used_count-d.removed_count ELSE 0 END
    FROM dbo.vouchers v JOIN (
        SELECT voucher_id,COUNT(*) removed_count FROM dbo.payment_transactions
        WHERE payment_id IN (SELECT id FROM @OldPayments) AND payment_status='PAID' AND voucher_id IS NOT NULL GROUP BY voucher_id
    ) d ON d.voucher_id=v.voucher_id;

    DELETE FROM dbo.refund_requests WHERE transaction_id IN (SELECT id FROM @OldPayments)
        OR (booking_type IN ('CLASS','PT') AND booking_id IN (SELECT id FROM @OldBookings))
        OR (booking_type='COURT' AND booking_id IN (SELECT id FROM @OldCourts));
    DELETE FROM dbo.gateway_receipts WHERE payment_id IN (SELECT id FROM @OldPayments)
        OR attempt_id IN (SELECT attempt_id FROM dbo.payment_attempts WHERE payment_id IN (SELECT id FROM @OldPayments));
    DELETE FROM dbo.payment_attempts WHERE payment_id IN (SELECT id FROM @OldPayments);
    DELETE FROM dbo.bookings WHERE booking_id IN (SELECT id FROM @OldBookings);
    DELETE FROM dbo.court_bookings WHERE court_booking_id IN (SELECT id FROM @OldCourts);
    DELETE f FROM dbo.feedbacks f WHERE EXISTS (SELECT 1 FROM @OldBookings b WHERE b.member_id=f.member_id AND b.session_id=f.session_id)
        AND NOT EXISTS (SELECT 1 FROM dbo.bookings b WHERE b.member_id=f.member_id AND b.session_id=f.session_id);
    DELETE FROM dbo.payment_transactions WHERE payment_id IN (SELECT id FROM @OldPayments);
    DELETE FROM dbo.payments WHERE um_id IN (SELECT id FROM @OldMemberships);
    DELETE FROM dbo.user_memberships WHERE um_id IN (SELECT id FROM @OldMemberships);
    DELETE FROM dbo.membership_packages WHERE package_id IN (SELECT id FROM @OldPackages);
    IF OBJECT_ID(N'dbo.membership_packages_backup_20261119',N'U') IS NOT NULL DROP TABLE dbo.membership_packages_backup_20261119;

    -- Release the earliest unused new-tier term from a queue behind a deleted legacy contract.
    DECLARE @Terms TABLE (id bigint, user_id bigint, old_end date, new_end date);
    INSERT INTO @Terms
        SELECT m.um_id,m.user_id,m.end_date,DATEADD(day,p.duration_days-1,CAST(GETDATE() AS date))
        FROM dbo.user_memberships m JOIN dbo.membership_packages p ON p.package_id=m.package_id
        WHERE p.membership_tier IS NOT NULL AND m.status='ACTIVE' AND m.start_date>CAST(GETDATE() AS date)
          AND m.user_id IN (SELECT user_id FROM @OldMemberships)
          AND m.held_quota_sessions=0 AND m.used_quota_sessions=0 AND m.held_quota_courts=0 AND m.used_quota_courts=0
          AND NOT EXISTS (SELECT 1 FROM dbo.user_memberships x WHERE x.user_id=m.user_id AND x.status='ACTIVE' AND x.um_id<>m.um_id AND x.start_date<m.start_date);
    UPDATE m SET start_date=CAST(GETDATE() AS date),end_date=t.new_end FROM dbo.user_memberships m JOIN @Terms t ON t.id=m.um_id;
    UPDATE n SET message=REPLACE(n.message,CONVERT(nvarchar(10),t.old_end,23),CONVERT(nvarchar(10),t.new_end,23))
        FROM dbo.notifications n JOIN @Terms t ON t.user_id=n.user_id WHERE n.type='MEMBERSHIP';
    UPDATE s SET booked_slots=(SELECT COUNT(*) FROM dbo.bookings b WHERE b.session_id=s.session_id AND b.status IN ('BOOKED','CONFIRMED'))
        FROM dbo.class_sessions s WHERE s.session_id IN (SELECT session_id FROM @OldBookings);
    UPDATE dbo.notifications SET message=N'Hội viên Đỗ Phương Anh vừa thanh toán Hạng Bạc (800.000đ) và đang chờ kích hoạt.'
        WHERE type='APPROVAL' AND message LIKE N'%Gói Cầu Lông HS-SV%';

    IF EXISTS (SELECT 1 FROM dbo.membership_packages WHERE membership_tier IS NULL)
        THROW 51101, 'Legacy packages remain after cleanup.', 1;
    COMMIT TRANSACTION;
    SELECT (SELECT COUNT(*) FROM @OldPackages) AS removed_packages,
        (SELECT COUNT(*) FROM @OldMemberships) AS removed_memberships,
        (SELECT COUNT(*) FROM @OldPayments) AS removed_transactions,
        (SELECT COUNT(*) FROM @OldBookings) AS removed_class_bookings,
        (SELECT COUNT(*) FROM @OldCourts) AS removed_court_bookings;
END TRY
BEGIN CATCH
    IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
