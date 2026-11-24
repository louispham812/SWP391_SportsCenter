-- Allow arbitrary custom membership tier names/values in dbo.membership_packages.membership_tier.
SET XACT_ABORT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
BEGIN TRANSACTION;

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_membership_packages_tier')
    ALTER TABLE dbo.membership_packages DROP CONSTRAINT CK_membership_packages_tier;

IF COL_LENGTH(N'dbo.membership_packages', N'membership_tier') IS NOT NULL
   AND COL_LENGTH(N'dbo.membership_packages', N'membership_tier') < 200
   AND EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_membership_packages_active_tier' AND object_id = OBJECT_ID(N'dbo.membership_packages'))
    DROP INDEX UX_membership_packages_active_tier ON dbo.membership_packages;

IF COL_LENGTH(N'dbo.membership_packages', N'membership_tier') IS NOT NULL
   AND COL_LENGTH(N'dbo.membership_packages', N'membership_tier') < 200
    ALTER TABLE dbo.membership_packages ALTER COLUMN membership_tier NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_membership_packages_active_tier' AND object_id = OBJECT_ID(N'dbo.membership_packages'))
    CREATE UNIQUE INDEX UX_membership_packages_active_tier ON dbo.membership_packages(membership_tier)
        WHERE status = 'ACTIVE' AND membership_tier IS NOT NULL;

COMMIT TRANSACTION;
