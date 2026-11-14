/* ============================================================================
   SPORTHUB (SWP391_SportsCenter) - CLEAN DATABASE SCHEMA & REALISTIC SEED DATA
   Target DBMS : Microsoft SQL Server 2019 / 2022
   Encoding    : UTF-8 (without BOM)
   Standard    : 32 Tables aligned with JPA Entities & backend/src/main/resources/schema.sql
   Password    : SportHub@123 (BCrypt $2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq)
   ============================================================================ */

SET NOCOUNT ON;
GO

USE [master];
GO

IF EXISTS (SELECT 1 FROM sys.databases WHERE name = N'SportsCenterDB')
BEGIN
    ALTER DATABASE [SportsCenterDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [SportsCenterDB];
END;
GO

CREATE DATABASE [SportsCenterDB];
GO

ALTER DATABASE [SportsCenterDB] SET RECOVERY SIMPLE;
ALTER DATABASE [SportsCenterDB] SET MULTI_USER;
GO

USE [SportsCenterDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ============================================================================
   1. CREATE TABLES (32 CORE TABLES)
   ============================================================================ */

-- 1.1 Users
CREATE TABLE dbo.users (
    user_id                  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_users PRIMARY KEY,
    full_name                NVARCHAR(100) NOT NULL,
    email                    VARCHAR(100)  NOT NULL CONSTRAINT UQ_users_email UNIQUE,
    password                 NVARCHAR(100) NOT NULL,
    phone                    VARCHAR(15)   NULL,
    avatar                   NVARCHAR(MAX) NULL,
    date_of_birth            DATE          NULL,
    gender                   NVARCHAR(20)  NULL,
    address                  NVARCHAR(500) NULL,
    emergency_contact_name   NVARCHAR(100) NULL,
    emergency_contact_phone  NVARCHAR(15)  NULL,
    role                     VARCHAR(20)   NOT NULL,
    status                   VARCHAR(20)   NOT NULL CONSTRAINT DF_users_status DEFAULT 'ACTIVE',
    require_password_change  BIT           NOT NULL CONSTRAINT DF_users_require_pw_change DEFAULT 0,
    created_at               DATETIME2(7)  NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSDATETIME(),
    rfid_code                NVARCHAR(64)  NULL,
    specialty                NVARCHAR(200) NULL,
    experience_years         INT           NULL,
    certifications           NVARCHAR(500) NULL,
    bio                      NVARCHAR(MAX) NULL,
    availability_json        NVARCHAR(MAX) NULL,
    CONSTRAINT CK_users_role CHECK (role IN ('MANAGER', 'ADMIN', 'RECEPTIONIST', 'COACH', 'MEMBER')),
    CONSTRAINT CK_users_registration_status CHECK (status IN ('ACTIVE', 'PENDING', 'INACTIVE', 'LOCKED'))
);
GO

CREATE UNIQUE NONCLUSTERED INDEX UQ_users_rfid_code
    ON dbo.users (rfid_code)
    WHERE rfid_code IS NOT NULL;
GO

-- 1.2 Auth Sessions
CREATE TABLE dbo.auth_sessions (
    token_hash  CHAR(64)     NOT NULL CONSTRAINT PK_auth_sessions PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    expires_at  DATETIME2(7) NOT NULL,
    CONSTRAINT FK_auth_sessions_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id) ON DELETE CASCADE
);
GO

-- 1.3 Verification Tokens
CREATE TABLE dbo.verification_tokens (
    token_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_verification_tokens PRIMARY KEY,
    email            VARCHAR(100) NOT NULL,
    token_hash       VARCHAR(64)  NOT NULL,
    token_type       VARCHAR(20)  NOT NULL,
    created_at       DATETIME2(7) NOT NULL CONSTRAINT DF_verification_tokens_created DEFAULT SYSDATETIME(),
    expires_at       DATETIME2(7) NOT NULL,
    used_at          DATETIME2(7) NULL,
    failed_attempts  INT          NOT NULL CONSTRAINT DF_verification_tokens_failed DEFAULT 0,
    locked           BIT          NOT NULL CONSTRAINT DF_verification_tokens_locked DEFAULT 0
);
GO

-- 1.4 Sports & Public Sports (IDs 1..10 synchronized)
CREATE TABLE dbo.sports (
    sport_id     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_sports PRIMARY KEY,
    sport_name   NVARCHAR(50)  NOT NULL,
    description  NVARCHAR(MAX) NULL
);
GO

CREATE TABLE dbo.public_sports (
    sport_id     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_public_sports PRIMARY KEY,
    slug         NVARCHAR(80)   NOT NULL CONSTRAINT UQ_public_sports_slug UNIQUE,
    name         NVARCHAR(100)  NOT NULL,
    subtitle     NVARCHAR(150)  NULL,
    tag          NVARCHAR(80)   NULL,
    description  NVARCHAR(1000) NULL,
    icon         NVARCHAR(80)   NULL,
    area         NVARCHAR(150)  NULL,
    active       BIT            NOT NULL CONSTRAINT DF_public_sports_active DEFAULT 1
);
GO

-- 1.5 Facilities, Public Facilities & Sports Courts (Canonical IDs aligned with FacilityCourtSyncService)
CREATE TABLE dbo.facilities (
    facility_id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_facilities PRIMARY KEY,
    facility_name  NVARCHAR(255) NOT NULL,
    sport_id       BIGINT        NOT NULL,
    capacity       INT           NOT NULL,
    status         VARCHAR(20)   NOT NULL CONSTRAINT DF_facilities_status DEFAULT 'AVAILABLE',
    CONSTRAINT FK_facilities_sports FOREIGN KEY (sport_id) REFERENCES dbo.sports(sport_id),
    CONSTRAINT CK_facilities_status CHECK (status IN ('AVAILABLE', 'MAINTENANCE'))
);
GO

CREATE TABLE dbo.public_facilities (
    facility_id  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_public_facilities PRIMARY KEY,
    slug         NVARCHAR(80)   NOT NULL CONSTRAINT UQ_public_facilities_slug UNIQUE,
    name         NVARCHAR(120)  NOT NULL,
    description  NVARCHAR(1000) NULL,
    icon         NVARCHAR(80)   NULL,
    highlight    NVARCHAR(150)  NULL,
    active       BIT            NOT NULL CONSTRAINT DF_public_facilities_active DEFAULT 1
);
GO

CREATE TABLE dbo.sports_courts (
    court_id     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_sports_courts PRIMARY KEY,
    sport_id     BIGINT        NOT NULL,
    court_name   NVARCHAR(120) NOT NULL,
    description  NVARCHAR(500) NULL,
    hourly_rate  DECIMAL(12,2) NOT NULL,
    opens_at     TIME(7)       NOT NULL,
    closes_at    TIME(7)       NOT NULL,
    active       BIT           NOT NULL CONSTRAINT DF_sports_courts_active DEFAULT 1,
    CONSTRAINT FK_sports_courts_public_sports FOREIGN KEY (sport_id) REFERENCES dbo.public_sports(sport_id)
);
GO

-- 1.6 Court Maintenance
CREATE TABLE dbo.court_maintenance (
    maintenance_id  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_court_maintenance PRIMARY KEY,
    court_id        BIGINT        NOT NULL,
    start_time      DATETIME2(7)  NOT NULL,
    end_time        DATETIME2(7)  NOT NULL,
    reason          NVARCHAR(500) NULL,
    created_by      BIGINT        NULL,
    created_at      DATETIME2(7)  NOT NULL CONSTRAINT DF_court_maintenance_created DEFAULT SYSDATETIME(),
    CONSTRAINT FK_court_maintenance_court FOREIGN KEY (court_id) REFERENCES dbo.sports_courts(court_id),
    CONSTRAINT FK_court_maintenance_creator FOREIGN KEY (created_by) REFERENCES dbo.users(user_id)
);
GO

-- 1.7 Membership Packages & Vouchers
CREATE TABLE dbo.membership_packages (
    package_id      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_membership_packages PRIMARY KEY,
    name            NVARCHAR(100) NOT NULL,
    sport_id        BIGINT        NULL,
    price           DECIMAL(10,2) NOT NULL,
    duration_days   INT           NOT NULL,
    access_type     VARCHAR(20)   NOT NULL CONSTRAINT DF_membership_packages_access_type DEFAULT 'ALL_DAY',
    description     NVARCHAR(MAX) NULL,
    status          VARCHAR(20)   NOT NULL CONSTRAINT DF_membership_packages_status DEFAULT 'ACTIVE',
    package_type    NVARCHAR(20)  NULL CONSTRAINT DF_packages_package_type DEFAULT 'VIP',
    quota_sessions  INT           NULL CONSTRAINT DF_packages_quota_sessions DEFAULT 0,
    quota_courts    INT           NULL CONSTRAINT DF_packages_quota_courts DEFAULT 0,
    CONSTRAINT FK_membership_packages_sports FOREIGN KEY (sport_id) REFERENCES dbo.sports(sport_id),
    CONSTRAINT CK_membership_packages_access_type CHECK (access_type IN ('ALL_DAY', 'PEAK', 'OFF_PEAK')),
    CONSTRAINT CK_membership_packages_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
GO

CREATE TABLE dbo.vouchers (
    voucher_id           BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_vouchers PRIMARY KEY,
    code                 NVARCHAR(50)  NOT NULL CONSTRAINT UQ_vouchers_code UNIQUE,
    discount_type        NVARCHAR(20)  NOT NULL CONSTRAINT DF_vouchers_type DEFAULT N'PERCENT',
    discount_value       DECIMAL(12,2) NULL,
    discount_percent     INT           NULL,
    discount_amount      DECIMAL(12,2) NULL,
    max_discount_amount  DECIMAL(10,2) NULL,
    min_purchase         DECIMAL(12,2) NOT NULL CONSTRAINT DF_vouchers_min_purchase DEFAULT 0,
    valid_from           DATE          NULL,
    valid_until          DATE          NOT NULL,
    usage_limit          INT           NOT NULL CONSTRAINT DF_vouchers_usage_limit DEFAULT 100,
    used_count           INT           NOT NULL CONSTRAINT DF_vouchers_used_count DEFAULT 0,
    applies_to           NVARCHAR(50)  NOT NULL CONSTRAINT DF_vouchers_applies DEFAULT N'ALL',
    status               NVARCHAR(20)  NOT NULL CONSTRAINT DF_vouchers_status DEFAULT N'ACTIVE',
    CONSTRAINT CK_vouchers_discount_percent CHECK (discount_percent IS NULL OR (discount_percent >= 1 AND discount_percent <= 100)),
    CONSTRAINT CK_vouchers_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'EXPIRED'))
);
GO

