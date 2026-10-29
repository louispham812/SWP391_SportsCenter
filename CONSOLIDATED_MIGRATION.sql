-- ============================================================================
-- CONSOLIDATED MIGRATION SCRIPT
-- Date: 2026-10-27
-- Description: Apply all schema changes for Refund Policy + Quota Management
-- Run this ONCE on your local database after pulling code
-- ============================================================================

-- ============================================================================
-- STEP 1: Check if columns already exist (safe to re-run)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'user_memberships') AND name = 'remaining_quota_sessions')
BEGIN
    PRINT 'Adding quota tracking columns to user_memberships...';
    
    ALTER TABLE user_memberships
    ADD 
        remaining_quota_sessions INT DEFAULT 0,
        held_quota_sessions INT DEFAULT 0,
        used_quota_sessions INT DEFAULT 0,
        initial_quota_sessions INT DEFAULT 0;
    
    PRINT '✅ Quota columns added successfully';
END
ELSE
BEGIN
    PRINT 'ℹ️  Quota columns already exist, skipping...';
END
GO

-- ============================================================================
-- STEP 2: Add package_type and quota_sessions to membership_packages
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'membership_packages') AND name = 'package_type')
BEGIN
    PRINT 'Adding package_type column...';
    
    ALTER TABLE membership_packages
    ADD package_type NVARCHAR(20) NULL;
    
    PRINT '✅ package_type column added';
END
ELSE
BEGIN
    PRINT 'ℹ️  package_type column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'membership_packages') AND name = 'quota_sessions')
BEGIN
    PRINT 'Adding quota_sessions column...';
    
    ALTER TABLE membership_packages
    ADD quota_sessions INT NULL;
    
    PRINT '✅ quota_sessions column added';
END
ELSE
BEGIN
    PRINT 'ℹ️  quota_sessions column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'membership_packages') AND name = 'quota_courts')
BEGIN
    PRINT 'Adding quota_courts column...';
    
    ALTER TABLE membership_packages
    ADD quota_courts INT NULL;
    
    PRINT '✅ quota_courts column added';
END
ELSE
BEGIN
    PRINT 'ℹ️  quota_courts column already exists';
END
GO

-- ============================================================================
-- STEP 3: Add booking quota tracking columns
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'bookings') AND name = 'uses_membership_quota')
BEGIN
    PRINT 'Adding uses_membership_quota column to bookings...';
    
    ALTER TABLE bookings
    ADD uses_membership_quota BIT DEFAULT 0;
    
    PRINT '✅ uses_membership_quota column added';
END
ELSE
BEGIN
    PRINT 'ℹ️  uses_membership_quota column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'bookings') AND name = 'membership_id')
BEGIN
    PRINT 'Adding membership_id column to bookings...';
    
    ALTER TABLE bookings
    ADD membership_id INT NULL,
        CONSTRAINT FK_bookings_membership FOREIGN KEY (membership_id) 
        REFERENCES user_memberships(um_id);
    
    PRINT '✅ membership_id column added with FK';
END
ELSE
BEGIN
    PRINT 'ℹ️  membership_id column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'bookings') AND name = 'attendance_status')
BEGIN
    PRINT 'Adding attendance_status column to bookings...';
    
    ALTER TABLE bookings
    ADD attendance_status NVARCHAR(30) DEFAULT 'PENDING';
    
    PRINT '✅ attendance_status column added';
END
ELSE
BEGIN
    PRINT 'ℹ️  attendance_status column already exists';
END
GO

-- ============================================================================
-- STEP 4: Update existing package data with package_type and quota
-- ============================================================================
PRINT 'Updating existing packages with package_type and quota...';

UPDATE membership_packages 
SET package_type = 'VIP',
    quota_sessions = NULL,  -- NULL = unlimited
    quota_courts = NULL     -- NULL = unlimited
WHERE package_id = 1 AND package_type IS NULL;

UPDATE membership_packages 
SET package_type = 'VIP',
    quota_sessions = 20,    -- 20 buổi tập
    quota_courts = 10       -- 10 giờ thuê sân
WHERE package_id = 2 AND package_type IS NULL;

UPDATE membership_packages 
SET package_type = 'CLASS',
    quota_sessions = 10,    -- 10 buổi học
    quota_courts = 0        -- Không bao gồm thuê sân
