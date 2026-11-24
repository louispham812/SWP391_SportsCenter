-- Allow custom membership tier names without fixed enum CHECK constraint.
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_membership_packages_tier')
    ALTER TABLE dbo.membership_packages DROP CONSTRAINT CK_membership_packages_tier;

COMMIT TRANSACTION;