-- 1.8 User Memberships
CREATE TABLE dbo.user_memberships (
    um_id                     BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_user_memberships PRIMARY KEY,
    user_id                   BIGINT      NOT NULL,
    package_id                BIGINT      NOT NULL,
    start_date                DATE        NULL,
    end_date                  DATE        NULL,
    status                    VARCHAR(20) NOT NULL CONSTRAINT DF_user_memberships_status DEFAULT 'PENDING',
    remaining_quota_sessions  INT         NULL CONSTRAINT DF_user_memberships_remaining_quota DEFAULT 0,
    held_quota_sessions       INT         NULL CONSTRAINT DF_user_memberships_held_quota DEFAULT 0,
    used_quota_sessions       INT         NULL CONSTRAINT DF_user_memberships_used_quota DEFAULT 0,
    initial_quota_sessions    INT         NULL CONSTRAINT DF_user_memberships_initial_quota DEFAULT 0,
    remaining_quota_courts    INT         NULL CONSTRAINT DF_user_memberships_remaining_courts DEFAULT 0,
    held_quota_courts         INT         NULL CONSTRAINT DF_user_memberships_held_courts DEFAULT 0,
    used_quota_courts         INT         NULL CONSTRAINT DF_user_memberships_used_courts DEFAULT 0,
    initial_quota_courts      INT         NULL CONSTRAINT DF_user_memberships_initial_courts DEFAULT 0,
    CONSTRAINT FK_user_memberships_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_user_memberships_packages FOREIGN KEY (package_id) REFERENCES dbo.membership_packages(package_id),
    CONSTRAINT CK_user_memberships_status CHECK (status IN ('PENDING', 'PENDING_APPROVAL', 'PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'FROZEN', 'REJECTED', 'CANCELLED'))
);
GO

-- 1.9 Payment Transactions, Attempts, Gateway Receipts & Legacy Reception Payments
CREATE TABLE dbo.payment_transactions (
    payment_id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_payment_transactions PRIMARY KEY,
    member_id             BIGINT        NOT NULL,
    membership_id         BIGINT        NULL,
    voucher_id            BIGINT        NULL,
    gateway_reference     VARCHAR(100)  NULL,
    booking_type          NVARCHAR(20)  NOT NULL,
    amount                DECIMAL(12,2) NOT NULL,
    payment_method        NVARCHAR(40)  NOT NULL,
    payment_status        NVARCHAR(20)  NOT NULL,
    reference_code        NVARCHAR(64)  NOT NULL CONSTRAINT UQ_payment_transactions_ref UNIQUE,
    created_at            DATETIME2(7)  NOT NULL CONSTRAINT DF_payment_transactions_created DEFAULT SYSDATETIME(),
    transaction_date      VARCHAR(14)   NULL,
    payment_completed_at  DATETIME2(7)  NULL,
    item_type             VARCHAR(20)   NULL,
    item_description      NVARCHAR(500) NULL,
    CONSTRAINT FK_payment_transactions_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_payment_transactions_membership FOREIGN KEY (membership_id) REFERENCES dbo.user_memberships(um_id),
    CONSTRAINT FK_payment_transactions_voucher FOREIGN KEY (voucher_id) REFERENCES dbo.vouchers(voucher_id)
);
GO

CREATE TABLE dbo.payment_attempts (
    attempt_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_payment_attempts PRIMARY KEY,
    payment_id         BIGINT        NOT NULL,
    gateway_reference  VARCHAR(100)  NOT NULL CONSTRAINT UQ_payment_attempts_ref UNIQUE,
    amount             DECIMAL(12,2) NOT NULL,
    status             VARCHAR(20)   NOT NULL,
    payment_url        NVARCHAR(MAX) NULL,
    created_at         DATETIME2(7)  NOT NULL,
    expires_at         DATETIME2(7)  NOT NULL,
    merchant_date      VARCHAR(14)   NULL,
    CONSTRAINT FK_payment_attempt_order FOREIGN KEY (payment_id) REFERENCES dbo.payment_transactions(payment_id)
);
GO
CREATE INDEX IX_payment_attempt_order ON dbo.payment_attempts(payment_id, status, created_at);
GO

CREATE TABLE dbo.gateway_receipts (
    receipt_id              BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_gateway_receipts PRIMARY KEY,
    payment_id              BIGINT        NOT NULL,
    attempt_id              BIGINT        NOT NULL,
    gateway_transaction_no  VARCHAR(100)  NOT NULL CONSTRAINT UQ_gateway_receipts_txno UNIQUE,
    gateway_reference       VARCHAR(100)  NOT NULL,
    amount                  DECIMAL(12,2) NOT NULL,
    transaction_date        VARCHAR(14)   NULL,
    status                  VARCHAR(24)   NOT NULL,
    reconciliation_note     NVARCHAR(500) NULL,
    created_at              DATETIME2(7)  NOT NULL,
    resolved_at             DATETIME2(7)  NULL,
    CONSTRAINT FK_gateway_receipt_order FOREIGN KEY (payment_id) REFERENCES dbo.payment_transactions(payment_id),
    CONSTRAINT FK_gateway_receipt_attempt FOREIGN KEY (attempt_id) REFERENCES dbo.payment_attempts(attempt_id)
);
GO
CREATE INDEX IX_gateway_receipt_review ON dbo.gateway_receipts(status, created_at);
GO

CREATE TABLE dbo.payments (
    payment_id      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_payments PRIMARY KEY,
    member_id       BIGINT        NOT NULL,
    um_id           BIGINT        NULL,
    voucher_id      BIGINT        NULL,
    amount          NUMERIC(38,2) NULL,
    payment_method  VARCHAR(255)  NULL,
    payment_status  VARCHAR(255)  NULL CONSTRAINT DF_payments_status DEFAULT 'PENDING',
    approved_by     BIGINT        NULL,
    created_at      DATETIME      NULL CONSTRAINT DF_payments_created DEFAULT GETDATE(),
    CONSTRAINT FK_payments_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_payments_membership FOREIGN KEY (um_id) REFERENCES dbo.user_memberships(um_id),
    CONSTRAINT FK_payments_voucher FOREIGN KEY (voucher_id) REFERENCES dbo.vouchers(voucher_id),
    CONSTRAINT FK_payments_approver FOREIGN KEY (approved_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_payments_method CHECK (payment_method IN ('ONLINE', 'CASH', 'TRANSFER', 'POS')),
    CONSTRAINT CK_payments_status CHECK (payment_status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'))
);
GO

-- 1.10 Class Sessions, Bookings & Court Bookings
CREATE TABLE dbo.class_sessions (
    session_id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_class_sessions PRIMARY KEY,
    class_name    NVARCHAR(100) NOT NULL,
    sport_id      BIGINT        NOT NULL,
    coach_id      BIGINT        NOT NULL,
    facility_id   BIGINT        NOT NULL,
    start_time    DATETIME      NOT NULL,
    end_time      DATETIME      NOT NULL,
    max_slots     INT           NOT NULL,
    booked_slots  INT           NULL CONSTRAINT DF_class_sessions_booked_slots DEFAULT 0,
    price_amount  DECIMAL(12,2) NOT NULL CONSTRAINT DF_class_sessions_price_amount DEFAULT 0,
    status        VARCHAR(20)   NULL CONSTRAINT DF_class_sessions_status DEFAULT 'SCHEDULED',
    CONSTRAINT FK_class_sessions_sports FOREIGN KEY (sport_id) REFERENCES dbo.sports(sport_id),
    CONSTRAINT FK_class_sessions_coach FOREIGN KEY (coach_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_class_sessions_facility FOREIGN KEY (facility_id) REFERENCES dbo.facilities(facility_id),
    CONSTRAINT CK_class_sessions_status CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);
GO

CREATE TABLE dbo.bookings (
    booking_id             BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_bookings PRIMARY KEY,
    member_id              BIGINT        NOT NULL,
    session_id             BIGINT        NOT NULL,
    booking_time           DATETIME      NULL CONSTRAINT DF_bookings_time DEFAULT GETDATE(),
    status                 VARCHAR(20)   NULL CONSTRAINT DF_bookings_status DEFAULT 'BOOKED',
    attendance_status      VARCHAR(30)   NULL CONSTRAINT DF_bookings_attendance DEFAULT 'PENDING',
    coach_note             NVARCHAR(MAX) NULL,
    homework_note          NVARCHAR(MAX) NULL,
    uses_membership_quota  BIT           NULL CONSTRAINT DF_bookings_uses_membership_quota DEFAULT 0,
    membership_id          BIGINT        NULL,
    fee_amount             DECIMAL(12,2) NOT NULL CONSTRAINT DF_bookings_fee_amount DEFAULT 0,
    payment_id             BIGINT        NULL,
    quota_state            VARCHAR(24)   NULL,
    CONSTRAINT FK_bookings_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_bookings_session FOREIGN KEY (session_id) REFERENCES dbo.class_sessions(session_id),
    CONSTRAINT FK_bookings_membership FOREIGN KEY (membership_id) REFERENCES dbo.user_memberships(um_id),
    CONSTRAINT FK_bookings_payment FOREIGN KEY (payment_id) REFERENCES dbo.payment_transactions(payment_id),
    CONSTRAINT CK_bookings_status CHECK (status IN ('BOOKED', 'CONFIRMED', 'WAITLIST', 'CANCELLED')),
    CONSTRAINT CK_bookings_attendance_status CHECK (attendance_status IS NULL OR attendance_status IN ('PENDING', 'PRESENT', 'EXCUSED_ABSENCE', 'UNEXCUSED_ABSENCE', 'ABSENT'))
);
GO

CREATE TABLE dbo.court_bookings (
    court_booking_id       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_court_bookings PRIMARY KEY,
    member_id              BIGINT        NOT NULL,
    court_id               BIGINT        NOT NULL,
    start_time             DATETIME2(7)  NOT NULL,
    end_time               DATETIME2(7)  NOT NULL,
    amount_paid            DECIMAL(12,2) NOT NULL CONSTRAINT DF_court_bookings_amount DEFAULT 0,
    payment_id             BIGINT        NULL,
    status                 NVARCHAR(20)  NOT NULL,
    created_at             DATETIME2(7)  NOT NULL CONSTRAINT DF_court_bookings_created DEFAULT SYSDATETIME(),
    uses_membership_quota  BIT           NULL CONSTRAINT DF_court_bookings_uses_quota DEFAULT 0,
    membership_id          BIGINT        NULL,
    quota_hours_used       DECIMAL(4,2)  NULL CONSTRAINT DF_court_bookings_quota_hours DEFAULT 0,
    quota_state            VARCHAR(24)   NULL,
    CONSTRAINT FK_court_bookings_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_court_bookings_sports_courts FOREIGN KEY (court_id) REFERENCES dbo.sports_courts(court_id),
    CONSTRAINT FK_court_bookings_payment_transactions FOREIGN KEY (payment_id) REFERENCES dbo.payment_transactions(payment_id),
    CONSTRAINT FK_court_bookings_membership FOREIGN KEY (membership_id) REFERENCES dbo.user_memberships(um_id)
);
GO

-- 1.11 Health Profiles, Body Progress Logs & Workout Plans
CREATE TABLE dbo.member_health_profiles (
    profile_id      BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_member_health_profiles PRIMARY KEY,
    member_id       BIGINT        NOT NULL CONSTRAINT UQ_member_health_profiles_member UNIQUE,
    fitness_level   VARCHAR(30)   NULL CONSTRAINT DF_health_fitness_level DEFAULT 'BEGINNER',
    fitness_goals   NVARCHAR(MAX) NULL,
    injury_history  NVARCHAR(MAX) NULL,
    weight_kg       DECIMAL(5,2)  NULL,
    height_cm       DECIMAL(5,2)  NULL,
    smm_kg          DECIMAL(5,2)  NULL,
    pbf_percent     DECIMAL(5,2)  NULL,
    bmi             DECIMAL(5,2)  NULL,
    updated_at      DATETIME      NULL CONSTRAINT DF_health_updated DEFAULT GETDATE(),
    CONSTRAINT FK_member_health_profiles_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.body_progress_logs (
    progress_id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_body_progress_logs PRIMARY KEY,
    member_id      BIGINT        NOT NULL,
    recorded_date  DATE          NOT NULL,
    weight_kg      DECIMAL(5,2)  NULL,
    height_cm      DECIMAL(5,2)  NULL,
    smm_kg         DECIMAL(5,2)  NULL,
    pbf_percent    DECIMAL(5,2)  NULL,
    bmi            DECIMAL(5,2)  NULL,
    max_lift_kg    DECIMAL(6,2)  NULL,
    note           NVARCHAR(300) NULL,
    created_at     DATETIME2(7)  NOT NULL CONSTRAINT DF_body_progress_created DEFAULT SYSDATETIME(),
    CONSTRAINT FK_body_progress_logs_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id)
);
GO

CREATE TABLE dbo.workout_plans (
    plan_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_workout_plans PRIMARY KEY,
    member_id       BIGINT        NOT NULL,
    coach_id        BIGINT        NULL,
    coach_name      NVARCHAR(100) NULL,
    title           NVARCHAR(200) NOT NULL,
    goal            NVARCHAR(300) NULL,
    exercises_json  NVARCHAR(MAX) NOT NULL,
    session_result  NVARCHAR(MAX) NULL,
    coach_feedback  NVARCHAR(MAX) NULL,
    homework        NVARCHAR(MAX) NULL,
    source          VARCHAR(20)   NOT NULL CONSTRAINT DF_workout_plans_source DEFAULT 'COACH',
    created_at      DATETIME2(7)  NOT NULL CONSTRAINT DF_workout_plans_created DEFAULT SYSDATETIME(),
    CONSTRAINT FK_workout_plans_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_workout_plans_coach FOREIGN KEY (coach_id) REFERENCES dbo.users(user_id)
);
GO

-- 1.12 Feedbacks, Check-ins, Coach Leave, Equipments & Loans
CREATE TABLE dbo.feedbacks (
    feedback_id  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_feedbacks PRIMARY KEY,
    member_id    BIGINT        NOT NULL,
    session_id   BIGINT        NOT NULL,
    coach_id     BIGINT        NOT NULL,
    rating       INT           NULL,
    comment      NVARCHAR(MAX) NULL,
    created_at   DATETIME      NULL CONSTRAINT DF_feedbacks_created DEFAULT GETDATE(),
    CONSTRAINT FK_feedbacks_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_feedbacks_session FOREIGN KEY (session_id) REFERENCES dbo.class_sessions(session_id),
    CONSTRAINT FK_feedbacks_coach FOREIGN KEY (coach_id) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_feedbacks_rating CHECK (rating BETWEEN 1 AND 5)
);
GO

CREATE TABLE dbo.member_check_ins (
    check_in_id    BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_member_check_ins PRIMARY KEY,
    member_id      BIGINT       NOT NULL,
    checked_in_at  DATETIME2(7) NOT NULL,
    result         NVARCHAR(20) NOT NULL,
    recorded_by    BIGINT       NOT NULL,
    CONSTRAINT FK_member_check_ins_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_member_check_ins_recorder FOREIGN KEY (recorded_by) REFERENCES dbo.users(user_id),
    CONSTRAINT CK_member_check_ins_result CHECK (result IN (N'VALID', N'REJECTED'))
);
GO

CREATE TABLE dbo.coach_leave_requests (
    request_id               BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_coach_leave_requests PRIMARY KEY,
    coach_id                 BIGINT         NOT NULL,
    coach_name               NVARCHAR(100)  NULL,
    leave_type               NVARCHAR(50)   NOT NULL,
    start_date               DATE           NOT NULL,
    end_date                 DATE           NOT NULL,
    reason                   NVARCHAR(1000) NOT NULL,
    status                   NVARCHAR(20)   NOT NULL CONSTRAINT DF_coach_leave_status DEFAULT N'PENDING',
    approved_by              BIGINT         NULL,
    affected_bookings_count  INT            NOT NULL CONSTRAINT DF_coach_leave_affected DEFAULT 0,
    reassigned_coach_id      BIGINT         NULL,
    created_at               DATETIME2(7)   NOT NULL CONSTRAINT DF_coach_leave_created DEFAULT SYSDATETIME(),
    CONSTRAINT FK_coach_leave_coach FOREIGN KEY (coach_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_coach_leave_approver FOREIGN KEY (approved_by) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_coach_leave_reassigned FOREIGN KEY (reassigned_coach_id) REFERENCES dbo.users(user_id)
);
GO

CREATE TABLE dbo.equipments (
    item_id                BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_equipments PRIMARY KEY,
    item_name              NVARCHAR(150) NOT NULL,
    category               NVARCHAR(50)  NOT NULL,
    rental_price_per_hour  DECIMAL(12,2) NOT NULL,
    total_quantity         INT           NOT NULL,
    available_quantity     INT           NOT NULL,
    status                 NVARCHAR(20)  NOT NULL CONSTRAINT DF_equipments_status DEFAULT N'ACTIVE'
);
GO

CREATE TABLE dbo.equipment_loans (
    loan_id                BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_equipment_loans PRIMARY KEY,
    member_id              BIGINT        NOT NULL,
    member_name            NVARCHAR(100) NULL,
    phone                  NVARCHAR(20)  NULL,
    item_id                BIGINT        NOT NULL,
    item_name              NVARCHAR(150) NULL,
    quantity               INT           NOT NULL CONSTRAINT DF_equipment_loans_quantity DEFAULT 1,
    rental_price_per_hour  DECIMAL(12,2) NOT NULL,
    loaned_at              DATETIME2(7)  NOT NULL CONSTRAINT DF_equipment_loans_loaned DEFAULT SYSDATETIME(),
    returned_at            DATETIME2(7)  NULL,
    rental_fee             DECIMAL(12,2) NULL,
    status                 NVARCHAR(20)  NOT NULL CONSTRAINT DF_equipment_loans_status DEFAULT N'BORROWED',
    payment_method         NVARCHAR(20)  NULL,
    recorded_by            BIGINT        NULL,
    CONSTRAINT FK_equipment_loans_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_equipment_loans_item FOREIGN KEY (item_id) REFERENCES dbo.equipments(item_id),
    CONSTRAINT FK_equipment_loans_recorder FOREIGN KEY (recorded_by) REFERENCES dbo.users(user_id)
);
GO

-- 1.13 Support Tickets, Refund Requests, Notifications, Audit Logs & System Settings
CREATE TABLE dbo.support_tickets (
    ticket_id       BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_support_tickets PRIMARY KEY,
    member_id       BIGINT        NOT NULL,
    member_name     NVARCHAR(100) NULL,
    category        NVARCHAR(50)  NOT NULL,
    title           NVARCHAR(200) NOT NULL,
    description     NVARCHAR(MAX) NOT NULL,
    severity        NVARCHAR(20)  NOT NULL CONSTRAINT DF_support_tickets_severity DEFAULT N'NORMAL',
    status          NVARCHAR(20)  NOT NULL CONSTRAINT DF_support_tickets_status DEFAULT N'SUBMITTED',
    admin_response  NVARCHAR(MAX) NULL,
    created_at      DATETIME2(7)  NOT NULL CONSTRAINT DF_support_tickets_created DEFAULT SYSDATETIME(),
    CONSTRAINT FK_support_tickets_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id)
);
GO

CREATE TABLE dbo.refund_requests (
    refund_id            BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_refund_requests PRIMARY KEY,
    member_id            BIGINT         NOT NULL,
    member_name          NVARCHAR(100)  NULL,
    phone                NVARCHAR(20)   NULL,
    transaction_id       BIGINT         NULL,
    reference_code       NVARCHAR(50)   NULL,
    booking_id           BIGINT         NULL,
    booking_type         VARCHAR(20)    NULL,
    booking_description  NVARCHAR(255)  NULL,
    refund_amount        DECIMAL(12,2)  NOT NULL,
    reason               NVARCHAR(1000) NOT NULL,
    bank_name            NVARCHAR(100)  NULL,
    bank_account         NVARCHAR(50)   NULL,
    account_holder       NVARCHAR(100)  NULL,
    status               NVARCHAR(20)   NOT NULL CONSTRAINT DF_refund_requests_status DEFAULT N'PENDING_APPROVAL',
    approved_by          BIGINT         NULL,
    decision_note        NVARCHAR(500)  NULL,
    created_at           DATETIME2(7)   NOT NULL CONSTRAINT DF_refund_requests_created DEFAULT SYSDATETIME(),
    CONSTRAINT FK_refund_requests_member FOREIGN KEY (member_id) REFERENCES dbo.users(user_id),
    CONSTRAINT FK_refund_requests_transaction FOREIGN KEY (transaction_id) REFERENCES dbo.payment_transactions(payment_id),
    CONSTRAINT FK_refund_requests_approver FOREIGN KEY (approved_by) REFERENCES dbo.users(user_id)
);
GO

CREATE TABLE dbo.notifications (
    notification_id  BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notifications PRIMARY KEY,
    user_id          BIGINT        NOT NULL,
    title            NVARCHAR(200) NOT NULL,
    message          NVARCHAR(MAX) NOT NULL,
    type             VARCHAR(30)   NULL,
    is_read          BIT           NOT NULL CONSTRAINT DF_notifications_read DEFAULT 0,
    created_at       DATETIME2(7)  NOT NULL CONSTRAINT DF_notifications_created DEFAULT SYSDATETIME(),
    CONSTRAINT FK_notifications_users FOREIGN KEY (user_id) REFERENCES dbo.users(user_id)
);
GO

CREATE TABLE dbo.audit_logs (
    log_id         BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_audit_logs PRIMARY KEY,
    actor_id       BIGINT         NULL,
    actor_name     NVARCHAR(100)  NULL,
    actor_role     VARCHAR(20)    NULL,
    action         VARCHAR(60)    NOT NULL,
    log_type       VARCHAR(50)    NULL,
    detail         NVARCHAR(1000) NULL,
    user_email     VARCHAR(100)   NULL,
    user_id        BIGINT         NULL,
    ip_address     VARCHAR(50)    NULL,
    user_agent     VARCHAR(500)   NULL,
    action_detail  NVARCHAR(MAX)  NULL,
    status         VARCHAR(20)    NULL,
    error_message  NVARCHAR(500)  NULL,
    created_at     DATETIME2(7)   NOT NULL CONSTRAINT DF_audit_logs_created DEFAULT SYSDATETIME()
);
GO
CREATE INDEX IX_audit_logs_created_at ON dbo.audit_logs(created_at);
CREATE INDEX IX_audit_logs_log_type ON dbo.audit_logs(log_type);
CREATE INDEX IX_audit_logs_user_email ON dbo.audit_logs(user_email);
GO

CREATE TABLE dbo.system_settings (
    setting_key    VARCHAR(60)   NOT NULL CONSTRAINT PK_system_settings PRIMARY KEY,
    setting_value  NVARCHAR(MAX) NULL,
    updated_at     DATETIME2(7)  NOT NULL CONSTRAINT DF_system_settings_updated DEFAULT SYSDATETIME()
);
GO

/* ============================================================================
   2. CLEAN REALISTIC SEED DATA (RELATIVE DATES FOR LIVE DEFENSE)
   ============================================================================ */

DECLARE @Now          DATETIME2(7) = SYSDATETIME();
DECLARE @Today        DATE         = CAST(@Now AS DATE);
DECLARE @PwdHash      NVARCHAR(100) = N'$2b$10$Eo9Gf3pOB5yojtOjrZosvOvgDWYLUXYK2m2eEnZqRQuDSyhiK.NOq'; -- SportHub@123
DECLARE @FullWeekAvail NVARCHAR(MAX) = N'[{"day":"MONDAY","morning":true,"afternoon":true,"evening":true},{"day":"TUESDAY","morning":true,"afternoon":true,"evening":true},{"day":"WEDNESDAY","morning":true,"afternoon":true,"evening":true},{"day":"THURSDAY","morning":true,"afternoon":true,"evening":true},{"day":"FRIDAY","morning":true,"afternoon":true,"evening":true},{"day":"SATURDAY","morning":true,"afternoon":true,"evening":true},{"day":"SUNDAY","morning":true,"afternoon":true,"evening":true}]';

-- ----------------------------------------------------------------------------
-- 2.1 Users (16 accounts across all roles & states)
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.users ON;
INSERT INTO dbo.users (user_id, full_name, email, password, phone, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, role, status, require_password_change, created_at, rfid_code, specialty, experience_years, certifications, bio, availability_json)
VALUES
    -- Managers (1-2)
    (1,  N'Nguyễn Văn Quản Lý', N'manager@sporthub.com',     @PwdHash, '0901234567', '1988-05-12', N'Nam', N'123 Nguyễn Văn Linh, Quận 7, TP.HCM',       N'Nguyễn Thị Lan',   '0901234500', 'MANAGER',      'ACTIVE', 0, DATEADD(DAY, -90, @Now), NULL, NULL, NULL, NULL, NULL, NULL),
    (2,  N'Trần Thị Giám Đốc',  N'director@sporthub.com',    @PwdHash, '0909876543', '1985-09-20', N'Nữ',  N'45 Lê Lợi, Quận 1, TP.HCM',                 N'Trần Văn Hùng',    '0909876500', 'MANAGER',      'ACTIVE', 0, DATEADD(DAY, -90, @Now), NULL, NULL, NULL, NULL, NULL, NULL),

    -- Receptionists (3-4)
    (3,  N'Lê Thị Lễ Tân',      N'reception.le@sporthub.com', @PwdHash, '0912345678', '1999-03-18', N'Nữ',  N'88 Nguyễn Thị Thập, Quận 7, TP.HCM',        N'Lê Văn Tâm',       '0912345600', 'RECEPTIONIST', 'ACTIVE', 0, DATEADD(DAY, -60, @Now), NULL, NULL, NULL, NULL, NULL, NULL),
    (4,  N'Phạm Minh Tú',       N'reception.tu@sporthub.com', @PwdHash, '0918765432', '2000-11-05', N'Nữ',  N'220 Huỳnh Tấn Phát, Quận 7, TP.HCM',        N'Phạm Thị Hoa',     '0918765400', 'RECEPTIONIST', 'ACTIVE', 0, DATEADD(DAY, -60, @Now), NULL, NULL, NULL, NULL, NULL, NULL),

    -- Coaches (5-8 ACTIVE, 15 PENDING)
    (5,  N'Trần Văn Minh',      N'coach.minh@sporthub.com',   @PwdHash, '0923456789', '1992-07-14', N'Nam', N'15 Phạm Hùng, Bình Chánh, TP.HCM',          N'Trần Thị Mai',     '0923456700', 'COACH',        'ACTIVE', 0, DATEADD(DAY, -60, @Now), NULL, N'Tennis, Pickleball, Bóng bàn · Thể Lực & Phục Hồi', 6, N'ITF Level 2, IPTPA Certified Pickleball Coach', N'6 năm kinh nghiệm huấn luyện Tennis, Pickleball và tối ưu thể lực thi đấu.', @FullWeekAvail),
    (6,  N'Nguyễn Hoàng Nam',   N'coach.nam@sporthub.com',    @PwdHash, '0928765432', '1994-02-25', N'Nam', N'72 Tôn Dật Tiên, Quận 7, TP.HCM',           N'Nguyễn Văn Bình',  '0928765400', 'COACH',        'ACTIVE', 0, DATEADD(DAY, -60, @Now), NULL, N'Pickleball, Bơi lội, Bóng chuyền',                  5, N'Chứng chỉ HLV Bơi lội Quốc gia, PPR Level 1',       N'Chuyên đào tạo kỹ thuật bơi cơ bản đến nâng cao và Pickleball chiến thuật.', @FullWeekAvail),
    (7,  N'Võ Tấn Phát',        N'coach.phat@sporthub.com',   @PwdHash, '0921112223', '1991-10-08', N'Nam', N'310 Nguyễn Hữu Thọ, Nhà Bè, TP.HCM',        N'Võ Thị Thu',       '0921112200', 'COACH',        'ACTIVE', 0, DATEADD(DAY, -60, @Now), NULL, N'Bóng đá, Điền kinh · Sức bền & Tốc độ',            7, N'AFC C Coaching Certificate, HLV Điền kinh Cấp I',   N'Phụ trách huấn luyện bóng đá sân 7 và phát triển sức bền tim mạch.', @FullWeekAvail),
    (8,  N'Đặng Thu Thảo',      N'coach.thao@sporthub.com',   @PwdHash, '0923334445', '1996-06-30', N'Nữ',  N'54 Trần Xuân Soạn, Quận 7, TP.HCM',         N'Đặng Văn Long',    '0923334400', 'COACH',        'ACTIVE', 0, DATEADD(DAY, -60, @Now), NULL, N'Cầu lông, Yoga & Pilates',                          4, N'BWF Coach Level 1, Yoga Alliance RYT-200',          N'Huấn luyện kỹ thuật cầu lông phản xạ và phục hồi cơ khớp với Yoga.', @FullWeekAvail),

    -- Members (9-14 ACTIVE, 16 LOCKED)
    (9,  N'Nguyễn Anh Khoa',    N'khoa.member@gmail.com',     @PwdHash, '0934567890', '1998-08-19', N'Nam', N'102 Nguyễn Lương Bằng, Quận 7, TP.HCM',     N'Nguyễn Thị Hạnh',  '0934567800', 'MEMBER',       'ACTIVE', 0, DATEADD(DAY, -45, @Now), N'RFID-SH-0009', NULL, NULL, NULL, NULL, NULL),
    (10, N'Hoàng Thị Ngọc',     N'ngoc.hoang@gmail.com',      @PwdHash, '0938765432', '1997-04-22', N'Nữ',  N'68 Hoàng Quốc Việt, Quận 7, TP.HCM',        N'Hoàng Văn Dũng',   '0938765400', 'MEMBER',       'ACTIVE', 0, DATEADD(DAY, -40, @Now), N'RFID-SH-0010', NULL, NULL, NULL, NULL, NULL),
    (11, N'Bùi Huy Hoàng',      N'hoang.bui@gmail.com',       @PwdHash, '0931112233', '1995-12-03', N'Nam', N'19 Đường số 10, KDC Him Lam, Quận 7',       N'Bùi Thị Minh',     '0931112200', 'MEMBER',       'ACTIVE', 0, DATEADD(DAY, -50, @Now), N'RFID-SH-0011', NULL, NULL, NULL, NULL, NULL),
    (12, N'Đỗ Phương Anh',      N'anh.do@gmail.com',          @PwdHash, '0934445566', '2001-01-15', N'Nữ',  N'420 Huỳnh Tấn Phát, Quận 7, TP.HCM',        N'Đỗ Văn Quang',     '0934445500', 'MEMBER',       'ACTIVE', 0, DATEADD(DAY, -30, @Now), N'RFID-SH-0012', NULL, NULL, NULL, NULL, NULL),
    (13, N'Vũ Trọng Tuấn',      N'tuan.vu@gmail.com',         @PwdHash, '0937778899', '1999-09-09', N'Nam', N'14 Lê Văn Lương, Quận 7, TP.HCM',           N'Vũ Thị Nga',       '0937778800', 'MEMBER',       'ACTIVE', 0, DATEADD(DAY, -15, @Now), N'RFID-SH-0013', NULL, NULL, NULL, NULL, NULL),
    (14, N'Lê Minh Châu',       N'chau.le@gmail.com',         @PwdHash, '0935556677', '2000-05-27', N'Nữ',  N'77 Mai Văn Vĩnh, Quận 7, TP.HCM',           N'Lê Quốc Tuấn',     '0935556600', 'MEMBER',       'ACTIVE', 0, DATEADD(DAY, -20, @Now), N'RFID-SH-0014', NULL, NULL, NULL, NULL, NULL),

    -- Special workflow accounts for Defense Demo (Pending Coach & Locked Member)
    (15, N'Trương Quốc Bảo',    N'bao.coach.pending@sporthub.com', @PwdHash, '0926667788', '1995-03-11', N'Nam', N'95 Lâm Văn Bền, Quận 7, TP.HCM',      N'Trương Văn An',    '0926667700', 'COACH',        'PENDING', 0, DATEADD(DAY, -1, @Now), NULL, N'Gym & Fitness, Cầu lông', 3, N'NASM-CPT', N'Ứng viên HLV mới đăng ký chờ Quản lý phê duyệt.', @FullWeekAvail),
    (16, N'Ngô Thanh Sơn',      N'son.locked@gmail.com',      @PwdHash, '0939990011', '1996-11-28', N'Nam', N'18 Bế Văn Cấm, Quận 7, TP.HCM',             N'Ngô Thị Hương',    '0939990000', 'MEMBER',       'LOCKED',  0, DATEADD(DAY, -35, @Now), N'RFID-SH-0016', NULL, NULL, NULL, NULL, NULL);
SET IDENTITY_INSERT dbo.users OFF;

-- ----------------------------------------------------------------------------
-- 2.2 Sports & Public Sports (IDs 1..10)
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.sports ON;
INSERT INTO dbo.sports (sport_id, sport_name, description) VALUES
    (1,  N'Gym & Fitness',  N'Khu vực tập Gym, Cardio và rèn luyện thể lực.'),
    (2,  N'Pickleball',     N'Bộ môn thể thao hiện đại kết hợp giữa Tennis, Cầu lông và Bóng bàn. Phù hợp mọi lứa tuổi.'),
    (3,  N'Tennis',         N'Bộ môn Tennis tiêu chuẩn thi đấu quốc tế, sân mặt cứng có đèn chiếu sáng ban đêm.'),
    (4,  N'Yoga & Pilates', N'Phòng tập Yoga và Pilates yên tĩnh tiêu chuẩn.'),
    (5,  N'Bóng đá',        N'Sân bóng đá cỏ nhân tạo 7 người đạt chuẩn, hệ thống thoát nước hiện đại.'),
    (6,  N'Cầu lông',       N'Thảm cầu lông Yonex tiêu chuẩn trong nhà, hệ thống điều hòa thoáng mát.'),
    (7,  N'Bóng chuyền',    N'Sân bóng chuyền đa năng phục vụ luyện tập và thi đấu.'),
    (8,  N'Bóng bàn',       N'Khu bàn bóng bàn phục vụ luyện tập và thi đấu.'),
    (9,  N'Bơi lội',        N'Hồ bơi và làn bơi phục vụ luyện tập các cấp độ.'),
    (10, N'Điền kinh',      N'Đường chạy phục vụ luyện tập sức bền và điền kinh.');
SET IDENTITY_INSERT dbo.sports OFF;

SET IDENTITY_INSERT dbo.public_sports ON;
INSERT INTO dbo.public_sports (sport_id, slug, name, subtitle, tag, description, icon, area, active) VALUES
    (1,  N'gym-fitness',  N'Gym & Fitness',     N'Trang thiết bị hiện đại', N'Olympic Spec',      N'Máy tập Technogym và Hammer Strength, khu tạ tự do chuẩn Olympic cùng thiết bị hỗ trợ đo lường.', N'fitness_center',   N'Khu vực 800m²',    1),
    (2,  N'pickleball',   N'Sân Pickleball',    N'Cụm 5 sân có mái che',   N'Hot Trend',         N'Mặt sân giảm chấn và hệ thống đèn phục vụ luyện tập, thi đấu cả ngày lẫn đêm.',                   N'sports_tennis',    N'Đạt chuẩn USAPA',  1),
    (3,  N'tennis',       N'Quần vợt Tennis',   N'Sân chuẩn thi đấu',       N'Chuẩn ITF',         N'Sân đất nện nhân tạo và sân cứng, tích hợp máy bắn bóng cùng khu vực thay đồ.',                    N'sports_baseball',  N'7 sân',            1),
    (4,  N'yoga-pilates', N'Yoga & Pilates',    N'Không gian tĩnh lặng',    N'Phục hồi',          N'Phòng tập yên tĩnh với thiết bị Reformer, phù hợp cho luyện tập và phục hồi thể chất.',            N'self_improvement', N'Lớp tối đa 8 người', 1),
    (5,  N'football',     N'Bóng đá',           N'Sân bóng đá',             N'Thể thao đồng đội', N'Bộ môn bóng đá dành cho luyện tập và thi đấu theo nhóm.',                                         N'sports_soccer',    N'Sân bóng đá',      1),
    (6,  N'badminton',    N'Cầu lông',          N'Sân cầu lông',            N'Phổ biến',          N'Bộ môn cầu lông dành cho luyện tập cá nhân và thi đấu đôi.',                                       N'sports_tennis',    N'Sân trong nhà',    1),
    (7,  N'volleyball',   N'Bóng chuyền',       N'Sân bóng chuyền',         N'Thể thao đồng đội', N'Bộ môn bóng chuyền dành cho luyện tập và thi đấu theo đội.',                                       N'sports_volleyball',N'Sân bóng chuyền',  1),
    (8,  N'table-tennis', N'Bóng bàn',          N'Bàn bóng bàn',            N'Phản xạ',           N'Bộ môn bóng bàn phù hợp cho luyện tập kỹ thuật và thi đấu đơn hoặc đôi.',                          N'table_restaurant', N'Khu bóng bàn',     1),
    (9,  N'swimming',     N'Bơi lội',           N'Hồ bơi',                  N'Thể thao dưới nước',N'Bộ môn bơi lội dành cho luyện tập thể lực và cải thiện kỹ thuật bơi.',                             N'pool',             N'Hồ bơi',           1),
    (10, N'athletics',    N'Điền kinh',         N'Đường chạy điền kinh',    N'Rèn thể lực',       N'Bộ môn điền kinh gồm các hoạt động chạy bộ và rèn luyện sức bền.',                                 N'directions_run',   N'Đường chạy',       1);
SET IDENTITY_INSERT dbo.public_sports OFF;

-- ----------------------------------------------------------------------------
-- 2.3 Facilities, Public Facilities & Sports Courts (Canonical IDs matching FacilityCourtSyncService)
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.facilities ON;
INSERT INTO dbo.facilities (facility_id, facility_name, sport_id, capacity, status) VALUES
    (1,  N'Cụm Sân Pickleball - Sân P1 (Indoor)', 2,  4,  'AVAILABLE'),
    (2,  N'Cụm Sân Pickleball - Sân P2 (Indoor)', 2,  4,  'AVAILABLE'),
    (4,  N'Sân Tennis Đơn & Đôi - Sân T1',        3,  4,  'AVAILABLE'),
    (5,  N'Sân Tennis Đơn & Đôi - Sân T2',        3,  4,  'AVAILABLE'),
    (10, N'Sân Bóng Chuyền - Sân V1',             7,  12, 'AVAILABLE'),
    (11, N'Khu Bóng Bàn - Bàn T1',                8,  4,  'AVAILABLE'),
    (12, N'Hồ Bơi - Làn S1',                      9,  8,  'AVAILABLE'),
    (13, N'Đường Chạy Điền Kinh - Khu A1',        10, 12, 'AVAILABLE'),
    (14, N'Sân Bóng Đá 7 Người - Sân F1',         5,  14, 'AVAILABLE'),
    (15, N'Sân Bóng Đá 7 Người - Sân F2',         5,  14, 'AVAILABLE'),
    (16, N'Sân Cầu Lông Trong Nhà - Sân B1',      6,  4,  'AVAILABLE'),
    (17, N'Sân Cầu Lông Trong Nhà - Sân B2',      6,  4,  'AVAILABLE'),
    (18, N'Sân Bóng Chuyền - Sân V2',             7,  12, 'AVAILABLE'),
    (19, N'Khu Bóng Bàn - Bàn T2',                8,  4,  'AVAILABLE'),
    (20, N'Hồ Bơi - Làn S2',                      9,  8,  'AVAILABLE'),
    (21, N'Đường Chạy Điền Kinh - Khu A2',        10, 12, 'AVAILABLE');
SET IDENTITY_INSERT dbo.facilities OFF;

SET IDENTITY_INSERT dbo.public_facilities ON;
INSERT INTO dbo.public_facilities (facility_id, slug, name, description, icon, highlight, active) VALUES
    (1,  N'booking-pickleball-01',   N'Cụm Sân Pickleball - Sân P1 (Indoor)', N'Cụm sân Pickleball tiêu chuẩn trong nhà.',                 N'sports_tennis',     N'Sân trong nhà',    1),
    (2,  N'booking-pickleball-02',   N'Cụm Sân Pickleball - Sân P2 (Indoor)', N'Cụm sân Pickleball tiêu chuẩn trong nhà.',                 N'sports_tennis',     N'Sân trong nhà',    1),
    (4,  N'booking-tennis-01',       N'Sân Tennis Đơn & Đôi - Sân T1',        N'Sân tennis mặt cứng tiêu chuẩn quốc tế ITF.',              N'sports_tennis',     N'Mặt sân ITF',      1),
    (5,  N'booking-tennis-02',       N'Sân Tennis Đơn & Đôi - Sân T2',        N'Sân tennis có mái che và hệ thống đèn LED.',               N'sports_tennis',     N'Có mái che',       1),
    (10, N'booking-volleyball-01',   N'Sân Bóng Chuyền - Sân V1',             N'Sân trong nhà phục vụ lớp học và luyện tập.',              N'sports_volleyball', N'Sân trong nhà',    1),
    (11, N'booking-table-tennis-01', N'Bàn bóng bàn T1',                      N'Bàn bóng bàn khu luyện tập.',                              N'table_restaurant',  N'Bàn tiêu chuẩn',   1),
    (12, N'booking-swimming-01',     N'Hồ bơi - Làn S1',                      N'Làn bơi tiêu chuẩn phục vụ lớp học và luyện tập.',         N'pool',              N'Làn bơi',          1),
    (13, N'booking-athletics-01',    N'Đường chạy điền kinh A1',              N'Khu đường chạy phục vụ lớp học và luyện tập.',             N'directions_run',    N'Đường chạy',       1),
    (14, N'booking-football-01',     N'Sân bóng đá 7 người - Sân F1',         N'Sân cỏ nhân tạo phục vụ lớp học và luyện tập.',            N'sports_soccer',     N'Sân cỏ nhân tạo',  1),
    (15, N'booking-football-02',     N'Sân bóng đá 7 người - Sân F2',         N'Sân cỏ nhân tạo có đèn buổi tối.',                         N'sports_soccer',     N'Sân cỏ nhân tạo',  1),
    (16, N'booking-badminton-01',    N'Sân cầu lông - Sân B1',                N'Sân cầu lông trong nhà phục vụ lớp học và luyện tập.',     N'sports_tennis',     N'Sân trong nhà',    1),
    (17, N'booking-badminton-02',    N'Sân cầu lông - Sân B2',                N'Sân cầu lông trong nhà thảm tiêu chuẩn.',                  N'sports_tennis',     N'Sân trong nhà',    1),
    (18, N'booking-volleyball-02',   N'Sân Bóng Chuyền - Sân V2',             N'Sân đa năng phục vụ luyện tập và thi đấu.',                N'sports_volleyball', N'Sân đa năng',      1),
    (19, N'booking-table-tennis-02', N'Bàn bóng bàn T2',                      N'Bàn bóng bàn thi đấu.',                                    N'table_restaurant',  N'Bàn tiêu chuẩn',   1),
    (20, N'booking-swimming-02',     N'Hồ bơi - Làn S2',                      N'Làn bơi khu luyện tập.',                                   N'pool',              N'Làn bơi',          1),
    (21, N'booking-athletics-02',    N'Đường chạy điền kinh A2',              N'Khu đường chạy tiêu chuẩn.',                               N'directions_run',    N'Đường chạy',       1),
    (22, N'check-in-qr',             N'Check-in QR & RFID',                   N'Hội viên chủ động check-in tại quầy bằng QR hoặc thẻ RFID, giúp việc vào trung tâm thuận tiện hơn.', N'lock_open', N'Check-in tự động', 1),
    (23, N'coach',                   N'Đội ngũ huấn luyện viên',              N'Đội ngũ huấn luyện viên đồng hành, tư vấn và cá nhân hóa nội dung luyện tập theo mục tiêu hội viên.', N'verified_user', N'Kèm 1-1 chuyên sâu', 1),
    (24, N'ai-assistant',            N'Trợ lý luyện tập thông minh',          N'Trợ lý hỗ trợ giải đáp, theo dõi thông tin thể trạng và gợi ý lộ trình luyện tập phù hợp.', N'smart_toy', N'Hỗ trợ luyện tập', 1),
    (25, N'flexible-hours',          N'Thời gian tập linh hoạt',              N'Lịch hoạt động linh hoạt giúp hội viên chủ động sắp xếp thời gian đến tập và sử dụng dịch vụ.', N'access_time', N'Lịch linh hoạt', 1);
SET IDENTITY_INSERT dbo.public_facilities OFF;

SET IDENTITY_INSERT dbo.sports_courts ON;
INSERT INTO dbo.sports_courts (court_id, sport_id, court_name, description, hourly_rate, opens_at, closes_at, active) VALUES
    (1,  2,  N'Pickleball Court 01',   N'Sân có mái che, mặt sân tiêu chuẩn.',            180000, '06:00:00', '22:00:00', 1),
    (2,  2,  N'Pickleball Court 02',   N'Sân mái che khu vực trung tâm.',                 200000, '06:00:00', '22:00:00', 1),
    (3,  3,  N'Tennis Court 01',       N'Sân tennis ngoài trời, mặt sân tiêu chuẩn.',     320000, '06:00:00', '22:00:00', 1),
    (4,  3,  N'Tennis Court 02',       N'Sân tennis có đèn chiếu sáng buổi tối.',         350000, '06:00:00', '22:00:00', 1),
    (8,  5,  N'Sân bóng đá 7 người 01',N'Sân cỏ nhân tạo 7 người.',                       500000, '06:00:00', '22:00:00', 1),
    (9,  5,  N'Sân bóng đá 7 người 02',N'Sân cỏ nhân tạo 7 người, có đèn buổi tối.',      550000, '06:00:00', '22:00:00', 1),
    (10, 6,  N'Sân cầu lông 01',       N'Sân cầu lông trong nhà.',                        100000, '06:00:00', '22:00:00', 1),
    (11, 6,  N'Sân cầu lông 02',       N'Sân cầu lông trong nhà, thảm tiêu chuẩn.',       120000, '06:00:00', '22:00:00', 1),
    (12, 7,  N'Sân bóng chuyền 01',    N'Sân bóng chuyền trong nhà.',                     250000, '06:00:00', '22:00:00', 1),
    (13, 7,  N'Sân bóng chuyền 02',    N'Sân bóng chuyền đa năng.',                       280000, '06:00:00', '22:00:00', 1),
    (14, 8,  N'Bàn bóng bàn 01',       N'Bàn bóng bàn khu luyện tập.',                     50000, '06:00:00', '22:00:00', 1),
    (15, 8,  N'Bàn bóng bàn 02',       N'Bàn bóng bàn thi đấu.',                           60000, '06:00:00', '22:00:00', 1),
    (16, 9,  N'Làn bơi 01',            N'Làn bơi tiêu chuẩn.',                            180000, '06:00:00', '21:00:00', 1),
    (17, 9,  N'Làn bơi 02',            N'Làn bơi khu luyện tập.',                         220000, '06:00:00', '21:00:00', 1),
    (18, 10, N'Đường chạy 01',         N'Khu đường chạy luyện tập.',                       80000, '05:00:00', '21:00:00', 1),
    (19, 10, N'Đường chạy 02',         N'Khu đường chạy tiêu chuẩn.',                     100000, '05:00:00', '21:00:00', 1);
SET IDENTITY_INSERT dbo.sports_courts OFF;

-- Scheduled future maintenance on Court 17 (Làn bơi 02) so Admin Maintenance page has sample data
SET IDENTITY_INSERT dbo.court_maintenance ON;
INSERT INTO dbo.court_maintenance (maintenance_id, court_id, start_time, end_time, reason, created_by, created_at)
VALUES (1, 17, DATEADD(HOUR, 8, CAST(DATEADD(DAY, 7, @Today) AS DATETIME2)), DATEADD(HOUR, 12, CAST(DATEADD(DAY, 7, @Today) AS DATETIME2)), N'Bảo trì hệ thống lọc nước định kỳ và vệ sinh thành bể làn S2', 1, DATEADD(DAY, -1, @Now));
SET IDENTITY_INSERT dbo.court_maintenance OFF;

-- ----------------------------------------------------------------------------
-- 2.4 Membership Packages & Vouchers
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.membership_packages ON;
INSERT INTO dbo.membership_packages (package_id, name, sport_id, price, duration_days, access_type, description, status, package_type, quota_sessions, quota_courts) VALUES
    (1, N'Thẻ Hội Viên VIP Diamond (Toàn Hệ Thống)', NULL, 2800000.00, 30, 'ALL_DAY',  N'Tập không giới hạn tất cả bộ môn, 30 buổi lớp/PT và 15 giờ đặt sân, miễn phí tủ đồ & khăn.', 'ACTIVE', 'VIP',   30, 15),
    (2, N'Thẻ Hội Viên Vàng Off-Peak',              NULL, 1500000.00, 30, 'OFF_PEAK', N'Ưu đãi khung giờ 08:00 - 16:00, bao gồm 20 buổi lớp học và 10 giờ đặt sân.',               'ACTIVE', 'VIP',   20, 10),
    (3, N'Khóa Học Pickleball Căn Bản (10 Buổi)',    2,    1800000.00, 45, 'ALL_DAY',  N'10 buổi học kỹ thuật cầm vợt, giao bóng, dink & chiến thuật đôi cùng HLV Pickleball.',         'ACTIVE', 'CLASS', 10,  0),
    (4, N'Gói Tennis & Đặt Sân Giờ Vàng',            3,    2200000.00, 30, 'PEAK',     N'12 buổi tập Tennis và 15 giờ đặt sân khung giờ vàng (17:00 - 21:00).',                        'ACTIVE', 'PT',    12, 15),
    (5, N'Gói Tập Cầu Lông Học Sinh / Sinh Viên',    6,     800000.00, 30, 'OFF_PEAK', N'15 buổi lớp cầu lông cơ bản & phản xạ dành riêng cho học sinh, sinh viên.',                  'ACTIVE', 'CLASS', 15,  0),
    (6, N'Gói PT 1-1 Thể Lực & Phục Hồi (8 Buổi)',   1,    3200000.00, 45, 'ALL_DAY',  N'8 buổi kèm riêng 1-1 cùng HLV, đo chỉ số InBody và thiết kế giáo án cá nhân hóa.',           'ACTIVE', 'PT',     8,  0);
SET IDENTITY_INSERT dbo.membership_packages OFF;

SET IDENTITY_INSERT dbo.vouchers ON;
INSERT INTO dbo.vouchers (voucher_id, code, discount_type, discount_value, discount_percent, discount_amount, max_discount_amount, min_purchase, valid_from, valid_until, usage_limit, used_count, applies_to, status) VALUES
    (1, N'WELCOME2026', N'PERCENT', 20.00,    20,   200000.00, 200000.00, 0.00,      DATEADD(DAY, -30, @Today), '2026-12-31', 200,  12, N'ALL', N'ACTIVE'),
    (2, N'SPORTSHUB10', N'PERCENT', 10.00,    10,   100000.00, 100000.00, 0.00,      DATEADD(DAY, -30, @Today), '2026-12-31', 150,  18, N'ALL', N'ACTIVE'),
    (3, N'VIPMEMBER',   N'PERCENT', 15.00,    15,   300000.00, 300000.00, 0.00,      DATEADD(DAY, -30, @Today), '2026-12-31', 100,   6, N'ALL', N'ACTIVE'),
    (4, N'TET2026',     N'PERCENT', 20.00,    20,   500000.00, 500000.00, 500000.00, DATEADD(DAY, -30, @Today), '2026-12-31', 200,  15, N'ALL', N'ACTIVE'),
    (5, N'GIAM50K',     N'FIXED',   50000.00, NULL, 50000.00,  NULL,      150000.00, DATEADD(DAY, -30, @Today), '2026-12-31', 500,  48, N'ALL', N'ACTIVE'),
    (6, N'WELCOME20',   N'PERCENT', 20.00,    20,   300000.00, 300000.00, 100000.00, DATEADD(DAY, -30, @Today), '2026-12-31', 1000, 89, N'ALL', N'ACTIVE'),
    (7, N'SUMMEREND',   N'PERCENT', 30.00,    30,   500000.00, 500000.00, 0.00,      '2026-06-01',              '2026-09-30', 50,   50, N'ALL', N'EXPIRED');
SET IDENTITY_INSERT dbo.vouchers OFF;

-- ----------------------------------------------------------------------------
-- 2.5 User Memberships (Clean state per demo member)
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.user_memberships ON;
INSERT INTO dbo.user_memberships (um_id, user_id, package_id, start_date, end_date, status, remaining_quota_sessions, held_quota_sessions, used_quota_sessions, initial_quota_sessions, remaining_quota_courts, held_quota_courts, used_quota_courts, initial_quota_courts) VALUES
    -- Khoa (9): Active Gold Off-Peak + Active Pickleball 10 sessions (gives VIP badge + active quota!)
    (1, 9,  2, DATEADD(DAY, -10, @Today), DATEADD(DAY, 20, @Today),  'ACTIVE',           18, 1, 1, 20, 8, 1, 1, 10),
    (2, 9,  3, DATEADD(DAY, -5,  @Today), DATEADD(DAY, 40, @Today),  'ACTIVE',            8, 1, 1, 10, 0, 0, 0,  0),
    -- Ngọc (10): Active VIP Diamond
    (3, 10, 1, DATEADD(DAY, -12, @Today), DATEADD(DAY, 18, @Today),  'ACTIVE',           27, 1, 2, 30, 14, 0, 1, 15),
    -- Hoàng (11): Expired Tennis package (for Renewal demo)
    (4, 11, 4, DATEADD(DAY, -45, @Today), DATEADD(DAY, -15, @Today), 'EXPIRED',           0, 0, 12, 12, 5, 0, 10, 15),
    -- Phương Anh (12): Pending Manager Approval (ready to approve in /admin/staff-approvals!)
    (5, 12, 5, @Today,                    DATEADD(DAY, 30, @Today),  'PENDING_APPROVAL',  0, 0, 0, 0,  0, 0, 0,  0),
    -- Minh Châu (14): Active VIP Diamond
    (6, 14, 1, DATEADD(DAY, -7,  @Today), DATEADD(DAY, 23, @Today),  'ACTIVE',           29, 0, 1, 30, 15, 0, 0, 15);
SET IDENTITY_INSERT dbo.user_memberships OFF;

-- ----------------------------------------------------------------------------
-- 2.6 Payment Transactions, Payment Attempts, Gateway Receipts & Legacy Payments
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.payment_transactions ON;
INSERT INTO dbo.payment_transactions (payment_id, member_id, membership_id, voucher_id, gateway_reference, booking_type, amount, payment_method, payment_status, reference_code, created_at, transaction_date, payment_completed_at, item_type, item_description) VALUES
    -- Membership purchases (1..6)
    (1,  9,  1, 2,    'VNP-MBR-100001', N'MEMBERSHIP_PACKAGE', 1350000.00, N'VNPAY',            N'PAID',     N'MBR-2026-0001', DATEADD(DAY, -10, @Now), FORMAT(DATEADD(DAY, -10, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -10, @Now), 'MEMBERSHIP', N'Thẻ Hội Viên Vàng Off-Peak'),
    (2,  9,  2, NULL, 'VNP-MBR-100002', N'MEMBERSHIP_PACKAGE', 1800000.00, N'VNPAY',            N'PAID',     N'MBR-2026-0002', DATEADD(DAY, -5,  @Now), FORMAT(DATEADD(DAY, -5,  @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -5,  @Now), 'MEMBERSHIP', N'Khóa Học Pickleball Căn Bản (10 Buổi)'),
    (3,  10, 3, 1,    NULL,             N'MEMBERSHIP_PACKAGE', 2600000.00, N'CASH',             N'PAID',     N'POS-2026-0003', DATEADD(DAY, -6,  @Now), FORMAT(DATEADD(DAY, -6,  @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -6,  @Now), 'MEMBERSHIP', N'Thẻ Hội Viên VIP Diamond (Toàn Hệ Thống)'),
    (4,  11, 4, NULL, NULL,             N'MEMBERSHIP_PACKAGE', 2200000.00, N'CASH',             N'PAID',     N'POS-2026-0004', DATEADD(DAY, -45, @Now), FORMAT(DATEADD(DAY, -45, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -45, @Now), 'MEMBERSHIP', N'Gói Tennis & Đặt Sân Giờ Vàng'),
    (5,  12, 5, NULL, NULL,             N'MEMBERSHIP_PACKAGE',  800000.00, N'CASH',             N'PAID',     N'POS-2026-0005', DATEADD(MINUTE, -45, @Now), FORMAT(DATEADD(MINUTE, -45, @Now), 'yyyyMMddHHmmss'), DATEADD(MINUTE, -45, @Now), 'MEMBERSHIP', N'Gói Tập Cầu Lông Học Sinh / Sinh Viên'),
    (6,  14, 6, 3,    'VNP-MBR-100006', N'MEMBERSHIP_PACKAGE', 2500000.00, N'VNPAY',            N'PAID',     N'MBR-2026-0006', DATEADD(DAY, -3,  @Now), FORMAT(DATEADD(DAY, -3,  @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -3,  @Now), 'MEMBERSHIP', N'Thẻ Hội Viên VIP Diamond (Toàn Hệ Thống)'),

    -- Class & Court payments (7..16)
    (7,  9,  NULL, NULL, NULL,             N'CLASS',  200000.00, N'VNPAY',            N'PAID',     N'CLS-2026-0007', DATEADD(DAY, -4, @Now), FORMAT(DATEADD(DAY, -4, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -4, @Now), 'CLASS', N'Lớp Tennis Chuyên Kỹ Thuật Serve - HLV Trần Văn Minh'),
    (8,  12, NULL, NULL, NULL,             N'CLASS',  200000.00, N'CASH',             N'PAID',     N'CLS-2026-0008', DATEADD(DAY, -4, @Now), FORMAT(DATEADD(DAY, -4, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -4, @Now), 'CLASS', N'Lớp Tennis Chuyên Kỹ Thuật Serve - HLV Trần Văn Minh'),
    (9,  9,  NULL, NULL, NULL,             N'CLASS',       0.00, N'MEMBERSHIP_QUOTA', N'PAID',     N'QTA-2026-0009', DATEADD(DAY, -2, @Now), FORMAT(DATEADD(DAY, -2, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -2, @Now), 'CLASS', N'Lớp Pickleball Căn Bản K12 - HLV Trần Văn Minh'),
    (10, 10, NULL, NULL, NULL,             N'CLASS',       0.00, N'MEMBERSHIP_QUOTA', N'PAID',     N'QTA-2026-0010', DATEADD(DAY, -2, @Now), FORMAT(DATEADD(DAY, -2, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -2, @Now), 'CLASS', N'Lớp Pickleball Căn Bản K12 - HLV Trần Văn Minh'),
    (11, 10, NULL, NULL, NULL,             N'CLASS',       0.00, N'MEMBERSHIP_QUOTA', N'PAID',     N'QTA-2026-0011', DATEADD(DAY, -1, @Now), FORMAT(DATEADD(DAY, -1, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -1, @Now), 'CLASS', N'Lớp Bơi Lội Căn Bản - HLV Nguyễn Hoàng Nam'),
    (12, 11, NULL, NULL, NULL,             N'CLASS',  180000.00, N'VNPAY',            N'PAID',     N'CLS-2026-0012', DATEADD(DAY, -3, @Now), FORMAT(DATEADD(DAY, -3, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -3, @Now), 'CLASS', N'Lớp Bóng Đá Cơ Bản - HLV Võ Tấn Phát'),
    (13, 9,  NULL, 5,    'VNP-CLS-100013', N'CLASS',  150000.00, N'VNPAY',            N'PAID',     N'CLS-2026-0013', DATEADD(HOUR, -1, @Now), FORMAT(DATEADD(HOUR, -1, @Now), 'yyyyMMddHHmmss'), DATEADD(HOUR, -1, @Now), 'CLASS', N'Lớp Tennis Chiến Thuật Đánh Đôi - HLV Trần Văn Minh (Ngày mai)'),
    (14, 9,  NULL, NULL, 'VNP-CRT-100014', N'COURT',  320000.00, N'VNPAY',            N'PAID',     N'CRT-2026-0014', DATEADD(MINUTE, -30, @Now), FORMAT(DATEADD(MINUTE, -30, @Now), 'yyyyMMddHHmmss'), DATEADD(MINUTE, -30, @Now), 'COURT', N'Tennis Court 01 - Ngày mai 18:00-19:00'),
    (15, 11, NULL, NULL, 'VNP-CRT-100015', N'COURT',  350000.00, N'VNPAY',            N'PAID',     N'CRT-2026-0015', DATEADD(HOUR, -3, @Now), FORMAT(DATEADD(HOUR, -3, @Now), 'yyyyMMddHHmmss'), DATEADD(HOUR, -3, @Now), 'COURT', N'Tennis Court 02 - Ngày kia 19:00-20:00 (Đề nghị hoàn tiền)'),
    (16, 10, NULL, NULL, 'VNP-CRT-100016', N'COURT',  180000.00, N'VNPAY',            N'REFUNDED', N'CRT-2026-0016', DATEADD(DAY, -2, @Now), FORMAT(DATEADD(DAY, -2, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -2, @Now), 'COURT', N'Pickleball Court 01 - Đã hoàn tiền'),
    (17, 13, NULL, NULL, NULL,             N'COURT',  500000.00, N'CASH',             N'PAID',     N'CRT-2026-0017', DATEADD(DAY, -1, @Now), FORMAT(DATEADD(DAY, -1, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -1, @Now), 'COURT', N'Sân bóng đá 7 người 01 - 19:00-20:00'),
    (18, 9,  NULL, NULL, NULL,             N'COURT',       0.00, N'MEMBERSHIP_QUOTA', N'PAID',     N'CRT-2026-0018', DATEADD(DAY, -3, @Now), FORMAT(DATEADD(DAY, -3, @Now), 'yyyyMMddHHmmss'), DATEADD(DAY, -3, @Now), 'COURT', N'Pickleball Court 02 - Dùng quota hội viên');
SET IDENTITY_INSERT dbo.payment_transactions OFF;

-- Payment Attempts & Gateway Receipts (including 1 REVIEW_REQUIRED case for /admin/payment-reconciliation!)
SET IDENTITY_INSERT dbo.payment_attempts ON;
INSERT INTO dbo.payment_attempts (attempt_id, payment_id, gateway_reference, amount, status, payment_url, created_at, expires_at, merchant_date) VALUES
    (1, 1,  'VNP-MBR-100001', 1350000.00, 'SUCCEEDED', NULL, DATEADD(DAY, -10, @Now), DATEADD(MINUTE, 15, DATEADD(DAY, -10, @Now)), FORMAT(DATEADD(DAY, -10, @Now), 'yyyyMMddHHmmss')),
    (2, 2,  'VNP-MBR-100002', 1800000.00, 'SUCCEEDED', NULL, DATEADD(DAY, -5,  @Now), DATEADD(MINUTE, 15, DATEADD(DAY, -5,  @Now)), FORMAT(DATEADD(DAY, -5,  @Now), 'yyyyMMddHHmmss')),
    (3, 6,  'VNP-MBR-100006', 2500000.00, 'SUCCEEDED', NULL, DATEADD(DAY, -3,  @Now), DATEADD(MINUTE, 15, DATEADD(DAY, -3,  @Now)), FORMAT(DATEADD(DAY, -3,  @Now), 'yyyyMMddHHmmss')),
    (4, 13, 'VNP-CLS-100013',  150000.00, 'SUCCEEDED', NULL, DATEADD(HOUR, -1, @Now), DATEADD(MINUTE, 15, DATEADD(HOUR, -1, @Now)), FORMAT(DATEADD(HOUR, -1, @Now), 'yyyyMMddHHmmss')),
    (5, 14, 'VNP-CRT-100014',  320000.00, 'SUCCEEDED', NULL, DATEADD(MINUTE, -30, @Now), DATEADD(MINUTE, -15, @Now),                  FORMAT(DATEADD(MINUTE, -30, @Now), 'yyyyMMddHHmmss')),
    (6, 15, 'VNP-CRT-100015',  350000.00, 'SUCCEEDED', NULL, DATEADD(HOUR, -3, @Now), DATEADD(MINUTE, 15, DATEADD(HOUR, -3, @Now)), FORMAT(DATEADD(HOUR, -3, @Now), 'yyyyMMddHHmmss'));
SET IDENTITY_INSERT dbo.payment_attempts OFF;

SET IDENTITY_INSERT dbo.gateway_receipts ON;
INSERT INTO dbo.gateway_receipts (receipt_id, payment_id, attempt_id, gateway_transaction_no, gateway_reference, amount, transaction_date, status, reconciliation_note, created_at, resolved_at) VALUES
    (1, 1,  1, '14620001', 'VNP-MBR-100001', 1350000.00, FORMAT(DATEADD(DAY, -10, @Now), 'yyyyMMddHHmmss'), 'APPLIED',         N'Khớp lệnh tự động từ VNPay IPN',           DATEADD(DAY, -10, @Now), DATEADD(DAY, -10, @Now)),
    (2, 2,  2, '14620002', 'VNP-MBR-100002', 1800000.00, FORMAT(DATEADD(DAY, -5,  @Now), 'yyyyMMddHHmmss'), 'APPLIED',         N'Khớp lệnh tự động từ VNPay IPN',           DATEADD(DAY, -5,  @Now), DATEADD(DAY, -5,  @Now)),
    (3, 6,  3, '14620003', 'VNP-MBR-100006', 2500000.00, FORMAT(DATEADD(DAY, -3,  @Now), 'yyyyMMddHHmmss'), 'APPLIED',         N'Khớp lệnh tự động từ VNPay IPN',           DATEADD(DAY, -3,  @Now), DATEADD(DAY, -3,  @Now)),
    (4, 13, 4, '14620004', 'VNP-CLS-100013',  150000.00, FORMAT(DATEADD(HOUR, -1, @Now), 'yyyyMMddHHmmss'), 'APPLIED',         N'Khớp lệnh thanh toán lớp Tennis',          DATEADD(HOUR, -1, @Now), DATEADD(HOUR, -1, @Now)),
    (5, 14, 5, '14620005', 'VNP-CRT-100014',  320000.00, FORMAT(DATEADD(MINUTE, -30, @Now), 'yyyyMMddHHmmss'), 'APPLIED',       N'Khớp lệnh thanh toán đặt sân Tennis 01',   DATEADD(MINUTE, -30, @Now), DATEADD(MINUTE, -30, @Now)),
    (6, 15, 6, '14620006', 'VNP-CRT-100015',  350000.00, FORMAT(DATEADD(HOUR, -3, @Now), 'yyyyMMddHHmmss'), 'REVIEW_REQUIRED', N'Cần đối soát hoàn tiền giao dịch Tennis 02', DATEADD(HOUR, -3, @Now), NULL);
SET IDENTITY_INSERT dbo.gateway_receipts OFF;

-- Legacy Reception Payments synced with Membership sales & POS Staff KPI
SET IDENTITY_INSERT dbo.payments ON;
INSERT INTO dbo.payments (payment_id, member_id, um_id, voucher_id, amount, payment_method, payment_status, approved_by, created_at) VALUES
    (1, 9,  1, 2,    1350000.00, 'ONLINE',   'COMPLETED', 3, DATEADD(DAY, -10, @Now)),
    (2, 9,  2, NULL, 1800000.00, 'ONLINE',   'COMPLETED', 3, DATEADD(DAY, -5,  @Now)),
    (3, 10, 3, 1,    2600000.00, 'CASH',     'COMPLETED', 3, DATEADD(DAY, -6,  @Now)),
    (4, 11, 4, NULL, 2200000.00, 'POS',      'COMPLETED', 4, DATEADD(DAY, -45, @Now)),
    (5, 12, 5, NULL,  800000.00, 'TRANSFER', 'COMPLETED', 4, DATEADD(MINUTE, -45, @Now)),
    (6, 14, 6, 3,    2500000.00, 'ONLINE',   'COMPLETED', 3, DATEADD(DAY, -3,  @Now));
SET IDENTITY_INSERT dbo.payments OFF;

-- ----------------------------------------------------------------------------
-- 2.7 Class Sessions (Past COMPLETED + Today + Upcoming 5 days)
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.class_sessions ON;
INSERT INTO dbo.class_sessions (session_id, class_name, sport_id, coach_id, facility_id, start_time, end_time, max_slots, booked_slots, price_amount, status) VALUES
    -- Past completed sessions (for Coach Income, Attendance history & Member Feedbacks)
    (1,  N'Lớp Tennis Chuyên Kỹ Thuật Serve',  3, 5, 4,  DATEADD(HOUR, 18, CAST(DATEADD(DAY, -4, @Today) AS DATETIME)), DATEADD(MINUTE, 1170, CAST(DATEADD(DAY, -4, @Today) AS DATETIME)), 6,  2, 200000.00, 'COMPLETED'),
    (2,  N'Lớp Pickleball Căn Bản K12',        2, 5, 1,  DATEADD(HOUR, 18, CAST(DATEADD(DAY, -2, @Today) AS DATETIME)), DATEADD(MINUTE, 1170, CAST(DATEADD(DAY, -2, @Today) AS DATETIME)), 8,  2, 150000.00, 'COMPLETED'),
    (3,  N'Lớp Bơi Lội Căn Bản',               9, 6, 12, DATEADD(HOUR, 17, CAST(DATEADD(DAY, -1, @Today) AS DATETIME)), DATEADD(MINUTE, 1110, CAST(DATEADD(DAY, -1, @Today) AS DATETIME)), 8,  2, 170000.00, 'COMPLETED'),
    (4,  N'Lớp Bóng Đá Cơ Bản',                5, 7, 14, DATEADD(HOUR, 18, CAST(DATEADD(DAY, -3, @Today) AS DATETIME)), DATEADD(MINUTE, 1170, CAST(DATEADD(DAY, -3, @Today) AS DATETIME)), 14, 2, 180000.00, 'COMPLETED'),

    -- Today's sessions (for Receptionist Dashboard Today's Classes & Coach Attendance!)
    (5,  N'Lớp Pickleball Nâng Cao K05',       2, 5, 2,  DATEADD(HOUR, 19, CAST(@Today AS DATETIME)),                   DATEADD(MINUTE, 1230, CAST(@Today AS DATETIME)),                   8,  2, 180000.00, 'SCHEDULED'),
    (6,  N'Lớp Cầu Lông Phản Xạ Nhanh',        6, 8, 16, DATEADD(HOUR, 18, CAST(@Today AS DATETIME)),                   DATEADD(MINUTE, 1170, CAST(@Today AS DATETIME)),                   8,  1, 150000.00, 'SCHEDULED'),

    -- Upcoming sessions (Day +1 to +4 for Booking, Reschedule & Cancel > 2h Demo!)
    (7,  N'Lớp Tennis Chiến Thuật Đánh Đôi',   3, 5, 5,  DATEADD(HOUR, 18, CAST(DATEADD(DAY, 1, @Today) AS DATETIME)),  DATEADD(MINUTE, 1170, CAST(DATEADD(DAY, 1, @Today) AS DATETIME)),  6,  2, 200000.00, 'SCHEDULED'),
    (8,  N'Lớp Pickleball Kỹ Thuật Dink & Volley', 2, 6, 1, DATEADD(HOUR, 17, CAST(DATEADD(DAY, 2, @Today) AS DATETIME)), DATEADD(MINUTE, 1110, CAST(DATEADD(DAY, 2, @Today) AS DATETIME)), 8,  0, 160000.00, 'SCHEDULED'),
    (9,  N'Lớp Bóng Đá Thể Lực & Phối Hợp',    5, 7, 14, DATEADD(HOUR, 19, CAST(DATEADD(DAY, 2, @Today) AS DATETIME)),  DATEADD(MINUTE, 1230, CAST(DATEADD(DAY, 2, @Today) AS DATETIME)),  14, 1, 180000.00, 'SCHEDULED'),
    (10, N'Lớp Cầu Lông Đánh Đôi Nâng Cao',    6, 8, 17, DATEADD(HOUR, 18, CAST(DATEADD(DAY, 3, @Today) AS DATETIME)),  DATEADD(MINUTE, 1170, CAST(DATEADD(DAY, 3, @Today) AS DATETIME)),  8,  0, 160000.00, 'SCHEDULED'),
    (11, N'Lớp Điền Kinh Sức Bền Morning',     10,7, 13, DATEADD(HOUR, 7,  CAST(DATEADD(DAY, 4, @Today) AS DATETIME)),  DATEADD(MINUTE, 510,  CAST(DATEADD(DAY, 4, @Today) AS DATETIME)),  12, 0, 110000.00, 'SCHEDULED');
SET IDENTITY_INSERT dbo.class_sessions OFF;

-- ----------------------------------------------------------------------------
-- 2.8 Class Bookings & Court Bookings
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.bookings ON;
INSERT INTO dbo.bookings (booking_id, member_id, session_id, booking_time, status, attendance_status, coach_note, homework_note, uses_membership_quota, membership_id, fee_amount, payment_id, quota_state) VALUES
    -- Session 1 (-4d, Coach 5): Khoa PRESENT (already reviewed), Phương Anh PRESENT (already reviewed)
    (1, 9,  1, DATEADD(DAY, -5, @Now), 'CONFIRMED', 'PRESENT',         N'Tư thế giao bóng ổn định, lực cổ tay tốt.',              N'Tập tung bóng 15 phút mỗi ngày.', 0, NULL, 200000.00, 7,  NULL),
    (2, 12, 1, DATEADD(DAY, -5, @Now), 'CONFIRMED', 'PRESENT',         N'Di chuyển linh hoạt, tiếp thu nhanh.',                  N'Luyện bước chân split-step.',     0, NULL, 200000.00, 8,  NULL),

    -- Session 2 (-2d, Coach 5): Khoa PRESENT (ELIGIBLE FOR LIVE REVIEW DEMO!), Ngọc PRESENT
    (3, 9,  2, DATEADD(DAY, -3, @Now), 'CONFIRMED', 'PRESENT',         N'Phản xạ trên lưới rất tốt, giữ nhịp độ trận đấu cao.',  N'Luyện cú dink chéo sân 50 lần.',  1, 2,    0.00,      9,  'USED'),
    (4, 10, 2, DATEADD(DAY, -3, @Now), 'CONFIRMED', 'PRESENT',         N'Kiểm soát bóng ổn định.',                                N'Tập thêm backhand.',              1, 3,    0.00,      10, 'USED'),

    -- Session 3 (-1d, Coach 6): Ngọc PRESENT, Minh Châu EXCUSED_ABSENCE
    (5, 10, 3, DATEADD(DAY, -2, @Now), 'CONFIRMED', 'PRESENT',         N'Kỹ thuật thở sải đều và chuẩn nhịp.',                   N'Bơi 400m nhẹ thả lỏng.',          1, 3,    0.00,      11, 'USED'),
    (6, 14, 3, DATEADD(DAY, -2, @Now), 'CONFIRMED', 'EXCUSED_ABSENCE', N'Học viên báo xin nghỉ phép trước buổi tập.',            NULL,                               0, NULL, 170000.00, NULL, NULL),

    -- Session 4 (-3d, Coach 7): Hoàng PRESENT, Minh Châu PRESENT
    (7, 11, 4, DATEADD(DAY, -4, @Now), 'CONFIRMED', 'PRESENT',         N'Thể lực tốt, phối hợp đồng đội ăn ý.',                  N'Chạy bền 3km.',                   0, NULL, 180000.00, 12, NULL),
    (8, 14, 4, DATEADD(DAY, -4, @Now), 'CONFIRMED', 'PRESENT',         N'Chuyền bóng chính xác.',                                 NULL,                               0, NULL, 180000.00, NULL, NULL),

    -- Session 5 (Today 19:00, Coach 5): Khoa & Ngọc PENDING (ready for Coach/Receptionist live attendance!)
    (9,  9,  5, DATEADD(DAY, -1, @Now), 'CONFIRMED', 'PENDING', NULL, NULL, 1, 2,    0.00, NULL, 'HELD'),
    (10, 10, 5, DATEADD(DAY, -1, @Now), 'CONFIRMED', 'PENDING', NULL, NULL, 1, 3,    0.00, NULL, 'HELD'),

    -- Session 6 (Today 18:00, Coach 8): Ngọc PENDING
    (11, 10, 6, DATEADD(DAY, -1, @Now), 'CONFIRMED', 'PENDING', NULL, NULL, 0, NULL, 150000.00, NULL, NULL),

    -- Session 7 (Tomorrow 18:00, Coach 5): Khoa PAID (ready for live Cancel/Refund > 2h Demo!) & Minh Châu
    (12, 9,  7, DATEADD(HOUR, -1, @Now), 'CONFIRMED', 'PENDING', NULL, NULL, 0, NULL, 150000.00, 13, NULL),
    (13, 14, 7, DATEADD(HOUR, -2, @Now), 'CONFIRMED', 'PENDING', NULL, NULL, 0, NULL, 200000.00, NULL, NULL),

    -- Session 9 (Day+2 19:00, Coach 7): Hoàng
    (14, 11, 9, DATEADD(HOUR, -3, @Now), 'CONFIRMED', 'PENDING', NULL, NULL, 0, NULL, 180000.00, NULL, NULL);
SET IDENTITY_INSERT dbo.bookings OFF;

SET IDENTITY_INSERT dbo.court_bookings ON;
INSERT INTO dbo.court_bookings (court_booking_id, member_id, court_id, start_time, end_time, amount_paid, payment_id, status, created_at, uses_membership_quota, membership_id, quota_hours_used, quota_state) VALUES
    -- Past completed court bookings
    (1, 9,  2, DATEADD(HOUR, 10, CAST(DATEADD(DAY, -3, @Today) AS DATETIME2)), DATEADD(HOUR, 11, CAST(DATEADD(DAY, -3, @Today) AS DATETIME2)), 0.00,      18, N'COMPLETED', DATEADD(DAY, -4, @Now), 1, 1,    1.00, 'USED'),
    (2, 13, 8, DATEADD(HOUR, 19, CAST(DATEADD(DAY, -1, @Today) AS DATETIME2)), DATEADD(HOUR, 20, CAST(DATEADD(DAY, -1, @Today) AS DATETIME2)), 500000.00, 17, N'COMPLETED', DATEADD(DAY, -2, @Now), 0, NULL, 0.00, NULL),
    -- Cancelled past booking (refunded)
    (3, 10, 1, DATEADD(HOUR, 17, CAST(DATEADD(DAY, -2, @Today) AS DATETIME2)), DATEADD(HOUR, 18, CAST(DATEADD(DAY, -2, @Today) AS DATETIME2)), 180000.00, 16, N'CANCELLED', DATEADD(DAY, -3, @Now), 0, NULL, 0.00, NULL),
    -- Upcoming future court bookings
    (4, 9,  3, DATEADD(HOUR, 18, CAST(DATEADD(DAY, 1,  @Today) AS DATETIME2)), DATEADD(HOUR, 19, CAST(DATEADD(DAY, 1,  @Today) AS DATETIME2)), 320000.00, 14, N'CONFIRMED', DATEADD(MINUTE, -30, @Now), 0, NULL, 0.00, NULL),
    (5, 11, 4, DATEADD(HOUR, 19, CAST(DATEADD(DAY, 2,  @Today) AS DATETIME2)), DATEADD(HOUR, 20, CAST(DATEADD(DAY, 2,  @Today) AS DATETIME2)), 350000.00, 15, N'CONFIRMED', DATEADD(HOUR, -3, @Now),    0, NULL, 0.00, NULL),
    (6, 9,  1, DATEADD(HOUR, 9,  CAST(DATEADD(DAY, 3,  @Today) AS DATETIME2)), DATEADD(HOUR, 10, CAST(DATEADD(DAY, 3,  @Today) AS DATETIME2)), 0.00,      NULL, N'CONFIRMED', DATEADD(HOUR, -1, @Now), 1, 1, 1.00, 'HELD');
SET IDENTITY_INSERT dbo.court_bookings OFF;

-- ----------------------------------------------------------------------------
-- 2.9 Health Profiles, Body Progress Logs & Workout Plans
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.member_health_profiles ON;
INSERT INTO dbo.member_health_profiles (profile_id, member_id, fitness_level, fitness_goals, injury_history, weight_kg, height_cm, smm_kg, pbf_percent, bmi, updated_at) VALUES
    (1, 9,  'AMATEUR',      N'Tăng cơ nạc, cải thiện sức bền và nâng 1RM Squat lên 125kg', N'Tiền sử lật cổ chân nhẹ năm 2024 (đã phục hồi)', 71.50, 175.00, 34.20, 16.50, 23.35, DATEADD(DAY, -1, @Now)),
    (2, 10, 'INTERMEDIATE', N'Giảm mỡ cơ thể xuống 20% và cải thiện độ dẻo dai',             N'Không có',                                      56.00, 162.00, 23.40, 22.80, 21.34, DATEADD(DAY, -2, @Now)),
    (3, 11, 'ADVANCED',     N'Thi đấu giải Tennis & Bóng đá phong trào cuối năm',           N'Đau nhẹ cơ vai phải khi giao bóng cường độ cao', 74.00, 178.00, 35.80, 15.20, 23.36, DATEADD(DAY, -5, @Now)),
    (4, 12, 'BEGINNER',     N'Tăng phản xạ Cầu lông và rèn luyện cardio cơ bản',             N'Không có',                                      51.50, 159.00, 20.50, 24.00, 20.37, DATEADD(DAY, -3, @Now)),
    (5, 13, 'BEGINNER',     N'Xây dựng thói quen vận động 3 buổi/tuần',                     N'Không có',                                      66.00, 170.00, 29.00, 19.80, 22.84, DATEADD(DAY, -7, @Now)),
    (6, 14, 'INTERMEDIATE', N'Phát triển sức bền tim mạch và kỹ thuật bơi',                 N'Không có',                                      54.00, 164.00, 22.80, 21.00, 20.08, DATEADD(DAY, -4, @Now));
SET IDENTITY_INSERT dbo.member_health_profiles OFF;

SET IDENTITY_INSERT dbo.body_progress_logs ON;
INSERT INTO dbo.body_progress_logs (progress_id, member_id, recorded_date, weight_kg, height_cm, smm_kg, pbf_percent, bmi, max_lift_kg, note, created_at) VALUES
    -- Khoa (9): 4 progress points showing measurable improvement
    (1, 9,  DATEADD(DAY, -42, @Today), 74.00, 175.00, 32.10, 19.80, 24.16, 95.00,  N'Đánh giá đầu vào InBody tháng trước',   DATEADD(DAY, -42, @Now)),
    (2, 9,  DATEADD(DAY, -28, @Today), 73.20, 175.00, 32.90, 18.60, 23.90, 102.50, N'Cải thiện sức mạnh chân & core',        DATEADD(DAY, -28, @Now)),
    (3, 9,  DATEADD(DAY, -14, @Today), 72.30, 175.00, 33.60, 17.40, 23.61, 110.00, N'Giảm mỡ tốt, tăng khối lượng cơ nạc',   DATEADD(DAY, -14, @Now)),
    (4, 9,  DATEADD(DAY, -1,  @Today), 71.50, 175.00, 34.20, 16.50, 23.35, 117.50, N'Đạt kỷ lục 1RM mới trước tuần thi đấu', DATEADD(DAY, -1,  @Now)),
    -- Ngọc (10): 2 progress points
    (5, 10, DATEADD(DAY, -20, @Today), 57.50, 162.00, 22.80, 24.10, 21.91, 55.00,  N'Đo chỉ số tuần 1',                      DATEADD(DAY, -20, @Now)),
    (6, 10, DATEADD(DAY, -2,  @Today), 56.00, 162.00, 23.40, 22.80, 21.34, 62.50,  N'Giảm 1.5kg mỡ, tăng 0.6kg cơ xương',    DATEADD(DAY, -2,  @Now));
SET IDENTITY_INSERT dbo.body_progress_logs OFF;

SET IDENTITY_INSERT dbo.workout_plans ON;
INSERT INTO dbo.workout_plans (plan_id, member_id, coach_id, coach_name, title, goal, exercises_json, session_result, coach_feedback, homework, source, created_at) VALUES
    (1, 9, 5, N'Trần Văn Minh',
     N'Giáo án Sức Mạnh & Phản Xạ Pickleball (Tuần 3)',
     N'Tối ưu lực phát bóng, tăng tốc độ di chuyển ngang và nâng 1RM Squat',
     N'[{"name":"Barbell Back Squat","sets":4,"reps":8,"weightKg":75,"note":"Kiểm soát nhịp hạ tạ 3 giây","completed":true},{"name":"Romanian Deadlift (RDL)","sets":4,"reps":10,"weightKg":60,"note":"Siết cơ đùi sau và giữ thẳng lưng","completed":true},{"name":"Split-Step Agility Ladder","sets":4,"reps":20,"weightKg":0,"note":"Di chuyển nhanh bằng mũi chân","completed":false},{"name":"Cable Woodchopper (Xoay thân)","sets":3,"reps":12,"weightKg":15,"note":"Tăng lực xoay hông khi đánh Forehand","completed":false}]',
     N'Hoàn thành tốt 2 bài compound đầu, độ sâu Squat chuẩn.',
     N'Tiếp tục giữ nhịp thở đều khi hạ tạ và hoàn thành 2 bài bổ trợ cuối tuần.',
     N'Chạy biến tốc HIIT 15 phút + giãn cơ cổ chân sau buổi tập.',
     'COACH', DATEADD(DAY, -2, @Now)),
    (2, 9, NULL, N'SportHub AI Coach',
     N'Lộ trình Phục Hồi Cổ Chân & Cardio Bổ Trợ',
     N'Tăng ổn định khớp cổ chân và sức bền tim mạch Zone 2',
     N'[{"name":"Single-Leg Balance Hold","sets":3,"reps":30,"weightKg":0,"note":"Giữ thăng bằng 30 giây mỗi chân","completed":true},{"name":"Calf Raises (Nhón bắp chân)","sets":3,"reps":15,"weightKg":12,"note":"Lên chậm xuống chậm","completed":false},{"name":"Zone 2 Stationary Bike","sets":1,"reps":25,"weightKg":0,"note":"Duy trì nhịp tim 135-145 bpm trong 25 phút","completed":false}]',
     NULL,
     N'Kế hoạch tự động cá nhân hóa theo tiền sử lật cổ chân và mục tiêu InBody.',
     N'Uống đủ 2.5L nước và chườm lạnh nếu cảm thấy căng cổ chân.',
     'AI', DATEADD(DAY, -4, @Now)),
    (3, 10, 6, N'Nguyễn Hoàng Nam',
     N'Giáo án Core & Sức Bền Bơi Lội',
     N'Tăng ổn định thân người khi bơi sải và giảm tỷ lệ mỡ PBF',
     N'[{"name":"Front Plank Hold","sets":3,"reps":45,"weightKg":0,"note":"Siết bụng, giữ 45 giây","completed":true},{"name":"Lat Pulldown","sets":4,"reps":12,"weightKg":30,"note":"Kéo xô hỗ trợ quạt nước","completed":true},{"name":"Dumbbell Goblet Squat","sets":3,"reps":12,"weightKg":14,"note":"Tăng lực đạp chân","completed":false}]',
     N'Kỹ thuật kéo xô cải thiện rõ rệt.',
     N'Duy trì 3 buổi/tuần để đạt mục tiêu PBF 20%.',
     N'Giãn vai 10 phút trước khi đi ngủ.',
     'COACH', DATEADD(DAY, -1, @Now));
SET IDENTITY_INSERT dbo.workout_plans OFF;

-- ----------------------------------------------------------------------------
-- 2.10 Feedbacks & Check-ins
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.feedbacks ON;
INSERT INTO dbo.feedbacks (feedback_id, member_id, session_id, coach_id, rating, comment, created_at) VALUES
    (1, 9,  1, 5, 5, N'HLV Minh hướng dẫn rất nhiệt tình, sửa dáng giao bóng chuẩn từng chút một!', DATEADD(DAY, -3, @Now)),
    (2, 12, 1, 5, 5, N'Buổi tập vui vẻ, không khí lớp học năng động. Sân bãi sạch đẹp.',          DATEADD(DAY, -3, @Now)),
    (3, 10, 3, 6, 5, N'HLV Nam chỉnh kỹ thuật thở khi bơi sải rất dễ hiểu, tiến bộ ngay buổi đầu.', DATEADD(HOUR, -12, @Now));
SET IDENTITY_INSERT dbo.feedbacks OFF;

SET IDENTITY_INSERT dbo.member_check_ins ON;
INSERT INTO dbo.member_check_ins (check_in_id, member_id, checked_in_at, result, recorded_by) VALUES
    (1, 9,  DATEADD(DAY, -2, @Now),    N'VALID',    3),
    (2, 10, DATEADD(DAY, -1, @Now),    N'VALID',    3),
    (3, 14, DATEADD(HOUR, -3, @Now),   N'VALID',    4),
    (4, 16, DATEADD(HOUR, -2, @Now),   N'REJECTED', 3);
SET IDENTITY_INSERT dbo.member_check_ins OFF;

-- ----------------------------------------------------------------------------
-- 2.11 Equipments & Equipment Loans (loan_id 501 belongs to real Member 9 Khoa!)
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.equipments ON;
INSERT INTO dbo.equipments (item_id, item_name, category, rental_price_per_hour, total_quantity, available_quantity, status) VALUES
    (1, N'Vợt Tennis Wilson Pro Staff',                  N'Vợt',  30000.00, 20, 19, N'ACTIVE'),
    (2, N'Vợt Pickleball Franklin Ben Johns',            N'Vợt',  20000.00, 30, 30, N'ACTIVE'),
    (3, N'Giày Thi Đấu Asics Court FF (Size 40-43)',     N'Giày', 40000.00, 15, 15, N'ACTIVE'),
    (4, N'Khăn Thể Thao Cao Cấp F Sport',                N'Khăn',     0.00, 50, 50, N'ACTIVE'),
    (5, N'Rổ Bóng Tennis 50 Quả (Tập phát bóng)',        N'Bóng', 50000.00, 10, 10, N'ACTIVE'),
    (6, N'Vợt Cầu Lông Yonex Astrox 88D',                N'Vợt',  25000.00, 18, 18, N'ACTIVE');
SET IDENTITY_INSERT dbo.equipments OFF;

SET IDENTITY_INSERT dbo.equipment_loans ON;
INSERT INTO dbo.equipment_loans (loan_id, member_id, member_name, phone, item_id, item_name, quantity, rental_price_per_hour, loaned_at, returned_at, rental_fee, status, payment_method, recorded_by) VALUES
    (501, 9,  N'Nguyễn Anh Khoa', N'0934567890', 1, N'Vợt Tennis Wilson Pro Staff',       1, 30000.00, DATEADD(MINUTE, -90, @Now), NULL,                     NULL,     N'BORROWED', NULL,    3),
    (502, 10, N'Hoàng Thị Ngọc',  N'0938765432', 2, N'Vợt Pickleball Franklin Ben Johns', 2, 20000.00, DATEADD(DAY, -1, @Now),     DATEADD(HOUR, -22, @Now), 40000.00, N'RETURNED', N'CASH', 4);
SET IDENTITY_INSERT dbo.equipment_loans OFF;

-- ----------------------------------------------------------------------------
-- 2.12 Coach Leave Requests, Refund Requests & Support Tickets
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.coach_leave_requests ON;
INSERT INTO dbo.coach_leave_requests (request_id, coach_id, coach_name, leave_type, start_date, end_date, reason, status, approved_by, affected_bookings_count, reassigned_coach_id, created_at) VALUES
    (101, 6, N'Nguyễn Hoàng Nam', N'SICK_LEAVE',     DATEADD(DAY, 5, @Today),   DATEADD(DAY, 6, @Today),  N'Khám sức khỏe định kỳ và theo dõi sốt siêu vi', N'PENDING',  NULL, 0, NULL, DATEADD(HOUR, -6, @Now)),
    (102, 8, N'Đặng Thu Thảo',    N'PERSONAL_LEAVE', DATEADD(DAY, -10, @Today), DATEADD(DAY, -9, @Today), N'Tham dự hội thảo chuyên môn Cầu lông toàn quốc', N'APPROVED', 1,    0, NULL, DATEADD(DAY, -12, @Now));
SET IDENTITY_INSERT dbo.coach_leave_requests OFF;

SET IDENTITY_INSERT dbo.refund_requests ON;
INSERT INTO dbo.refund_requests (refund_id, member_id, member_name, phone, transaction_id, reference_code, booking_id, booking_type, booking_description, refund_amount, reason, bank_name, bank_account, account_holder, status, approved_by, decision_note, created_at) VALUES
    (801, 11, N'Bùi Huy Hoàng',  '0931112233', 15, N'CRT-2026-0015', 5, 'COURT', N'Tennis Court 02 - Ngày kia 19:00-20:00', 350000.00, N'Đổi lịch công tác đột xuất, hủy sân trước giờ chơi hơn 48 tiếng theo đúng quy định', N'Vietcombank', N'0071000889911', N'BUI HUY HOANG', N'PENDING_APPROVAL', NULL, NULL, DATEADD(HOUR, -2, @Now)),
    (802, 10, N'Hoàng Thị Ngọc', '0938765432', 16, N'CRT-2026-0016', 3, 'COURT', N'Pickleball Court 01 - Đã hoàn tiền',      180000.00, N'Hủy đặt sân hợp lệ trước giờ bắt đầu > 2 tiếng',                                      N'Techcombank', N'1903556677889', N'HOANG THI NGOC', N'APPROVED', 1, N'Đã phê duyệt hoàn tiền 100% về tài khoản hội viên', DATEADD(DAY, -2, @Now));
SET IDENTITY_INSERT dbo.refund_requests OFF;

SET IDENTITY_INSERT dbo.support_tickets ON;
INSERT INTO dbo.support_tickets (ticket_id, member_id, member_name, category, title, description, severity, status, admin_response, created_at) VALUES
    (1, 9,  N'Nguyễn Anh Khoa', N'FACILITY_ISSUE', N'Đề xuất bổ sung thêm tủ locker tại khu Pickleball', N'Vào khung giờ tối 18:00-20:00 khu Pickleball rất đông, mong trung tâm bổ sung thêm 1 dãy tủ khóa từ.', N'NORMAL', N'SUBMITTED', NULL, DATEADD(DAY, -1, @Now)),
    (2, 10, N'Hoàng Thị Ngọc',  N'PAYMENT_ISSUE',  N'Xác nhận hóa đơn VAT gói VIP Diamond',            N'Nhờ bộ phận kế toán gửi giúp bản PDF biên lai thu tiền gói VIP Diamond qua email.',                      N'NORMAL', N'RESOLVED',  N'Lễ tân và Quản lý đã gửi biên lai điện tử qua email đăng ký của hội viên.', DATEADD(DAY, -4, @Now));
SET IDENTITY_INSERT dbo.support_tickets OFF;

-- ----------------------------------------------------------------------------
-- 2.13 Notifications, Audit Logs & System Settings
-- ----------------------------------------------------------------------------
SET IDENTITY_INSERT dbo.notifications ON;
INSERT INTO dbo.notifications (notification_id, user_id, title, message, type, is_read, created_at) VALUES
    (1, 9,  N'Chào mừng Hội viên VIP SportHub',       N'Thẻ Hội Viên Vàng Off-Peak của bạn đang hoạt động với 18 buổi lớp và 8 giờ sân còn lại.',          'MEMBERSHIP',   1, DATEADD(DAY, -10, @Now)),
    (2, 9,  N'HLV Trần Văn Minh đã giao giáo án mới', N'Giáo án "Sức Mạnh & Phản Xạ Pickleball (Tuần 3)" đã sẵn sàng. Hãy tích hoàn thành bài tập sau buổi tập!', 'WORKOUT_PLAN', 0, DATEADD(DAY, -2,  @Now)),
    (3, 9,  N'Nhắc lịch lớp học hôm nay 19:00',       N'Bạn có lịch Lớp Pickleball Nâng Cao K05 lúc 19:00 tại Cụm Sân Pickleball - Sân P2 (Indoor).',     'BOOKING',      0, DATEADD(HOUR, -3, @Now)),
    (4, 10, N'Đã hoàn tất yêu cầu hoàn tiền',        N'Yêu cầu hoàn 180.000đ cho giao dịch CRT-2026-0016 đã được Quản lý phê duyệt.',                   'REFUND',       0, DATEADD(DAY, -2,  @Now)),
    (5, 5,  N'Nhận đánh giá 5 sao mới',               N'Học viên Nguyễn Anh Khoa đã chấm 5/5 sao cho lớp Tennis Chuyên Kỹ Thuật Serve.',                  'FEEDBACK',     0, DATEADD(DAY, -3,  @Now)),
    (6, 5,  N'Lịch dạy hôm nay 19:00',                N'Bạn có ca dạy Lớp Pickleball Nâng Cao K05 (2 học viên đã đăng ký) tại Sân P2.',                 'SCHEDULE',     0, DATEADD(HOUR, -4, @Now)),
    (7, 1,  N'Có 1 gói tập mới chờ phê duyệt',        N'Hội viên Đỗ Phương Anh vừa thanh toán Gói Cầu Lông HS-SV (800.000đ) và đang chờ kích hoạt.',      'APPROVAL',     0, DATEADD(MINUTE, -45, @Now)),
    (8, 1,  N'Có 1 đơn xin nghỉ phép HLV mới',        N'HLV Nguyễn Hoàng Nam vừa gửi đơn xin nghỉ phép (SICK_LEAVE) cần Quản lý xem xét.',               'LEAVE',        0, DATEADD(HOUR, -6, @Now));
SET IDENTITY_INSERT dbo.notifications OFF;

SET IDENTITY_INSERT dbo.audit_logs ON;
INSERT INTO dbo.audit_logs (log_id, actor_id, actor_name, actor_role, action, log_type, detail, user_email, user_id, ip_address, action_detail, status, created_at) VALUES
    (1, 1, N'Nguyễn Văn Quản Lý', 'MANAGER',      'SYSTEM_INIT',            'SYSTEM',     N'Khởi tạo dữ liệu chuẩn hóa hệ thống SportHub',                  'manager@sporthub.com',      1, '127.0.0.1', N'Database seeded with 32 normalized tables', 'SUCCESS', DATEADD(DAY, -10, @Now)),
    (2, 3, N'Lê Thị Lễ Tân',      'RECEPTIONIST', 'POS_MEMBERSHIP_SALE',    'PAYMENT',    N'Bán gói VIP Diamond tại quầy cho Hoàng Thị Ngọc (2.600.000đ)',  'reception.le@sporthub.com', 3, '127.0.0.1', N'POS sale um_id=3, method=CASH',             'SUCCESS', DATEADD(DAY, -6,  @Now)),
    (3, 1, N'Nguyễn Văn Quản Lý', 'MANAGER',      'REFUND_APPROVED',        'REFUND',     N'Duyệt hoàn tiền 180.000đ cho Hoàng Thị Ngọc (CRT-2026-0016)',   'manager@sporthub.com',      1, '127.0.0.1', N'Approved refund_id=802',                    'SUCCESS', DATEADD(DAY, -2,  @Now)),
    (4, 5, N'Trần Văn Minh',      'COACH',        'WORKOUT_PLAN_CREATED',   'COACHING',   N'Giao giáo án Sức Mạnh & Phản Xạ Pickleball cho Nguyễn Anh Khoa','coach.minh@sporthub.com',   5, '127.0.0.1', N'Created plan_id=1 for member_id=9',         'SUCCESS', DATEADD(DAY, -2,  @Now)),
    (5, 3, N'Lê Thị Lễ Tân',      'RECEPTIONIST', 'EQUIPMENT_LOAN_CREATED', 'EQUIPMENT',  N'Cho hội viên Nguyễn Anh Khoa mượn Vợt Tennis Wilson Pro Staff', 'reception.le@sporthub.com', 3, '127.0.0.1', N'Created loan_id=501, item_id=1',            'SUCCESS', DATEADD(MINUTE, -90, @Now)),
    (6, 1, N'Nguyễn Văn Quản Lý', 'MANAGER',      'MAINTENANCE_SCHEDULED',  'FACILITY',   N'Lên lịch bảo trì Hồ Bơi - Làn S2 (Làn bơi 02)',                 'manager@sporthub.com',      1, '127.0.0.1', N'Created maintenance_id=1 on court_id=17',   'SUCCESS', DATEADD(DAY, -1,  @Now));
SET IDENTITY_INSERT dbo.audit_logs OFF;

INSERT INTO dbo.system_settings (setting_key, setting_value, updated_at) VALUES
    ('ai_enabled',        N'true', @Now),
    ('ai_model',          N'gemini-flash-lite-latest', @Now),
    ('ai_temperature',    N'0.7', @Now),
    ('ai_system_prompt',  N'Bạn là Trợ lý AI Thể thao chuyên nghiệp của F-Sport Center (SportHub). Hãy tư vấn lịch tập, kỹ thuật thể thao, dinh dưỡng và phục hồi chấn thương dựa trên hồ sơ thể trạng của hội viên.', @Now),
    ('SYSTEM_POLICIES',   N'{"bookingHoldTimeoutMinutes":10,"cancelRefundDeadlineHours":2,"coachCommissionPercent":40,"maxAdvanceBookingDays":14,"guestCourtDepositPercent":100,"checkInGracePeriodMinutes":15,"autoArchiveLogsDays":90,"allowSplitPayment":false}', @Now),
    ('ROLE_PERMISSIONS',  N'[{"screenId":"MEM_MGMT","screenName":"Quản lý Hội viên & Hồ sơ sức khỏe","module":"Hội viên","roles":{"admin":{"view":true,"create":true,"edit":true,"delete":true},"receptionist":{"view":true,"create":true,"edit":true,"delete":false},"coach":{"view":true,"create":false,"edit":false,"delete":false},"member":{"view":false,"create":false,"edit":false,"delete":false}}},{"screenId":"COURT_CLASS_BOOKING","screenName":"Đặt Sân bãi & Đăng ký Lớp học","module":"Booking","roles":{"admin":{"view":true,"create":true,"edit":true,"delete":true},"receptionist":{"view":true,"create":true,"edit":true,"delete":true},"coach":{"view":true,"create":false,"edit":false,"delete":false},"member":{"view":true,"create":true,"edit":true,"delete":false}}},{"screenId":"ATTENDANCE_CHECKIN","screenName":"Điểm danh 3 trạng thái & Check-in RFID","module":"Vận hành","roles":{"admin":{"view":true,"create":true,"edit":true,"delete":true},"receptionist":{"view":true,"create":true,"edit":true,"delete":false},"coach":{"view":true,"create":true,"edit":true,"delete":false},"member":{"view":true,"create":false,"edit":false,"delete":false}}},{"screenId":"POS_BILLING","screenName":"Thu ngân POS, Hóa đơn & Bán lẻ","module":"Tài chính","roles":{"admin":{"view":true,"create":true,"edit":true,"delete":true},"receptionist":{"view":true,"create":true,"edit":false,"delete":false},"coach":{"view":false,"create":false,"edit":false,"delete":false},"member":{"view":false,"create":false,"edit":false,"delete":false}}}]', @Now);
GO

USE [master];
GO