WHERE package_id = 3 AND package_type IS NULL;

UPDATE membership_packages 
SET package_type = 'PT',
    quota_sessions = 30,    -- 30 buổi PT
    quota_courts = 15       -- 15 giờ sân tập
WHERE package_id = 4 AND package_type IS NULL;

UPDATE membership_packages 
SET package_type = 'CLASS',
    quota_sessions = 15,    -- 15 buổi học
    quota_courts = 0        -- Không bao gồm thuê sân
WHERE package_id = 5 AND package_type IS NULL;

PRINT '✅ Package data updated';
GO

-- ============================================================================
-- STEP 5: Initialize quota for existing ACTIVE memberships
-- ============================================================================
PRINT 'Initializing quota for existing ACTIVE memberships...';

UPDATE um
SET um.initial_quota_sessions = ISNULL(pkg.quota_sessions, 0),
    um.remaining_quota_sessions = ISNULL(pkg.quota_sessions, 0),
    um.used_quota_sessions = 0,
    um.held_quota_sessions = 0
FROM user_memberships um
INNER JOIN membership_packages pkg ON um.package_id = pkg.package_id
WHERE um.status = 'ACTIVE' 
  AND um.initial_quota_sessions IS NULL;

PRINT '✅ Existing ACTIVE memberships initialized';
GO

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
PRINT '============================================================================';
PRINT 'VERIFICATION - Check if schema is correct:';
PRINT '============================================================================';

-- 1. Check user_memberships columns
SELECT 
    'user_memberships' AS [table_name],
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'user_memberships') AND name = 'remaining_quota_sessions') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS remaining_quota_sessions,
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'user_memberships') AND name = 'held_quota_sessions') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS held_quota_sessions,
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'user_memberships') AND name = 'used_quota_sessions') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS used_quota_sessions,
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'user_memberships') AND name = 'initial_quota_sessions') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS initial_quota_sessions;

-- 2. Check membership_packages columns
SELECT 
    'membership_packages' AS [table_name],
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'membership_packages') AND name = 'package_type') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS package_type,
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'membership_packages') AND name = 'quota_sessions') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS quota_sessions,
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'membership_packages') AND name = 'quota_courts') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS quota_courts;

-- 3. Check bookings columns
SELECT 
    'bookings' AS [table_name],
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'bookings') AND name = 'uses_membership_quota') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS uses_membership_quota,
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'bookings') AND name = 'membership_id') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS membership_id,
    CASE WHEN EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'bookings') AND name = 'attendance_status') 
         THEN '✅ OK' ELSE '❌ MISSING' END AS attendance_status;

-- 4. Show updated packages
PRINT '';
PRINT 'Updated membership packages:';
SELECT 
    package_id,
    name,
    package_type,
    quota_sessions,
    quota_courts,
    price,
    duration_days,
    status
FROM membership_packages
ORDER BY package_id;

-- 5. Show memberships with quota
PRINT '';
PRINT 'Memberships with initialized quota:';
SELECT TOP 10
    um.um_id,
    um.user_id,
    pkg.name AS package_name,
    um.status,
    um.initial_quota_sessions,
    um.remaining_quota_sessions,
    um.held_quota_sessions,
    um.used_quota_sessions,
    (um.remaining_quota_sessions + um.held_quota_sessions + um.used_quota_sessions) AS total_check,
    CASE 
        WHEN (um.remaining_quota_sessions + um.held_quota_sessions + um.used_quota_sessions) = um.initial_quota_sessions 
        THEN '✅ Formula OK' 
        ELSE '❌ Formula BROKEN' 
    END AS formula_status
FROM user_memberships um
INNER JOIN membership_packages pkg ON um.package_id = pkg.package_id
WHERE um.status = 'ACTIVE'
ORDER BY um.um_id DESC;

PRINT '';
PRINT '============================================================================';
PRINT '✅ MIGRATION COMPLETED SUCCESSFULLY';
PRINT '============================================================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Restart Spring Boot backend (port 8080)';
PRINT '2. Restart Vite frontend (port 5173)';
PRINT '3. Test booking with quota at: http://localhost:5173/member/classes';
PRINT '4. Test refund policy: Cancel booking >= 2h before → 100% refund';
PRINT '5. Test refund policy: Cancel booking < 2h before → 0% refund';
PRINT '';
GO
