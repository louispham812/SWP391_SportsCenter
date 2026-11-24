-- Manual demo preparation only. Do not add this file to Spring's startup scripts.
-- Back up SportsCenterDB first. Run with sqlcmd -S tcp:localhost,1433 -I -f 65001 -b.
-- Keeps 2026-11-20 empty; preserves bookings, payment IDs and held/used quotas.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
DECLARE @DemoDay date = '2026-11-20';
IF DB_NAME() <> N'SportsCenterDB' OR @@SERVICENAME <> N'HOANGPM'
    THROW 51005, 'Wrong database instance. Use SportsCenterDB on tcp:localhost,1433 (HOANGPM).', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Repair stale upcoming sample sessions without deleting their enrollments.
    UPDATE s SET
        start_time = DATEADD(day, DATEDIFF(day, CAST(s.start_time AS date), DATEADD(day, d.day_offset, @DemoDay)), s.start_time),
        end_time = DATEADD(day, DATEDIFF(day, CAST(s.start_time AS date), DATEADD(day, d.day_offset, @DemoDay)), s.end_time)
    FROM dbo.class_sessions s
    JOIN (VALUES (5,1), (6,3), (7,2), (8,1), (9,1), (10,4), (11,4)) d(session_id,day_offset)
      ON d.session_id = s.session_id
    WHERE s.status IN ('SCHEDULED','IN_PROGRESS');

    -- Avoid overlap with the additional sample classes already present on 24/11.
    UPDATE dbo.class_sessions SET
        start_time=DATEADD(hour,20,CAST(DATEADD(day,4,@DemoDay) AS datetime)),
        end_time=DATEADD(minute,1290,CAST(DATEADD(day,4,@DemoDay) AS datetime))
    WHERE session_id=10 AND status='SCHEDULED';
    UPDATE dbo.class_sessions SET
        start_time=DATEADD(minute,510,CAST(DATEADD(day,4,@DemoDay) AS datetime)),
        end_time=DATEADD(hour,10,CAST(DATEADD(day,4,@DemoDay) AS datetime))
    WHERE session_id=11 AND status='SCHEDULED';

    UPDATE b SET
        start_time = DATEADD(day, DATEDIFF(day, CAST(b.start_time AS date), DATEADD(day, d.day_offset, @DemoDay)), b.start_time),
        end_time = DATEADD(day, DATEDIFF(day, CAST(b.start_time AS date), DATEADD(day, d.day_offset, @DemoDay)), b.end_time)
    FROM dbo.court_bookings b
    JOIN (VALUES (4,1), (5,2), (6,3)) d(booking_id,day_offset) ON d.booking_id = b.court_booking_id
    WHERE b.status IN ('PENDING','CONFIRMED');

    -- Any other entries overlapping the demo day move together by one week.
    UPDATE dbo.class_sessions SET start_time=DATEADD(day,7,start_time), end_time=DATEADD(day,7,end_time)
    WHERE start_time < DATEADD(day,1,@DemoDay) AND end_time > @DemoDay;
    UPDATE dbo.court_bookings SET start_time=DATEADD(day,7,start_time), end_time=DATEADD(day,7,end_time)
    WHERE start_time < DATEADD(day,1,@DemoDay) AND end_time > @DemoDay;
    UPDATE dbo.court_maintenance SET start_time=DATEADD(day,7,start_time), end_time=DATEADD(day,7,end_time)
    WHERE start_time < DATEADD(day,1,@DemoDay) AND end_time > @DemoDay;
    UPDATE dbo.coach_leave_requests SET
        start_date=DATEADD(day,DATEDIFF(day,start_date,DATEADD(day,7,@DemoDay)),start_date),
        end_date=DATEADD(day,DATEDIFF(day,start_date,DATEADD(day,7,@DemoDay)),end_date)
    WHERE start_date <= @DemoDay AND end_date >= @DemoDay AND status IN ('PENDING','APPROVED');

    -- Enable Friday shifts for the four active sample coaches.
    UPDATE u SET availability_json = JSON_MODIFY(JSON_MODIFY(JSON_MODIFY(u.availability_json,
        CONCAT('$[',j.[key],'].morning'), CAST(1 AS bit)),
        CONCAT('$[',j.[key],'].afternoon'), CAST(1 AS bit)),
        CONCAT('$[',j.[key],'].evening'), CAST(1 AS bit))
    FROM dbo.users u CROSS APPLY OPENJSON(u.availability_json) j
    WHERE u.role='COACH' AND u.status='ACTIVE' AND JSON_VALUE(j.value,'$.day')='FRIDAY';

    -- The seeded paid approval request has the same 800,000 VND price as Silver.
    -- Move only this unactivated demo request; existing active contracts stay intact.
    DECLARE @SilverId bigint = (SELECT package_id FROM dbo.membership_packages WHERE membership_tier='SILVER' AND status='ACTIVE');
    IF @SilverId IS NULL THROW 51000, 'Active Silver tier is required.', 1;
    IF EXISTS (SELECT 1 FROM dbo.user_memberships WHERE um_id=5 AND user_id=12 AND status='PENDING_APPROVAL')
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.payment_transactions WHERE membership_id=5 AND member_id=12 AND payment_status='PAID' AND amount=800000)
            THROW 51001, 'Demo approval payment must be PAID for 800000 VND.', 1;
        UPDATE dbo.user_memberships SET package_id=@SilverId, start_date=@DemoDay, end_date=DATEADD(day,29,@DemoDay)
        WHERE um_id=5 AND user_id=12 AND status='PENDING_APPROVAL';
        UPDATE dbo.payment_transactions SET item_description=N'Hạng Bạc'
        WHERE membership_id=5 AND member_id=12 AND payment_status='PAID';
    END;

    IF EXISTS (SELECT 1 FROM dbo.class_sessions WHERE start_time < DATEADD(day,1,@DemoDay) AND end_time > @DemoDay)
        THROW 51002, 'Class schedule is not empty on the demo day.', 1;
    IF EXISTS (SELECT 1 FROM dbo.court_bookings WHERE start_time < DATEADD(day,1,@DemoDay) AND end_time > @DemoDay)
        THROW 51003, 'Court schedule is not empty on the demo day.', 1;
    IF EXISTS (SELECT 1 FROM dbo.coach_leave_requests WHERE status='APPROVED' AND start_date<=@DemoDay AND end_date>=@DemoDay)
        THROW 51004, 'An approved coach leave blocks the demo day.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT N'Demo day ready' AS result, @DemoDay AS demo_date;
