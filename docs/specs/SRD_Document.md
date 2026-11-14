**Sports Center Management System**

**Software Requirement Document**

– HCM, Nov 2026 –

**RECORD OF CHANGES**

| Date | A\*M, D | In charge | Change Description |
| ----- | ----- | :---- | :---- |
| 10/Nov | A | HoangPM | Initialize document, add Introduction & Context Diagram (I.1) and Existing Systems (I.2) |
| 11/Nov | A | TrieuVT | Add Screen Flow diagram (I.4.a) and Screen Details description table (I.4.b) |
| 11/Nov | A | TienPH | Add Business Process swimlane diagrams (I.3), User Authorization matrix (I.4.c), and State Transition Diagrams (I.6) |
| 12/Nov | A | KhoaNA | Add Entity Relationship Diagram (ERD) and Entities Description table (I.5) |
| 13/Nov | A | TuanTT | Add functional requirements for Member Module (II.1) and Receptionist Module (II.2) |
| 14/Nov | A | TrieuVT | Add functional requirements for Coach Module (II.3) |
| 15/Nov | A | TienPH | Add functional requirements for Manager Module (II.4) |
| 16/Nov | A | KhoaNA | Add functional requirements for Admin Module (II.5) |
| 17/Nov | A | KhoaNA | Add Database Schema (III.1) and Table Detail specifications (III.2) |
| 19/Nov | M | HoangPM | Review, standardize formatting, update Table of Contents, and finalize the SRD document |

\*A \- Added M \- Modified D \- Deleted

**Table of Contents**

[I. Overview	6](#i.-overview)

[1\. Introduction	6](#1.-introduction)

[2\. Existing Systems	7](#2.-existing-systems)

[2.1 Mindbody	7](#2.1-mindbody)

[2.2 Playtomic	7](#2.2-playtomic)

[2.3 Alobo	7](#2.3-alobo)

[3\. Business Process	7](#3.-business-process)

[3.1 Process 1: Membership Package Purchase, Payment & Manager Activation Approval	8](#3.1-process-1:-membership-package-purchase,-payment-&-manager-activation-approval)

[3.2 Process 2: Court/Class/PT Booking, Quota Priority & Front-Desk Check-In	9](#3.2-process-2:-court/class/pt-booking,-quota-priority-&-front-desk-check-in)

[3.3 Process 3: Class Attendance & AI-Assisted PT Workout Plan	10](#3.3-process-3:-class-attendance-&-ai-assisted-pt-workout-plan)

[3.4 Process 4: Booking Cancellation & Refund Approval via VNPay Refund API	11](#3.4-process-4:-booking-cancellation-&-refund-approval-via-vnpay-refund-api)

[4\. System Functions	12](#4.-system-functions)

[5\. Entity Relationship Diagram	22](#5.-entity-relationship-diagram)

[6\. State transition diagram	23](#6.-state-transition-diagram)

[6.1 Court Booking (court\_bookings.status)	23](#6.1-court-booking-\(court_bookings.status\))

[6.2 Class / PT Booking (bookings.status \+ attendance\_status)	25](#6.2-class-/-pt-booking-\(bookings.status-+-attendance_status\))

[6.3 Payment Transaction (payment\_transactions.payment\_status)	27](#6.3-payment-transaction-\(payment_transactions.payment_status\))

[6.4 Sports Court (sports\_courts.active)	28](#6.4-sports-court-\(sports_courts.active\))

[6.5 User Membership (user\_memberships.status)	29](#6.5-user-membership-\(user_memberships.status\))

[II. Functional Requirements	30](#ii.-functional-requirements)

[1\. Member Management	30](#1.-member-management)

[1.1. Authentication and Account Management	30](#1.1.-authentication-and-account-management)

[1.2. User Registration and Email Verification	30](#1.2.-user-registration-and-email-verification)

[1.3. User Login and Logout	33](#1.3.-user-login-and-logout)

[1.4. Password Management	36](#1.4.-password-management)

[1.5. Email Availability Checking	39](#1.5.-email-availability-checking)

[1.6. Business Rules Summary	41](#1.6.-business-rules-summary)

[1.7. Court Booking and Class Registration	42](#1.7.-court-booking-and-class-registration)

[1.8. View Personal Schedule	51](#1.8.-view-personal-schedule)

[1.9. Cancel Booking	52](#1.9.-cancel-booking)

[1.10. Member Profile and Membership Services	56](#1.10.-member-profile-and-membership-services)

[1.11. Body Progress and Workout Management	64](#1.11.-body-progress-and-workout-management)

[1.12. AI Fitness Assistant	68](#1.12.-ai-fitness-assistant)

[1.13. Refund Request Management	70](#1.13.-refund-request-management)

[2\. Receptionist Management	71](#2.-receptionist-management)

[2.1. Member Lookup	72](#2.1.-member-lookup)

[2.2. Member Check-in Management	73](#2.2.-member-check-in-management)

[2.3. Point of Sale and Membership Sales	74](#2.3.-point-of-sale-and-membership-sales)

[2.4. Receipt Generation and Printing	77](#2.4.-receipt-generation-and-printing)

[2.5. Equipment Loan and Return Management	78](#2.5.-equipment-loan-and-return-management)

[2.6. Daily Shift Monitoring and Reporting	81](#2.6.-daily-shift-monitoring-and-reporting)

[3\. Coach Management	83](#3.-coach-management)

[3.1. Coach Dashboard & Notifications	83](#3.1.-coach-dashboard-&-notifications)

[3.2. Schedule, Weekly Availability, Leave Requests & Commission Income	84](#3.2.-schedule,-weekly-availability,-leave-requests-&-commission-income)

[3.3. Class Attendance Marking & Session Notes	85](#3.3.-class-attendance-marking-&-session-notes)

[3.4. Assigned Students, Body Logs & AI-Assisted PT / Class Workout Plans	85](#3.4.-assigned-students,-body-logs-&-ai-assisted-pt-/-class-workout-plans)

[3.5. Coach Reviews & Profile Management	87](#3.5.-coach-reviews-&-profile-management)

[4\. Manager Management	87](#4.-manager-management)

[4.1. Executive Dashboard](#4.1.-executive-dashboard-4.1.1.-view-executive-dashboard-and-export-report)  
[4.1.1. View Executive Dashboard and Export Report	87](#4.1.-executive-dashboard-4.1.1.-view-executive-dashboard-and-export-report)

[4.2. Personnel Approval Feature	88](#4.2.-personnel-approval-feature)

[4.3. Court Maintenance Management	90](#4.3.-court-maintenance-management)

[4.4. Membership Package Management	92](#4.4.-membership-package-management)

[4.5. Voucher Management	92](#4.5.-voucher-management)

[4.6. Approvals Center	93](#4.6.-approvals-center)

[4.7. Payment Reconciliation	96](#4.7.-payment-reconciliation)

[4.8. Broadcast Notices	96](#4.8.-broadcast-notices)

[4.9. User, Member and Staff Management	97](#4.9.-user,-member-and-staff-management)

[4.10. System Governance	98](#4.10.-system-governance)

[4.11 Business Rules Summary	98](#4.11-business-rules-summary)

[**III. Database Design	100**](#iii.-database-design)

[1\. Database Schema	100](#1.-database-schema)

[2\. Table Detail	101](#2.-table-detail)

# **I. Overview** {#i.-overview}

### **1\. Introduction** {#1.-introduction}

SportHub (F Sport Center Management System) is a full-stack web platform built for the SWP391 Capstone project to digitalize and unify multi-sport center operations. Serving 10 sports disciplines across 16 standardized courts and facilities (Badminton, Tennis, Pickleball, Football, Volleyball, Table Tennis, Swimming, Athletics, Yoga & Pilates, and Gym & Fitness), SportHub replaces fragmented manual scheduling, paper ledgers, and disconnected cash registers with an integrated real-time platform.

System Environment & Tech Stack: The frontend is implemented as a responsive Single Page Application using React 19, Vite 8, React Router v7, and Tailwind CSS v3.4 (including 80mm K80 thermal receipt layouts). The backend is powered by Java 21, Spring Boot 4.1.2, Spring Data JPA, and Spring Security with SHA-256 Bearer token authentication, persisted in Microsoft SQL Server (SportsCenterDB). External integrations include VNPay Sandbox (digital-signed checkout, IPN webhooks, and excess refund reconciliation), Gmail SMTP (6-digit email OTP verification and password reset), Google Gemini AI (personalized workout draft generation and 24/7 AI sports assistant), and front-desk QR / 13.56MHz RFID hardware simulation.

Users, Constraints & Dependencies: The system supports five user scopes: Guest (public catalog and self-registration), Member (package purchase, court/class/PT booking, quota utilization, workout tracking, AI chat, reviews, refunds, and tickets), Receptionist (QR/RFID check-in, POS K80 sales, equipment loans, walk-in account creation, shift reports), Coach (weekly schedule, availability, leave requests, 3-state attendance, AI/PT workout plans, body logs), and Manager / Admin (executive revenue KPIs, package/voucher/facility/maintenance administration, approval queues, RBAC/AI settings, payment reconciliation, broadcast, and audit logs). Key operational constraints include strict non-splitting quota precedence (BR-08), 10-minute unpaid slot hold timeouts (BR-07), mandatory manager activation approval for memberships (BR-04), coach student privacy isolation (BR-13), and immutable audit logging (BR-18).

*Figure 1: SportHub System Context Diagram* 

### **2\. Existing Systems** {#2.-existing-systems}

Several established sports and fitness center management platforms were analyzed as references during system design:

#### **2.1 Mindbody** {#2.1-mindbody}

Website: https\://www\.mindbodyonline.com/ — A leading cloud-based management platform for fitness studios, gyms, and wellness centers serving Admins, Staff, Instructors, and Members.

●        Key Features: Class scheduling, membership subscriptions, integrated payment processing, staff payroll/commission tracking, and client mobile booking app.

●        Pros: Mature ecosystem, rich recurring billing, automated marketing notifications, and broad mobile adoption.

Cons & Gap for SportHub: High subscription cost for local multi-sport complexes, limited support for Vietnamese VNPay QR/IPN flows, no local K80 POS thermal billing workflow, and lacks court-hour quota precedence alongside equipment loan tracking. 

#### **2.2 Playtomic** {#2.2-playtomic}

Website: https\://playtomic.io/ — A widely adopted racket-sports (Padel, Tennis, Pickleball) court reservation network connecting Clubs and Players.

●        Key Features: Real-time court slot availability, open match joining, online wallet/card payment, and club occupancy analytics.

●        Pros: Fast visual slot selection, anti-double-booking court calendar, and intuitive player booking UX.

●        Cons & Gap for SportHub: Focused primarily on court booking rather than holistic multi-sport center operations (missing 3-state coach attendance, PAR-Q/InBody tracking, AI workout plan drafting, and front-desk RFID check-in).

#### **2.3 Alobo** {#2.3-alobo}

Website: https\://alobo.vn/ — A popular court scheduling and front-desk management solution in Vietnam for Badminton, Pickleball, and Football venues.

●        Key Features: Hourly court booking calendar, walk-in POS payment recording, peak/off-peak pricing, and basic revenue reporting.

●        Pros: Well tailored to local Vietnamese sports venues, peak/off-peak tariffs, and cashier counter workflows.

●        Cons & Gap for SportHub: Lacks unified PT/group class coaching modules, strict 3-tier VIP/PT/Class quota deduction rules, excess gateway payment reconciliation, and AI-assisted training features.

### **3\. Business Process** {#3.-business-process}

The core end-to-end operational workflows of SportHub are modeled below using cross-role swimlane diagrams and step descriptions:

#### **3.1 Process 1: Membership Package Purchase, Payment & Manager Activation Approval** {#3.1-process-1:-membership-package-purchase,-payment-&-manager-activation-approval}

*Figure 2: Swimlane Diagram — Membership Purchase & Activation Approval* 

| \# | Process Step | Description |
| ----- | ----- | ----- |
| 1 | Select package | Member chooses an ACTIVE package on /member/packages and selects VNPay. |
| 2 | Create order | System creates user\_membership with status PENDING\_PAYMENT and a payment\_transaction with status PENDING (reference PKG-xxxx). |
| 3 | Generate payment URL | System creates a payment attempt and returns a VNPay URL. The order can only be paid while PENDING and within 10 minutes of creation. |
| 4 | Pay on VNPay | Member completes checkout on VNPay Sandbox. VNPay calls the IPN and Return endpoints. |
| 5 | Verify callback | System verifies the HMAC-SHA512 signature, the payment ID and the exact amount. On success, payment becomes PAID, a gateway receipt is stored as APPLIED, and the membership moves to PENDING\_APPROVAL. On failure, payment becomes FAILED. If unpaid after 10 minutes, the scheduler sets payment FAILED and membership CANCELLED. |
| 6 | Manager decision | Manager reviews the order in the Approvals Center. Approve: membership becomes ACTIVE; the start date is today, or the day after an active package of the same renewal group ends; end date \= start \+ duration − 1; session and court quotas are initialized. Reject: a reason is required, membership becomes REJECTED, and a 100% refund request is created automatically (handled in Process 4). |

#### **3.2 Process 2: Court/Class/PT Booking, Quota Priority & Front-Desk Check-I****n** {#3.2-process-2:-court/class/pt-booking,-quota-priority-&-front-desk-check-in}

*Figure 3: Swimlane Diagram — Booking, Quota Priority & Check-In*

| \# | Process Step | Description |
| ----- | ----- | ----- |
| 1 | Select resource & slot | Member opens /member/book, selects booking type (COURT, CLASS, PT), sport, resource and time slot. |
| 2 | Validate & quote | Account must be ACTIVE, and Coach accounts cannot book. Courts are booked in 60-minute blocks within one day, within the next 14 days and inside opening hours, with no maintenance overlap, no double booking, and at most 3 concurrent courts per member. Classes require open seats, and no member time conflict is allowed. |
| 3 | Quota or payment | If the member chooses quota and the active package has enough quota, the quota is held (HELD) and the booking is CONFIRMED at 0 VND. Otherwise a payment is created (optional voucher), and the booking stays PENDING (court) or BOOKED (class/PT) for 10 minutes. |
| 4 | Confirm payment | A VNPay success or a cash confirmation by the Receptionist within 10 minutes confirms the booking. If the slot was lost, the booking is cancelled and a full refund request is created automatically. If unpaid after 10 minutes, the booking is CANCELLED, payment FAILED and the voucher released. |
| 5 | Front-desk check-in | Receptionist scans QR/RFID. Check-in is only valid from start time until end time, with booking CONFIRMED, payment PAID (or quota HELD), and the court open. |
| 6 | Finalize | Court bookings become CHECKED\_IN and quota moves HELD → USED. For classes, the check-in only records admission, and attendance is marked by the Coach. If the slot ends without check-in, the scheduler marks the court booking NO\_SHOW or the class booking UNEXCUSED\_ABSENCE, and the quota is consumed. |

#### **3.3 Process 3: Class Attendance & AI-Assisted PT Workout Plan** {#3.3-process-3:-class-attendance-&-ai-assisted-pt-workout-plan}

*Figure 4: Swimlane Diagram — Attendance & AI Workout Plan Workflow*

| \# | Process Step | Description |
| ----- | ----- | ----- |
| 1 | Select session | Coach opens /coach/attendance. The system only returns rosters of sessions assigned to that Coach. |
| 2 | Mark attendance | Coach marks PRESENT, EXCUSED\_ABSENCE or UNEXCUSED\_ABSENCE with an optional note. Allowed only after the session has started, for CONFIRMED and paid bookings. A Receptionist may correct attendance but cannot create the first marking. |
| 3 | Settle quota | For quota bookings: PRESENT and UNEXCUSED\_ABSENCE move quota HELD → USED. EXCUSED\_ABSENCE returns quota (RELEASED) if within the package term, otherwise FORFEITED. Every change is audit-logged. |
| 4 | Generate AI draft | Coach sends the student’s booking and a goal (max 1,000 characters). The system builds context from the health profile, body logs and the booked class, then calls Gemini to draft a plan (warm-up, main exercises, recovery, notes). |
| 5 | Save plan | Coach reviews and saves a PT plan (single student) or class plan (all students of a session). The member is notified. |
| 6 | Follow plan | Member views the plan in /member/workout-plans and ticks completed exercises. |

####   **3.4 Process 4: Booking Cancellation & Refund Approval via VNPay Refund API**  ****   {#3.4-process-4:-booking-cancellation-&-refund-approval-via-vnpay-refund-api}

| \# | Process Step | Description |
| :---- | ----- | ----- |
| 1 | Cancel / request refund | Member cancels a booking on /member/schedule, or submits a refund request for a PAID transaction on /member/transactions. Only the full amount can be requested, and only one open request per transaction is allowed. |
| 2 | Check cancellation window | A cancellation is timely if made at least 2 hours before start, or if the class was cancelled or the court is under maintenance. Timely: quota is released and a 100% refund request (PENDING\_APPROVAL) is created for paid bookings. Late: quota is consumed and no refund is created. |
| 3 | Manager review | Manager opens the Refunds tab. Rejection requires a note, and the request becomes REJECTED. |
| 4 | Re-check eligibility | On approval, the system re-checks that the court booking is not CHECKED\_IN or NO\_SHOW, the class is not yet marked, and the package has no used or held quota. |
| 5 | Execute VNPay refund | For VNPay payments, the system calls the VNPay Refund API with TxnRef, TransactionNo, TransactionDate and the exact amount, then verifies the response signature. |
| 6 | Finalize | Response code 00 (or a cash payment): payment REFUNDED, gateway receipt REFUNDED, request APPROVED, and the linked booking or membership CANCELLED. Any other response keeps the request PENDING\_APPROVAL with a reconciliation note, so the Manager can retry after checking VNPay. |

### **4\. System Functions** {#4.-system-functions}

##### ***a. Screen Flow***

The diagram below illustrates the overall screen flow and navigation relationships of the **SportHub (F Sport Center)** system, covering public informational pages, authentication flows, and role-based post-login portals (**Member**, **Receptionist**, **Coach**, and **Manager / Admin**). 

*Figure 5: SportHub System Screen Flow Diagram* 

##### ***b. Screen Details***

The table below provides concise descriptions for every screen and sub-screen shown in the Screen Flow diagram above. 

| \# | Feature | Screen | Description |
| ----- | :---- | :---- | :---- |
| 1 | Public Browsing | Home Page | Main landing page (/) presenting SportHub center highlights, KPI overview, featured sports and facilities, quick booking entry, and navigation to login or role portals. |
| 2 | Public Browsing | About Page | Displays center background, training standards, equipment highlights, and direct links to sports, facilities, and pricing (/about). |
| 3 | Public Browsing | Sports Page | Lists all 10 public sports disciplines offered at F Sport Center fetched from public content APIs (/sports). |
| 4 | Public Browsing | Sport Details | Displays detailed descriptions, court specifications, and booking entry links for a selected sport (/sports/:slug). |
| 5 | Public Browsing | Facilities Page | Lists the 16 center facilities, court zones, and amenities available to members and guests (/facilities). |
| 6 | Public Browsing | Facility Details | Shows detailed specifications, court availability highlights, and direct booking entry for a selected facility (/facilities/:slug). |
| 7 | Public Browsing | Pricing Page | Displays public VIP, PT, and Class membership packages with pricing and benefits, prompting guests to sign in or redirecting members to purchase (/pricing). |
| 8 | Authentication & Account | User Login | Authenticates users via email or phone number and password, handles pending email verification or forced first-login password change, and redirects to PostLogin (/login). |
| 9 | Authentication & Account | User Register | Allows guests to register a new Member account with full name, phone, email, and password, triggering a 6-digit email OTP flow (/register). |
| 10 | Authentication & Account | OTP Verification | Verifies the 6-digit account activation OTP (10-minute validity) and supports resending codes before login (/verify-otp). |
| 11 | Authentication & Account | Forgot Password | Initiates password recovery by sending a 6-digit reset verification code to the user’s registered email address (/forgot-password). |
| 12 | Authentication & Account | Verify Code | Validates the 6-digit password recovery code with countdown and attempt limits before permitting password reset (/verify-code). |
| 13 | Authentication & Account | Reset Password | Allows users with a verified recovery code to set a new password and return to login (/reset-password). |
| 14 | Authentication & Account | Change Password | Allows authenticated users (or staff flagged for mandatory initial password rotation) to update their password (/change-password, or Security tab in Profile). |
| 15 | Member Portal | Member Dashboard | Personalized member home (/member) summarizing active membership status, remaining quota, upcoming bookings, and quick shortcuts. |
| 16 | Member Portal | Notifications | Displays system, booking, membership, and broadcast notifications with read/unread tracking and deep links (/member/notifications). |
| 17 | Membership & Packages | Packages & Benefits | Displays active/pending memberships, remaining quota, and available VIP, PT, and Class packages for purchase or renewal (/member/packages). |
| 18 | Membership & Packages | Package Checkout / VNPay | Checkout modal to select payment method (VNPay / Sandbox / QR), apply discounts, complete payment, and redirect through VNPay Return (/payment/return). |
| 19 | Class Registration | Class Registration | Enables members to filter and browse open group classes by sport, date, and time slot (/member/classes). |
| 20 | Class Registration | Class Checkout / Coach Info | Modals to inspect assigned coach details and enroll in a class using VIP quota, voucher, or VNPay online payment. |
| 21 | Court, Class & PT Booking | Booking Home | Entry hub (/member/book) where members choose to book a Sports Court, Group Class, or 1-on-1 Personal Trainer (PT). |
| 22 | Court, Class & PT Booking | Slot & Quota | Multi-step resource and time-slot picker (/member/book/:type/sports \-\> courts\|classes\|coaches/:sportId) checking real-time conflicts and quota balance. |
| 23 | Court, Class & PT Booking | Checkout / VNPay & Confirmation | Applies quota priority or promotional voucher, holds unpaid slots for 10 minutes, redirects via VNPay Return (/payment/return), and displays booking confirmation. |
| 24 | Member Schedule | Member Schedule | Weekly and list timetable (/member/schedule) displaying confirmed court, class, and PT bookings with attendance status. |
| 25 | Member Schedule | Reschedule / Cancel / Coach Info | Modals on Member Schedule allowing eligible court rescheduling, booking cancellation (per refund policy), and coach profile inspection. |
| 26 | Attendance & Training | Attendance History | Displays class attendance records, court booking history, and RFID/QR gate check-in logs across three tabs (/member/attendance). |
| 27 | Attendance & Training | Attendance Dispute | Modal allowing members to submit attendance discrepancy disputes for manager review and RFID/camera verification. |
| 28 | Attendance & Training | Workout Plans & Body | Displays coach-assigned PT/class workout plans with exercise completion toggles and body composition logs (/member/workout-plans). |
| 29 | Attendance & Training | AI Plan / Add Body Log | Allows generating personalized AI workout plans and logging new body metrics (weight, height, BMI, SMM, PBF). |
| 30 | Attendance & Training | AI Sports Assistant | Interactive Gemini-powered AI chat assistant (/member/ai-assistant) providing tailored training and nutrition advice using member health and schedule context. |
| 31 | Attendance & Training | Quick Body Log | Modal inside AI Sports Assistant enabling rapid recording of weight, body fat, muscle mass, and 1RM lift metrics. |
| 32 | Reviews & Feedback | Reviews & Feedback | Enables members to submit 1–5 star ratings and comments for completed classes and coaching sessions (/member/reviews). |
| 33 | Transactions & Support | Transactions & Receipts | Displays member payment history, 0-VND quota deductions, and refund status with type filters (/member/transactions). |
| 34 | Transactions & Support | Receipt Details | Modal displaying itemized electronic receipt details and payment reference codes for a selected transaction. |
| 35 | Transactions & Support | Refund Details | Modal allowing members to submit and track package or booking refund requests against eligible transactions. |
| 36 | Transactions & Support | Ticket Details | Modal allowing members to submit support or dispute tickets (category, severity, description) to center management. |
| 37 | Member Profile | Member Profile | Manages personal details, avatar upload, health/PAR-Q profile, InBody metrics, and digital QR/RFID membership card (/member/profile). |
| 38 | Receptionist Portal | Reception Dashboard | Front-desk operational hub (/receptionist) summarizing today’s check-ins, pending cash payments, active equipment loans, and shift shortcuts. |
| 39 | Front-Desk Check-In | Check-In & RFID Scan | Validates member entry via QR/RFID scan (plus simulated RFID modal), manual search, and displays today’s gate check-in log (/receptionist/checkin). |
| 40 | Member Desk Operations | Member Lookup & Card | Searches member profiles and displays digital membership codes and emergency contact information (/receptionist/members). |
| 41 | Member Desk Operations | Create User / Link RFID / SOS | Modals to register walk-in Member/Coach/Receptionist accounts (excluding Manager), capture/upload avatars, link physical RFID cards, and edit SOS contacts. |
| 42 | POS & Cashier | POS & Cashier | Processes walk-in membership package sales and lists pending cash payments awaiting front-desk collection (/receptionist/pos). |
| 43 | POS & Cashier | Receipt Print / VNPay | Confirms cash/card payments or initiates VNPay checkout (via /payment/return) and opens the K80 thermal receipt print modal. |
| 44 | Class Desk Operations | Class Schedule & Roster | Displays weekly center class schedules filtered by sport with enrolled seat counts (/receptionist/classes). |
| 45 | Class Desk Operations | Class Roster & Attendance | Modal showing a class session’s student roster and allowing front-desk 3-state attendance updates (with audit logging). |
| 46 | Equipment Management | Equipment Loans | Manages sports equipment inventory and active member equipment loans (/receptionist/equipment). |
| 47 | Equipment Management | Return & Fee Checkout | Modal to process equipment returns, calculate overtime rental fees, and collect payment via cash or card. |
| 48 | Shift Reporting | Shift Revenue Report | Aggregates daily revenue by payment method, completed transactions, and new registrations with CSV export (/receptionist/shift). |
| 49 | Receptionist Profile | Receptionist Profile | Manages staff personal info, avatar, digital staff QR badge, and in-page password security tab (/receptionist/profile). |
| 50 | Coach Portal | Coach Dashboard | Instructor overview (/coach) displaying today’s teaching sessions, assigned students, pending attendance items, and quick shortcuts. |
| 51 | Students & Training | Students & PT Plans | Lists assigned PT and class students with PAR-Q/fitness level filters (/coach/students). |
| 52 | Students & Training | Workout Plan / AI / Body Log / Notice | Modals to create PT/class workout plans, generate AI workout plans, record student body logs, and send notices to students or classes. |
| 53 | Schedule & Income | Teaching Schedule & Income | Displays weekly teaching timetable and commission income breakdown (/coach/schedule, /coach/income). |
| 54 | Schedule & Income | Leave Request & Availability | Tabs and modal allowing coaches to set weekly availability slots and submit leave or shift-reassignment requests. |
| 55 | Class Attendance | Class Attendance & Notes | Selects assigned sessions and records 3-state student attendance (Present, Excused, Unexcused) with coach notes (/coach/attendance). |
| 56 | Coach Feedback & Alerts | Coach Reviews | Displays average rating and detailed student reviews for completed classes and PT sessions (/coach/reviews). |
| 57 | Coach Feedback & Alerts | Coach Notifications | Lists teaching schedule alerts, leave decision updates, and system broadcasts (/coach/notifications). |
| 58 | Coach Profile | Coach Profile | Manages coach contact details, specialty, years of experience, certifications, avatar, digital coach QR card, and link to Change Password (/coach/profile). |
| 59 | Admin Executive | Admin Dashboard | Executive dashboard (/admin) displaying collected revenue, new members, daily class fill rates, payment breakdown, and CSV export. |
| 60 | Packages & Pricing | Packages & Vouchers | Manages membership packages (VIP, PT, Class), promotional vouchers, and PT pricing lists (/admin/packages). |
| 61 | Packages & Pricing | Package / Voucher / PT Modal | Drawer and modals to create, edit, and toggle active status of membership packages, discount vouchers, and PT pricing tiers. |
| 62 | Facility & Maintenance | Facilities & Classes | Manages sports facilities/court availability statuses and weekly scheduled group classes (/admin/facilities). |
| 63 | Facility & Maintenance | Class Session Modal | Modals to create, edit, or cancel scheduled group class sessions with sport, court, and coach assignment. |
| 64 | Facility & Maintenance | Court Maintenance | Creates, extends, and deletes court maintenance schedules that automatically block court bookings during maintenance windows (/admin/maintenance). |
| 65 | Staff & Member Admin | Staff, KPI & Users | Displays all user accounts across roles alongside Coach and Receptionist KPI/commission analytics (/admin/staff). |
| 66 | Staff & Member Admin | Create User / Staff KPI | Modal to create new user accounts for any role (including Manager/Admin) and view staff performance metrics. |
| 67 | Staff & Member Admin | Member Management | Queries and filters member accounts by status (/admin/members). |
| 68 | Staff & Member Admin | Create User / Lock-Unlock | Allows creating member accounts and locking or unlocking member access. |
| 69 | Approvals Center | Approvals Center | Central approval hub (/admin/staff-approvals) coordinating pending operational and financial decisions. |
| 70 | Approvals Center | Approval Queues | Four-tab approval interface covering Staff Registrations, Pending Memberships (with rejection reason), Coach Leave & Reassign (substitute coach assignment), and Refund Requests. |
| 71 | System & Governance | Settings, RBAC & AI | System configuration console (/admin/settings) for operational governance. |
| 72 | System & Governance | Policies / RBAC Matrix / AI Config | Tabs to configure booking hold/refund/commission policies, inspect/update role permissions matrix, and configure AI Assistant model and system prompt. |
| 73 | System & Governance | Broadcast Notices | Form to compose and broadcast announcements to all users or specific roles (/admin/broadcast). |
| 74 | System & Governance | Payment Reconciliation | Lists excess/overpaid VNPay receipts requiring reconciliation and executes manager-authorized refunds (/admin/payment-reconciliation). |
| 75 | System & Governance | System Audit Logs | Displays immutable, searchable audit logs recording authentication, approvals, maintenance, broadcasts, and configuration changes (/admin/audit-logs). |

##### ***c. User Authorization***

The matrix below defines role-based authorization down to screens and screen-level data activities across the SportHub system.

| Screen | Guest  | Member | Receptionist  | Coach | Admin |
| :---- | :---: | :---: | :---: | :---: | :---: |
| Public Pages (Home, About, Sports, Facilities, Pricing) | X | X | X | X | X |
| Query All Data (Public Sports, Facilities & Packages) | X | X | X | X | X |
| Validate Promotional Voucher | X | X | X | X | X |
| Authentication (Login, Register, OTP, Forgot/Verify/Reset/Change Password) | X | X | X | X | X |
| Add New Data (Member Self-Registration & OTP Verification) | X |   |   |   |   |
| Authenticate Session & Recover Password | X | X | X | X | X |
| Update Own Data (Change Password) |   | X | X | X | X |
| Member Dashboard & Notifications |   | X |   |   |   |
| Query Own Data (Active Package, Quota, Schedule & Notifications) |   | X |   |   |   |
| Update Own Data (Mark Notifications Read) |   | X |   |   |   |
| Packages, Class Registration & Booking Flow (/member/packages, /classes, /book/\*) |   | X |   |   |   |
| Query Own Data (Memberships, Quota & Eligible Slots) |   | X |   |   |   |
| Add New Data (Purchase Package, Enroll Class, Checkout Court / PT via VNPay) |   | X |   |   |   |
| Member Schedule & Attendance History (/member/schedule, /member/attendance) |   | X |   | X |   |
| Query Own Data (Personal Bookings, Attendance & Gate Check-In Logs) |   | X |   |   |   |
| Query Managed Data (View Schedule Page Route) |   |   |   | X |   |
| Update Own Data (Reschedule Court Booking / Submit Attendance Dispute) |   | X |   |   |   |
| Delete Data (Cancel Own Eligible Booking) |   | X |   |   |   |
| Workout Plans, Body Metrics & AI Sports Assistant |   | X |   | X |   |
| Query Own Data (Own Workout Plans, Body Logs & Health Profile) |   | X |   |   |   |
| Query Managed Data (Assigned Students’ Workout Plans & Body Logs) |   |   |   | X |   |
| Add New Data (Create PT / Class Workout Plan & Record Body Logs) |   |   |   | X | X |
| Add New Data (Save AI-Suggested Workout Plan) |   | X |   | X | X |
| Update Own Data (Toggle Exercise Completion & Health Profile) |   | X |   |   |   |
| Use AI Sports Chat Assistant |   | X | X | X | X |
| Reviews, Transactions, Receipts, Refunds & Member Profile |   | X |   |   |   |
| Query Own Data (Payment Receipts, Refund Status, Tickets & Digital QR) |   | X |   |   |   |
| Add New Data (Submit Review, Refund Request & Support Ticket) |   | X |   |   |   |
| Update Own Data (Profile Info & Avatar) |   | X |   |   |   |
| Front-Desk Check-In, POS & Shift Revenue Report (/receptionist/checkin, /pos, /shift) |   |   | X |   | X |
| Query All Data (Check-In Logs, Pending Cash & Daily Shift Revenue) |   |   | X |   | X |
| Add New Data (QR/RFID Check-In, POS Sale, Cash Confirmation & K80 Print) |   |   | X |   | X |
| Member Lookup & Card Issuance (/receptionist/members) |   |   | X |   | X |
| Query All Data (Search Member Profiles & Membership Cards) |   |   | X |   | X |
| Add New Data (Register Member / Coach / Receptionist — Excludes Manager) |   |   | X |   |   |
| Update Managed Data (Member Avatar, RFID Card Link & SOS Contact) |   |   | X |   | X |
| Equipment Loans & Class Roster (/receptionist/equipment, /receptionist/classes) |   |   | X |   | X |
| Query All Data (Equipment Inventory, Loans, Class Schedule & Rosters) |   |   | X |   | X |
| Add New Data (Add Equipment Item & Issue Equipment Loan) |   |   | X |   | X |
| Update Managed Data (Process Return/Fee & Correct Class Attendance) |   |   | X |   | X |
| Coach Operations (Dashboard, Students, Schedule, Attendance, Reviews, Profile) |   |   |   | X |   |
| Query Own Data (Teaching Schedule, Commission Income, Reviews & Notifications) |   |   |   | X |   |
| Query Managed Data (Assigned Students & Session Rosters) |   |   |   | X |   |
| Add New Data (Send Student/Class Notice & Submit Leave Request) |   |   |   | X |   |
| Update Own Data (Coach Profile, Certifications, Avatar & Weekly Availability) |   |   |   | X |   |
| Update Managed Data (3-State Session Attendance & Coach Feedback Notes) |   |   | X | X | X |
| Admin Dashboard, Packages, Vouchers, Facilities & Maintenance |   |   |   |   | X |
| Query All Data (Courts & Maintenance Schedule) |   |   | X |   | X |
| Query All Data (Executive Revenue KPIs, Packages & Vouchers) |   |   |   |   | X |
| Add New Data (Create Packages, Vouchers, Class Sessions & Maintenance) |   |   |   |   | X |
| Update All Data (Update Packages, Vouchers, Courts, Classes & Extend Maintenance) |   |   |   |   | X |
| Delete Data (Cancel Class Session, Delete Voucher & Delete Maintenance) |   |   |   |   | X |
| Admin Staff, Members, Approvals, Reconciliation, Broadcast, Settings & Audit Logs |   |   |   |   | X |
| Query All Data (Users, Staff KPIs, Pending Queues, Overpayments, Tickets & Logs) |   |   |   |   | X |
| Add New Data (Create User Any Role Incl. Manager & Send System Broadcast) |   |   |   |   | X |
| Update All Data (System Policies, RBAC Matrix, AI Config & Ticket Replies) |   |   |   |   | X |
| Approve / Reject Queues, Lock/Unlock Member & Refund Excess |   |   |   |   | X |

In which:

* Guest: Unauthenticated visitor who can browse public pages (Home, About, Sports, Facilities, Pricing), validate promotional vouchers, register a new Member account, verify email OTP, log in, or recover a forgotten password.

* Member: Registered customer (ROLE\_MEMBER) authorized to purchase/renew membership packages, enroll in group classes, book courts and 1-on-1 PT sessions, pay via Quota or VNPay, manage bookings, view attendance/transactions/notifications, track workout plans and body logs, chat with AI Assistant, and submit reviews, refunds, and tickets. 

* Receptionist: Front-desk staff (ROLE\_RECEPTIONIST) authorized to execute QR/RFID gate check-ins, sell packages and confirm cash/VNPay payments via POS with K80 receipt printing, manage equipment loans and overtime returns, search/register non-manager users, link RFID cards, update class attendance, and export daily shift revenue reports.

*  Admin: Center Manager and System Administrator (ROLE\_MANAGER / ROLE\_ADMIN) with full administrative oversight across dashboards, packages, vouchers, courts/classes/maintenance, all user accounts and staff KPIs, approval queues (staff, memberships, coach leave reassignment, refunds), excess payment reconciliation, system broadcasts, RBAC/AI settings, and immutable audit logs.

### **5\. Entity Relationship Diagram** {#5.-entity-relationship-diagram}

*Figure 6: SportHub Conceptual Entity Relationship Diagram* 

**Entities Description**

| \# | Entity | Description |
| :---- | :---- | :---- |
| 1 | User | Stores system-wide user account information (including roles: Manager, Receptionist, Coach, Member). |
| 2 | Member Health Profile | Stores members' personal physical and health profiles (BMI, SMM, PBF, height, weight, injury history). |
| 3 | Sport | Catalog of sports and movement disciplines provided by the center (Pickleball, Tennis, Badminton, Gym, etc.). |
| 4 | Facility | Infrastructure areas, court clusters, and specialized training rooms serving sports activities.  |
| 5 | Sports Court |  Details of specific sports courts available for hourly rentals (stores unit price, opening/closing hours, status). |
| 6 | Voucher | Manages discount codes, promotions, minimum order requirements, discount amounts, and validity periods. |
| 7 | Membership Session  | Catalog of membership packages (System-wide VIP, Off-peak Gold, 1-on-1 PT, Specialized Classes). |
| 8 | Package User  | Specific membership packages registered by users, tracking activation periods, expiration dates, and statuses. |
| 9 | Membership Class  | Teaching schedules, periodic sports classes, or 1-on-1 PT sessions managed by assigned coaches. |
| 10 | Booking  | Registration orders for classes/training sessions by members, tracking attendance status and coach notes. |
| 11 | Payment | Business invoices for package purchases, renewals, or POS sales at the reception counter.  |
| 12 | Payment Transaction  | Online payment gateway transactions (VNPay / Sandbox), storing bank reconciliation reference codes. |
| 13 | Court Booking  | Sports court reservations based on actual time slots, linked with payment and check-in statuses.  |
| 14 | Feedback  | Teaching quality ratings (1 to 5 stars) and reviews submitted by members for coaches after sessions.  |
| 15 | Member Check-in  | RFID card swipe or QR code check-in logs for members entering the training center daily.  |
| 16 | Coach Leave Request  | Coach leave applications, tracking affected session counts and designated substitute coaches.  |
| 17 | Equipment  | Catalog of rental or borrowable sports equipment (rackets, balls, shoes, etc.), tracking available stock quantities.  |
| 18 | Equipment Loan  | Tracking slips for borrowing and returning sports equipment at the reception counter, calculating hourly rental fees. |
| 19 | Refund Request  | Cancellation and refund requests when members cancel courts or packages, storing Manager approval statuses. |
| 20 | Auth Session  | Manages active login sessions based on hashed Bearer Tokens.  |
| 21 | Verification Token  | Manages 6-digit OTP codes for email verification during account registration or password recovery.  |
| 22 | Audit Log | Security audit logs recording all critical CRUD data operations and security alerts. |

### **6\. State transition diagram** {#6.-state-transition-diagram}

#### **6.1 Court Booking (court\_bookings.status)** {#6.1-court-booking-(court_bookings.status)}

****

*Figure: Court Booking State Transition*

| State | Description |
| ----- | ----- |
| PENDING | Paid booking waiting for payment. The slot is held for 10 minutes. |
| CONFIRMED | Paid or quota-covered booking. For quota bookings, quota\_state \= HELD. |
| CHECKED\_IN | Member checked in at the front desk. Quota HELD → USED. |
| NO\_SHOW | Slot ended without check-in (scheduler runs every 60 seconds). Quota HELD → USED. Not applied if the court was under maintenance. |
| CANCELLED | Cancelled by timeout, member, refund approval or package expiry. Quota is RELEASED if timely, USED if late. |

####   **6.2 Class / PT Booking (bookings.status \+ attendance\_status)** **** {#6.2-class-/-pt-booking-(bookings.status-+-attendance_status)}

                                               *Figure: Class / PT Booking State Transition*

| State | Description |
| ----- | ----- |
| PENDING | Retail booking waiting for payment. The seat is held for 10 minutes.  |
| CONFIRMED | Paid or quota-covered booking. For quota bookings, quota\_state \= HELD. |
| CHECKED\_IN | Member checked in at the front desk. Quota HELD → USED. |
| NO\_SHOW | Slot ended without check-in (scheduler runs every 60 seconds). Quota HELD → USED. Not applied if the court was under maintenance. |
| CANCELLED | Cancelled by timeout, member, refund approval or package expiry. Quota is RELEASED if timely, USED if late. |
| EXCUSED\_ABSENCE  | Absence with permission. Quota is RELEASED if the session is within the package term, otherwise FORFEITED.  |
| UNEXCUSED\_ABSENCE | Absence without permission, marked by the Coach or set automatically when the session ends unmarked. Quota HELD → USED.  |

####       **6.3 Payment Transaction (payment\_transactions.payment\_status)** **** {#6.3-payment-transaction-(payment_transactions.payment_status)}

                                                             

 

| State | Description |
| ----- | ----- |
| PENDING | Order with amount \> 0 waiting for VNPay or cash payment within 10 minutes.  |
| PAID  | Payment verified (VNPay response 00 with valid signature and amount, or cash confirmed by the Receptionist). Orders of 0 VND are created as PAID.  |
| FAILED  | VNPay returned failure, the 10-minute window expired, or the unpaid booking was cancelled. Voucher usage is released. A late valid VNPay callback moves it to PAID, cancels the booking and creates a refund request. |
| REFUNDED | Slot ended without check-in (scheduler runs every 60 seconds). Quota HELD → USED. Not applied if the court was under maintenance. |

#### **6.4 Sports Court (sports\_courts.active)** {#6.4-sports-court-(sports_courts.active)}

*Figure: Sports Court State Transition*

| State | Description |
| ----- | ----- |
| AVAILABLE  | Court is open (active \= true) and can be quoted, booked and checked in.   |
| MAINTENANCE | Court is inside an active maintenance window or its facility is set to MAINTENANCE. Booking, checkout and check-in are blocked. Reopens automatically when the window ends or is deleted.  |
| CLOSED  | VNPay returned failure, the 10-minute window expired, or the unpaid booking was cancelled. Voucher usage is released. A late valid VNPay callback moves it to PAID, cancels the booking and creates a refund request. |
| REFUNDED | Court is manually deactivated by the Manager. Never reopened automatically; only the Manager can reactivate it. |

####                                                 **6.5 User Membership (user\_memberships.status)** {#6.5-user-membership-(user_memberships.status)}

 **

                                                      *Figure: User Membership State Transition*

| State | Description |
| ----- | ----- |
| PENDING\_PAYMENT | Package purchased, waiting for payment within 10 minutes. |
| PENDING\_APPROVAL | Payment received, waiting for Manager approval. |
| ACTIVE | Approved by the Manager. Start/end dates are set and quotas are granted. |
| REJECTED  | Rejected by the Manager with a reason. A 100% refund request is created automatically.  |
| EXPIRED  | End date passed (scanned daily at 00:00). Held bookings are settled or converted to retail payment.  |
| CANCELLED  | Unpaid after 10 minutes, or refund approved. Remaining and held quotas are cleared.  |

## **II. Functional Requirements** {#ii.-functional-requirements}

### **1\. Member Management** {#1.-member-management}

#### **1.1. Authentication and Account Management** {#1.1.-authentication-and-account-management}

Actor: Member / Guest

#### **1.2. User Registration and Email Verification** {#1.2.-user-registration-and-email-verification}

**Function Trigger**

The Guest accesses the Registration page from the Login page and selects the Register option. After submitting the registration form, the system initiates the account creation and email verification process.

**Function Description**

This function allows new users to create a SportHub account and verify their email address before accessing member services.

The system collects the user's registration information, validates the submitted data, creates a new account with PENDING status, and sends a One-Time Password (OTP) to the registered email address.

The user must enter the OTP to activate the account. After successful verification, the account status is changed to ACTIVE, and the system creates an authentication session.

**Screen Layout**

**Function Details**

1\.   	The Guest enters the required registration information, including full name, email address, phone number, and password.

2\.   	The system validates the submitted information:

> > > o    Required fields must not be empty.

> > > o    Full name and email must not exceed 100 characters.

> > > o    Phone number must not exceed 15 characters.

> > > o    Email must follow a valid email format.

> > > o    Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, and one digit.

3\.   	The system checks whether the email address already exists.

4\.   	If the information is valid, the system creates a new user account with PENDING status and generates an OTP.

5\.   	The OTP is sent to the registered email address. The OTP is stored in hashed form in the database.

6\.   	The OTP is valid for 10 minutes.

7\.   	The user enters the OTP to verify the email address.

8\.   	If the OTP is correct, the system changes the account status from PENDING to ACTIVE, removes the registration OTP, and creates an authentication session.

**Abnormal Cases:**

·         If the email format is invalid, the system rejects the registration request.

·         If the email is already registered, the system does not create another account.

·         If the OTP is incorrect, the system increases the failed-attempt counter.

·         If the user enters an incorrect OTP five times, further verification attempts are rejected.

·         If the OTP expires or cannot be found, the user must request a new OTP.

·         If the account is already activated, the registration verification process is rejected.

**Related APIs:**

·         POST /api/v1/auth/register

·         POST /api/v1/auth/verify-email

·         POST /api/v1/auth/resend-otp

·         GET /api/v1/auth/check-email

#### **1.3. User Login and Logout** {#1.3.-user-login-and-logout}

**Function Trigger**

The Member accesses the Login page and submits their registered email address or phone number together with their password. To log out, the authenticated Member selects the Logout option.

**Function Description**

This function authenticates registered users and manages their login sessions.

The system verifies the submitted credentials, checks the account status, and creates an authentication session when the credentials are valid and the account is active.

The system also supports session termination through the logout function.

**Screen Layout**

**Function Details**

1\.   	The Member enters their email address or phone number and password.

2\.   	The system searches for the user using the submitted email address or phone number.

3\.   	The system verifies the password against the stored password hash.

4\.   	If the credentials are valid, the system checks whether the account status is ACTIVE.

5\.   	If authentication succeeds, the system creates an authentication session and returns an authentication response.

6\.   	The Member can access authorized system functions according to their assigned role.

7\.   	When logging out, the system extracts the Bearer token from the Authorization header and terminates the corresponding session.

**Abnormal Cases:**

·         If the email/phone number or password is empty, the system rejects the request.

·         If the account does not exist or the password is incorrect, the system rejects authentication.

·         If the account is PENDING, the system returns a 403 FORBIDDEN response with the error code PENDING\_VERIFICATION and redirects the user to /verify-otp.

·         If the account is not ACTIVE, the system does not allow normal login.

·         If the logout request does not contain a valid Bearer token, the system processes the request without a token.

**Related APIs:**

·         POST /api/v1/auth/login

·         DELETE /api/v1/auth/session

#### **1.4. Password Management** {#1.4.-password-management}

**Function Trigger**

The Member accesses the Change Password option from their account settings or selects Forgot Password from the Login page.

**Function Description**

This function allows authenticated Members to change their current password and allows users who cannot remember their passwords to recover account access through email verification.

The password recovery process consists of three main steps: requesting an OTP, verifying the OTP, and setting a new password using a reset token.

**Screen Layout**

**Function Details**

**A. Change Password**

1\.   	The authenticated Member submits the required password information.

2\.   	The system validates the request and processes the password change.

3\.   	The new password is stored securely using password hashing.

Related API:

·         POST /api/v1/auth/change-password

**B. Forgot Password**

1\.   	The user submits their registered email address.

2\.   	The system checks the account status.

3\.   	For an eligible account, the system generates a six-digit OTP and stores its SHA-256 hash.

4\.   	The OTP is sent to the user's email address.

5\.   	The OTP expires after 10 minutes.

6\.   	A 60-second cooldown is applied between OTP requests.

Related API:

·         POST /api/v1/auth/forgot-password

**C. Verify Reset Code**

1\.   	The user enters their email address and six-digit OTP.

2\.   	The system checks whether the OTP exists, is unused, and has not expired.

3\.   	The system checks whether the OTP has been locked.

4\.   	If verification succeeds, the OTP is marked as used.

5\.   	The system generates a reset token with a validity period of 10 minutes.

6\.   	The reset token is returned to the client.

Related API:

·         POST /api/v1/auth/verify-code

**D. Reset Password**

1\.   	The user submits the reset token, new password, and password confirmation.

2\.   	The system validates the reset token.

3\.   	The system checks whether the new password and confirmation match.

4\.   	The system validates password strength.

5\.   	If all validations pass, the system updates the user's password.

Related API:

·         POST /api/v1/auth/reset-password

**Abnormal Cases:**

·         If the email address is not associated with an account, the system returns a generic response to avoid revealing whether the email exists.

·         If the account is PENDING, the system redirects the user to the registration OTP verification process.

·         If the account is LOCKED or INACTIVE, password recovery is rejected.

·         If the OTP is invalid, expired, or locked, the system rejects the verification request.

·         If the reset token is invalid or expired, the system does not allow the password to be changed.

·         If the new password and confirmation do not match, the system rejects the request.

·         If the new password does not satisfy the password-strength requirements, the system rejects the request.

#### **1.5. Email Availability Checking** {#1.5.-email-availability-checking}

**Function Trigger**

The Guest enters an email address in the Registration form. The system checks its availability before allowing the registration process to continue.

**Function Description**

This function verifies whether an email address is already registered in SportHub.

The system returns the email availability status and, when an account exists, provides relevant account information and status.

**Screen Layout**

****

**Function Details**

1\.   	The user enters an email address.

2\.   	The frontend sends the email address to the backend for checking.

3\.   	The system trims whitespace and normalizes the email address to lowercase.

4\.   	The system searches for an existing user with the submitted email address.

5\.   	If no account exists, the system returns:

> > > o    exists \= false

> > > o    available \= true

6\.   	If an account exists, the system returns:

> > > o    exists \= true

> > > o    available \= false

> > > o    Relevant user information, including full name, role, and account status.

7\.   	The system provides a message according to the account status.

**Abnormal Cases:**

·         If the email address already exists, the user cannot register another account using the same email.

·         If the existing account is PENDING, the user may need to complete email verification.

·         If the existing account is ACTIVE, the email cannot be used for a new registration.

**Related API:**

·         GET /api/v1/auth/check-email

#### **1.6. Business Rules Summary** {#1.6.-business-rules-summary}

| Rule ID | Business Rule |
| :---- | :---- |
| BR-AUTH-01 | Registration passwords must contain at least 8 characters, including uppercase, lowercase, and numeric characters. |
| BR-AUTH-02 | Newly registered accounts remain in PENDING status until email verification is successful. |
| BR-AUTH-03               	 | Registration OTPs are valid for 10 minutes. |
| BR-AUTH-04 | Users can request a new OTP only after the 60-second cooldown period. |
| BR-AUTH-05 | Registration OTP verification allows a maximum of 5 failed attempts. |
| BR-AUTH-06 | Only ACTIVE accounts can complete normal login. |
| BR-AUTH-07 | Password reset requires a valid reset token generated after successful OTP verification. |
| BR-AUTH-08 | Password reset tokens are valid for 10 minutes. |
| BR-AUTH-09 | Email availability checking prevents duplicate registration using an existing email address. |

#### **1.7. Court Booking and Class Registration** {#1.7.-court-booking-and-class-registration}

##### ***1.7.1. View Available Courts***

**Function Trigger**

The Member accesses the Court Booking section and selects a sport to view available courts and time slots.

**Function Description**

This function allows Members to view available courts and their booking schedules. The system displays court information, hourly rates, and available time slots for the selected sport.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Court Booking page.

2\.   	The frontend requests available court information from the backend.

3\.   	The system verifies that the selected sport is active.

4\.   	The system retrieves active courts belonging to the selected sport.

5\.   	The system generates available hourly time slots for the next 14 days.

6\.   	The system checks existing confirmed court bookings to identify occupied time slots.

7\.   	Only future and unoccupied time slots within the court's operating hours are returned.

8\.   	The system displays court names, descriptions, sport names, hourly rates, and available time slots.

**Abnormal Cases:**

·         If the selected sport does not exist or is inactive, the system cannot retrieve its available courts.

·         If no active courts are available, the system returns an empty list.

·         If a time slot has already been booked, it is excluded from the available slots.

·         Past time slots are not displayed.

**Related API:**

·         GET /api/v1/booking-flow/courts

##### ***1.7.2. View Available Classes***

**Function Trigger**

The Member accesses the Class Registration section to view upcoming sports classes.

**Function Description**

This function allows Members to view upcoming scheduled classes and their relevant information, including class names, sports, coaches, facilities, schedules, maximum capacity, current bookings, and class prices.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Class Registration page.

2\.   	The frontend requests the list of available classes.

3\.   	The system retrieves class sessions with the SCHEDULED status.

4\.   	The system filters out sessions whose start time is not in the future.

5\.   	The system retrieves related coach information.

6\.   	The system counts existing bookings with BOOKED and CONFIRMED statuses.

7\.   	The system retrieves the Member's existing booking information, including BOOKED, CONFIRMED, and WAITLIST statuses.

8\.   	The system returns class details and the Member's current booking status, if applicable.

**Abnormal Cases:**

·         If no upcoming scheduled classes are available, the system returns an empty list.

·         Classes that have already started or are not in SCHEDULED status are excluded.

·         If the Member has already booked or joined the waiting list for a class, the existing booking information is returned.

**Related API:**

·         GET /api/v1/booking-flow/classes

·         GET /api/v1/bookings/classes

##### ***1.7.3. Get Booking Quote***

**Function Trigger**

The Member selects a court or class and proceeds to review the booking price before checkout.

**Function Description**

This function calculates the booking amount based on the selected booking type, item, and time. The system also checks applicable membership discounts and returns the final amount before the Member confirms the booking.

**Screen Layout**

**Function Details**

1\.   	The Member selects a booking type, either COURT or CLASS.

2\.   	The Member selects the corresponding court or class and booking time.

3\.   	The frontend sends the booking information to the backend.

4\.   	The system validates the booking type and retrieves the selected item.

5\.   	For court bookings, the system validates the selected time slot and checks for overlapping confirmed bookings.

6\.   	For class bookings, the system retrieves the class, sport, facility, and coach information.

7\.   	The system calculates the original booking amount.

8\.   	If the Member has an active membership, the system checks the applicable membership discount.

9\.   	The system calculates the discount amount and final booking amount.

10\.   The system returns the booking details, original amount, discount amount, final amount, and discount label.

**Abnormal Cases:**

·         If the selected court or class does not exist, the system returns an error.

·         If the selected court time overlaps with an existing confirmed booking, the system rejects the quote.

·         If the Member has no active membership, no membership discount is applied.

·         If the booking amount is invalid or unavailable, the system cannot complete the quote.

**Related API:**

·         GET /api/v1/booking-flow/quote

##### ***1.7.4. Checkout and Confirm Booking***

**Function Trigger**

The Member reviews the booking details and confirms the booking through the checkout process.

**Function Description**

This function processes the Member's booking request for courts, classes, or personal training sessions. The system validates the Member's account, checks booking availability, applies membership quota when eligible, and creates the corresponding booking and payment records.

**Screen Layout**

**Function Details**

1\.   	The Member selects the booking type and confirms the selected item and schedule.

2\.   	The Member selects a payment method or chooses to use an eligible membership quota.

3\.   	The frontend submits the checkout request to the backend.

4\.   	The system verifies that the Member account exists and has ACTIVE status.

5\.   	The system prevents accounts with the COACH role from booking as Members.

6\.   	If membership quota is selected:

> > > o    The system does not allow quota usage for court bookings.

> > > o    Class and personal training bookings may use eligible membership quota.

> > > o    The system holds one quota session and creates a confirmed booking.

7\.   	If regular payment is selected:

> > > o    The system processes the booking according to its type.

> > > o    The system creates a payment transaction.

> > > o    The booking and payment information are saved.

8\.   	The system returns a booking confirmation containing the booking ID, payment information, booking details, amount, and payment status.

**Abnormal Cases:**

·         If the Member account is not active, the checkout request is rejected.

·         If the selected class is no longer available, the system rejects the booking.

·         If the Member has already booked the same class or joined its waiting list, duplicate registration is rejected.

·         If the class is full, the system rejects the booking.

·         If the Member has another overlapping class booking, the system rejects the request.

·         Court bookings cannot use membership quota.

·         If the Member is not eligible to use membership quota, the quota-based checkout cannot be completed.

**Related API:**

·         POST /api/v1/booking-flow/checkout

#### **1.8. View Personal Schedule** {#1.8.-view-personal-schedule}

**Function Trigger**

The Member accesses the My Schedule section to review personal court bookings and class registrations.

**Function Description**

This function allows Members to view their booking history and upcoming schedules. The system displays both court bookings and class bookings, including relevant information such as booking status, time, location, fee, and coach information when applicable.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the My Schedule page.

2\.   	The frontend requests the Member's booking schedule.

3\.   	The system retrieves the Member's class bookings and related class information.

4\.   	The system retrieves the Member's court bookings and related court information.

5\.   	Cancelled bookings are excluded from the returned schedule.

6\.   	The system combines the remaining class and court bookings.

7\.   	The system sorts the schedule entries by start time.

8\.   	The system returns the schedule information for display.

**Abnormal Cases:**

·         If the Member has no bookings, the system returns an empty schedule.

·         If related court or class information cannot be found, the corresponding invalid entry is excluded or displayed with available information.

**Related API:**

·         GET /api/v1/booking-flow/schedule

·         GET /api/v1/bookings/my-schedule

#### **1.9. Cancel Booking** {#1.9.-cancel-booking}

**Function Trigger**

The Member selects an existing court or class booking and requests cancellation.

**Function Description**

This function allows Members to cancel their own confirmed bookings or eligible class waiting-list bookings. The system validates ownership and booking status, applies the cancellation and refund policy, and updates the related booking records.

**Screen Layout**

**Function Details**

1\.   	The Member selects a booking from the personal schedule.

2\.   	The Member chooses the cancellation action.

3\.   	The frontend submits the cancellation request to the backend.

4\.   	The system verifies that the booking belongs to the requesting Member.

5\.   	For class bookings:

> > > o    The system allows cancellation of BOOKED, CONFIRMED, or WAITLIST bookings.

> > > o    The booking status is updated to CANCELLED.

> > > o    If cancellation occurs at least two hours before the class starts, the system refunds 100% of the paid fee.

> > > o    If cancellation occurs less than two hours before the class starts, no refund is provided.

> > > o    If membership quota was used, the system releases the held quota for timely cancellation or consumes it for late cancellation.

> > > o    If a confirmed booking is cancelled, the first Member on the waiting list is promoted to BOOKED, when available.

6\.   	For court bookings:

> > > o    The system allows cancellation only for bookings with CONFIRMED status.

> > > o    The Member cannot cancel a court booking when less than two hours remain before its start time.

> > > o    Eligible cancellations result in a full refund of the paid amount.

7\.   	The system saves the cancellation and refund information.

8\.   	The system returns the updated booking result.

**Abnormal Cases:**

·         If the booking does not exist, the system returns an error.

·         If the booking belongs to another Member, the cancellation request is rejected.

·         If the booking has already been cancelled, the system rejects the request.

·         If the booking status does not allow cancellation, the system rejects the request.

·         Court bookings cannot be cancelled within two hours before the scheduled start time.

**Related API:**

·         DELETE /api/v1/booking-flow/schedule/{bookingType}/{bookingId}

·         DELETE /api/v1/bookings/{bookingId}

#### **1.10. Member Profile and Membership Services** {#1.10.-member-profile-and-membership-services}

##### ***1.10.1. Manage Member Profile***

**Function Trigger**

The Member accesses the Profile section to view or update personal account information.

**Function Description**

This function allows Members to view and update their personal profile information. Members can also update their profile avatar and maintain their health-related information.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Profile page.

2\.   	The frontend requests the Member's profile information.

3\.   	The system retrieves the profile associated with the authenticated Member.

4\.   	The Member can update the available personal information.

5\.   	The frontend submits the updated information to the backend.

6\.   	The system validates and saves the updated profile.

7\.   	The Member can upload or update their profile avatar through the avatar update function.

**Abnormal Cases:**

·         If the Member is not authenticated, the system rejects the request.

·         If the submitted profile information is invalid, the system rejects the update.

·         If the avatar data is missing or invalid, the system rejects the avatar update.

**Related APIs:**

·         GET /api/v1/members/me

·         PUT /api/v1/members/me

·         PUT /api/v1/members/me/avatar

##### ***1.10.2. Manage Health Profile***

**Function Trigger**

The Member accesses the Health Profile section to view or update their health information.

**Function Description**

This function allows Members to maintain health-related information, including physical measurements, fitness goals, and injury history. The information can support personalized training activities.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Health Profile section.

2\.   	The frontend requests the Member's health information.

3\.   	The system retrieves the health profile associated with the authenticated Member.

4\.   	The Member enters or updates the available health information.

5\.   	The frontend submits the updated information.

6\.   	The system processes and saves the health profile.

**Abnormal Cases:**

·         If the Member is not authenticated, the system rejects the request.

·         If the submitted information is invalid, the system rejects the update.

**Related APIs:**

·         GET /api/v1/members/me/health

·         PUT /api/v1/members/me/health

##### ***1.10.3. View Digital Membership Card***

**Function Trigger**

The Member accesses the Digital Membership Card section from their account.

**Function Description**

This function allows Members to view their digital membership card. The card provides membership identification information and supports the QR-based identification process at the sports center.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Digital Membership Card section.

2\.   	The frontend requests the digital card information.

3\.   	The system retrieves the card information associated with the authenticated Member.

4\.   	The system returns the available digital card data.

5\.   	The frontend displays the membership card for Member identification.

**Abnormal Cases:**

·         If the Member is not authenticated, the system rejects the request.

·         If the digital card information cannot be retrieved, the system returns an appropriate error.

**Related API:**

·         GET /api/v1/members/me/digital-card

##### ***1.10.4. View and Manage Membership Packages***

**Function Trigger**

The Member accesses the Membership section to view current membership information or purchase an available membership package.

**Function Description**

This function allows Members to view their membership packages and related membership information. The system also provides membership purchase functionality through the membership service.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Membership section.

2\.   	The frontend requests the Member's membership information.

3\.   	The system retrieves the Member's existing memberships.

4\.   	The Member can review the available membership information displayed by the frontend.

5\.   	When the Member submits a membership purchase request, the frontend sends the request to the backend.

6\.   	The system processes the membership request through the membership service.

7\.   	The system returns the corresponding membership result.

**Abnormal Cases:**

·         If the Member is not authenticated, the system rejects the request.

·         If the membership request is invalid or cannot be processed, the system returns an error.

**Related APIs:**

·         GET /api/v1/members/me/memberships

·         POST /api/v1/members/me/memberships

#### **1.11. Body Progress and Workout Management** {#1.11.-body-progress-and-workout-management}

##### ***1.11.1. View Body Progress and Workout History***

**Function Trigger**

The Member accesses the Body Progress section to review personal physical measurements and workout plans.

**Function Description**

This function allows Members to view their recorded body progress and workout plans. The system retrieves measurement records and workout plans associated with the authenticated Member.

The available measurement information includes weight, height, BMI, skeletal muscle mass (SMM), body fat percentage (PBF), and maximum lift records (1RM).

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Body Progress section.

2\.   	The frontend requests the Member's workout progress information.

3\.   	The system identifies the authenticated Member.

4\.   	The system retrieves the Member's workout plans.

5\.   	The system retrieves the Member's body progress records.

6\.   	The system returns the records to the frontend.

7\.   	The frontend displays the available progress information.

**Abnormal Cases:**

·         If the Member is not authenticated, the system rejects the request.

·         If the Member has no recorded body progress or workout plans, the system returns an empty collection.

**Related APIs:**

·         GET /api/v1/workout-progress/me

·         GET /api/v1/workout-progress/member/{memberId}

##### ***1.11.2. Record Body Progress and 1RM***

**Function Trigger**

The Member or an authorized staff member submits a new body measurement or maximum lift record.

**Function Description**

This function records physical progress information for a Member. The system stores measurement data such as weight, height, skeletal muscle mass, body fat percentage, BMI, and maximum lift weight.

The system automatically calculates BMI when it is not provided and both weight and height are available.

**Screen Layout**

**Function Details**

1\.   	The Member or an authorized staff member opens the body progress entry form.

2\.   	The user enters the available measurement information.

3\.   	The frontend submits the information to the backend.

4\.   	The system identifies the target Member.

5\.   	The system checks whether the requesting user has permission to record information for the target Member.

6\.   	The system validates the submitted measurements:

> > > o    Weight must be greater than zero when provided.

> > > o    Height must be greater than zero when provided.

> > > o    Maximum lift weight cannot be negative.

7\.   	If BMI is not provided and both weight and height are available, the system calculates BMI automatically.

8\.   	The system saves the body progress record with its recording date.

9\.   	The system returns the saved record.

**Abnormal Cases:**

·         If the user does not have permission to record information for the target Member, the system rejects the request.

·         If weight or height is zero or negative, the system rejects the request.

·         If the maximum lift weight is negative, the system rejects the request.

**Related API:**

·         POST /api/v1/workout-progress/body-logs

##### ***1.11.3. View Workout Plans and Coach Feedback***

**Function Trigger**

The Member accesses the Workout Plans section to review training plans assigned by their Coach or saved from AI recommendations.

**Function Description**

This function allows Members to view their workout plans, exercise information, training goals, session results, Coach feedback, and homework when available.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Workout Plans section.

2\.   	The frontend requests the Member's workout progress information.

3\.   	The system retrieves workout plans associated with the authenticated Member.

4\.   	The system returns the available plan information.

5\.   	The frontend displays the workout plan details, Coach feedback, and homework when available.

**Abnormal Cases:**

·         If the Member is not authenticated, the system rejects the request.

·         If no workout plans are available, the system returns an empty collection.

**Related API:**

·         GET /api/v1/workout-progress/me

#### **1.12. AI Fitness Assistant** {#1.12.-ai-fitness-assistant}

##### ***1.12.1. Interact with AI Fitness Assistant***

**Function Trigger**

The Member accesses the AI Assistant section and submits a message requesting training-related assistance.

**Function Description**

This function allows Members to interact with the AI Fitness Assistant. The system processes the submitted message and provides an AI-generated response.

The AI assistant also supports workout-plan generation through its dedicated endpoint.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the AI Assistant interface.

2\.   	The Member enters a question or training-related request.

3\.   	The frontend submits the message to the backend.

4\.   	The system processes the request through the AI assistant service.

5\.   	The system returns the generated response.

6\.   	The frontend displays the response to the Member.

7\.   	When a workout plan is generated and the Member chooses to save it, the system supports saving the AI-generated plan through the workout progress function.

**Abnormal Cases:**

·         If the Member is not authenticated, the system rejects requests that require authentication.

·         If the submitted request is invalid, the system returns an appropriate error.

·         If the AI service is unavailable or cannot process the request, the system cannot return a normal AI response.

**Related APIs:**

·         POST /api/v1/ai/chat

·         POST /api/v1/ai/coach-plan

·         POST /api/v1/workout-progress/plans

#### **1.13. Refund Request Management** {#1.13.-refund-request-management}

##### ***1.13.1. Submit and View Refund Requests***

**Function Trigger**

The Member accesses the Refund Request section and submits a request for a refund related to an eligible transaction.

**Function Description**

This function allows Members to submit and review their refund requests. The Member can provide refund-related information, including the reason and bank account details when required.

The system stores the request for subsequent review by the Manager.

**Screen Layout**

**Function Details**

1\.   	The Member accesses the Refund Request section.

2\.   	The frontend requests the Member's existing refund requests.

3\.   	The system retrieves refund requests associated with the authenticated Member.

4\.   	The Member enters the required refund information.

5\.   	The frontend submits the refund request.

6\.   	The system processes and stores the submitted request.

7\.   	The Member can review the submitted request and its available status.

**Abnormal Cases:**

·         If the Member is not authenticated, the system rejects the request.

·         If the submitted refund information is invalid, the system rejects the request.

·         If the refund request cannot be processed, the system returns an appropriate error.

**Related APIs:**

·         GET /api/v1/members/me/refunds

·         POST /api/v1/members/me/refunds

### **2\. Receptionist Management** {#2.-receptionist-management}

Actor: Receptionist

#### **2.1. Member Lookup** {#2.1.-member-lookup}

##### ***2.1.1. Search and View Member Information***

**Function Trigger**

The Receptionist accesses the Member Management section and enters a search keyword to find a Member.

**Function Description**

This function allows Receptionists to search for Members and view basic member information, including full name, email, phone number, account status, and registration date.

**Screen Layout**

**Function Details**

1\.   	The Receptionist accesses the Member Management page.

2\.   	The Receptionist enters a search keyword.

3\.   	The frontend submits the search request with pagination information.

4\.   	The system verifies that the requesting user has staff permissions.

5\.   	The system searches for matching Member records.

6\.   	The system returns the results in paginated form.

7\.   	The frontend displays the matching Member information.

**Abnormal Cases:**

·         If the requesting user does not have staff permissions, the system rejects the request.

·         If the page number is negative, the system rejects the request.

·         If no matching Members are found, the system returns an empty result.

**Related API:**

·         GET /api/v1/receptionist/members

#### **2.2. Member Check-in Management** {#2.2.-member-check-in-management}

##### ***2.2.1. Record Member Check-in***

**Function Trigger**

The Receptionist identifies a Member and records their check-in at the sports center.

**Function Description**

This function allows Receptionists to record Member check-ins and verify whether the Member is eligible to enter the sports center.

The system checks the Member's account status and active membership validity before recording the check-in result.

**Screen Layout**

**Function Details**

1\.   	The Receptionist accesses the Check-in section.

2\.   	The Receptionist identifies the Member using the available member identification workflow.

3\.   	The frontend submits the Member ID to the backend.

4\.   	The system verifies staff permissions.

5\.   	The system checks whether the selected user exists and has the MEMBER role.

6\.   	The system checks whether the Member's account status is ACTIVE.

7\.   	The system checks whether the Member has an active membership valid on the current date.

8\.   	The system records the check-in result:

> > > o    VALID: the account is active and has a valid active membership.

> > > o    REJECTED: the Member does not satisfy the eligibility conditions.

9\.   	The system stores the check-in time and the Receptionist who recorded the transaction.

10\.   The system returns the check-in result.

**Abnormal Cases:**

·         If the Member ID is missing, the system rejects the request.

·         If the Member does not exist or does not have the MEMBER role, the system returns an error.

·         If the Member account is inactive, the check-in result is REJECTED.

·         If the Member has no valid active membership, the check-in result is REJECTED.

·         If the Receptionist does not have staff permissions, the system rejects the request.

**Related APIs:**

·         POST /api/v1/receptionist/check-ins

·         GET /api/v1/receptionist/check-ins

·         POST /api/v1/reception/check-in

#### **2.3. Point of Sale and Membership Sales** {#2.3.-point-of-sale-and-membership-sales}

##### ***2.3.1. Sell Membership Packages at the Counter***

**Function Trigger**

The Receptionist accesses the POS section when a Member requests to purchase a membership package at the counter.

**Function Description**

This function allows Receptionists to sell membership packages to Members and record the corresponding counter payment.

The system supports the payment methods CASH, TRANSFER, and POS. After processing the sale, the system creates a membership record and a reception payment record.

**Screen Layout**

**Function Details**

1\.   	The Receptionist accesses the POS section.

2\.   	The Receptionist selects the Member who wants to purchase a package.

3\.   	The Receptionist selects an available membership package.

4\.   	The Receptionist selects a payment method.

5\.   	The frontend submits the membership sale request.

6\.   	The system verifies staff permissions.

7\.   	The system validates the Member ID, package ID, and payment method.

8\.   	The system verifies that the Member exists, has the MEMBER role, and has ACTIVE account status.

9\.   	The system verifies that the selected membership package is ACTIVE.

10\.   The system creates a membership record with the PENDING\_APPROVAL status.

11\.   The system creates a reception payment record with the COMPLETED payment status.

12\.   The system records the payment method, amount, creation time, and Receptionist who approved the transaction.

13\.   The system returns the membership purchase result.

**Abnormal Cases:**

·         If the Member ID or package ID is missing, the system rejects the request.

·         If the payment method is not CASH, TRANSFER, or POS, the system rejects the request.

·         If the Member does not exist or is not a MEMBER, the system returns an error.

·         If the Member account is inactive, the system rejects the sale.

·         If the selected membership package is inactive or unavailable, the system rejects the sale.

**Related API:**

·         POST /api/v1/receptionist/membership-sales

#### **2.4. Receipt Generation and Printing** {#2.4.-receipt-generation-and-printing}

##### ***2.4.1. Generate and Print POS Receipt***

**Function Trigger**

The Receptionist selects the receipt printing option after completing a counter transaction.

**Function Description**

This function provides the Receptionist with a printable receipt for a completed counter transaction. The frontend supports the receipt printing interface in the POS workflow.

**Screen Layout**

**Function Details**

1\.   	The Receptionist completes a POS transaction.

2\.   	The system returns the transaction information.

3\.   	The frontend prepares the receipt content using the available transaction information.

4\.   	The Receptionist selects the print option.

5\.   	The browser opens the print interface.

6\.   	The Receptionist selects the connected receipt printer and confirms printing.

**Abnormal Cases:**

·         If the transaction information is unavailable, the receipt cannot be prepared correctly.

·         If the printer is unavailable or the browser printing process fails, the receipt cannot be printed.

**Implementation Note:**

The available backend controller confirms the membership sale and payment-recording process. A dedicated receipt-printing backend API has not been confirmed; printing should therefore be described as a frontend/browser function unless the team verifies a separate implementation.

#### **2.5. Equipment Loan and Return Management** {#2.5.-equipment-loan-and-return-management}

##### ***2.5.1. Manage Equipment Inventory***

**Function Trigger**

The Receptionist accesses the Equipment Management section to view or update sports equipment information.

**Function Description**

This function allows Receptionists to view and manage equipment records, including equipment names, categories, rental prices, total quantities, available quantities, and equipment status.

**Screen Layout**

**Function Details**

1\.   	The Receptionist accesses the Equipment Management section.

2\.   	The frontend requests the equipment list.

3\.   	The system verifies the Receptionist's authorization.

4\.   	The system retrieves the available equipment records.

5\.   	The Receptionist can add new equipment or update existing equipment information.

6\.   	The system processes the submitted equipment information.

7\.   	The frontend displays the updated equipment list.

**Abnormal Cases:**

·         If the requesting user is not authorized, the system rejects the request.

·         If the equipment information is invalid, the system rejects the operation.

·         If the requested equipment cannot be found, the system returns an error.

**Related APIs:**

·         GET /api/v1/receptionist/equipments

·         POST /api/v1/receptionist/equipments

·         PUT /api/v1/receptionist/equipments/{id}

##### ***2.5.2. Record Equipment Loan and Return***

**Function Trigger**

The Receptionist accesses the Equipment Loan section when a Member borrows or returns sports equipment.

**Function Description**

This function allows Receptionists to record equipment loans and returns. The system maintains equipment loan records and related equipment availability information.

**Screen Layout**

**Function Details**

1\.   	The Receptionist accesses the Equipment Loan section.

2\.   	The frontend requests the equipment loan information.

3\.   	The Receptionist selects the Member and equipment item.

4\.   	The Receptionist enters the loan quantity and required loan information.

5\.   	The frontend submits the loan request.

6\.   	The system processes and stores the equipment loan record.

7\.   	When the Member returns the equipment, the Receptionist selects the corresponding loan record.

8\.   	The Receptionist submits the return request.

9\.   	The system processes the return and updates the related loan information.

10\.   The frontend displays the updated loan status.

**Abnormal Cases:**

·         If the requesting user is not authorized, the system rejects the request.

·         If the selected equipment or loan record cannot be found, the system returns an error.

·         If the loan or return information is invalid, the system rejects the operation.

**Related APIs:**

·         GET /api/v1/receptionist/equipment-loans

·         POST /api/v1/receptionist/equipment-loans

·         POST /api/v1/receptionist/equipment-loans/{id}/return

#### **2.6. Daily Shift Monitoring and Reporting** {#2.6.-daily-shift-monitoring-and-reporting}

##### ***2.6.1. View Daily Shift Report***

**Function Trigger**

The Receptionist accesses the Dashboard or Report section to review daily operational and payment information.

**Function Description**

This function allows Receptionists to review daily payment and operational information. The system aggregates completed membership payments and booking transactions, calculates total revenue, and groups payment totals by payment method.

The dashboard also provides available daily information such as new Members, today's classes, active equipment loans, and recent check-ins.

**Screen Layout**

**Function Details**

1\.   	The Receptionist accesses the Dashboard or Report section.

2\.   	The frontend requests the report for the selected date.

3\.   	If no date is provided, the system uses the current date.

4\.   	The system retrieves reception payments and booking payment transactions created within the selected date.

5\.   	The system identifies completed transactions with COMPLETED or PAID status.

6\.   	The system calculates total revenue from completed transactions.

7\.   	The system groups completed transactions by payment method and calculates the corresponding totals.

8\.   	The system retrieves the related Member information for payment records.

9\.   	The system returns the report date, revenue, transaction count, new Member count, payment-method totals, and payment records.

10\.   The dashboard overview also returns available daily class, active loan, and recent check-in information.

**Abnormal Cases:**

·         If the requesting user does not have staff permissions, the system rejects the request.

·         If no payment transactions are available for the selected date, the system returns zero totals and an empty transaction list.

·         If related Member information cannot be found, the report displays the available fallback information.

**Related APIs:**

·         GET /api/v1/receptionist/report

·         GET /api/v1/receptionist/dashboard-overview

### **3\. Coach Management** {#3.-coach-management}

#### **3.1. Coach Dashboard & Notifications** {#3.1.-coach-dashboard-&-notifications}

**Actor:** Coach

Function trigger: Coach logs in and accesses /coach or opens /coach/notifications.

Function description: Presents daily teaching agenda, assigned student count, pending attendance classes, and displays teaching alerts, leave approval results, feedback alerts, and broadcasts.

Screen layout: 

Function Details:

Normal Flow & Business Logic:

> 1\. Dashboard combines weekly coach sessions (GET /api/v1/bookings/coach-schedule) with assigned student bookings (GET /api/v1/bookings/coach-students).

> 2\. Coach Notifications view retrieves unread/read notifications via GET /api/v1/notifications and marks items read via POST /api/v1/notifications/{id}/read or /read-all.

Abnormal Cases:

●        Non-COACH roles calling coach endpoints receive HTTP 403 Forbidden.

Related APIs:

●        GET /api/v1/bookings/coach-schedule

●        GET /api/v1/bookings/coach-students

●        GET /api/v1/notifications

●        POST /api/v1/notifications/{id}/read

●        POST /api/v1/notifications/read-all

#### **3.2. Schedule, Weekly Availability, Leave Requests & Commission Income**  {#3.2.-schedule,-weekly-availability,-leave-requests-&-commission-income}

Actor: Coach

Function trigger: Coach navigates to /coach/schedule or /coach/income to inspect classes, configure weekly availability, submit leave requests, or check earnings.

Function description: Displays assigned weekly class/PT schedule, persists weekly availability JSON, submits leave requests calculating affected bookings count for Manager substitution review (BR-12), and computes session commission income.

Screen layout:

Function Details:

Normal Flow & Business Logic:

> 1\. Weekly timetable loads assigned sessions via GET /api/v1/bookings/coach-schedule?weekStart=....

> 2\. Availability tab reads/saves coach.availability\_json via GET/PUT /api/v1/coach/availability.

> 3\. Leave Request submission (POST /api/v1/coach/leave-requests) counts active BOOKED/CONFIRMED bookings overlapping startDate..endDate, saves PENDING request, writes audit log, and notifies all Managers.

> 4\. Income view (GET /api/v1/coach/income) computes commission per session at 40% of session revenue with a minimum 200,000 VND guarantee per non-cancelled class session.

Abnormal Cases:

●        Leave requests with endDate before startDate or blank reason return HTTP 400 Bad Request.

Related APIs:

●        GET /api/v1/bookings/coach-schedule

●        GET /api/v1/coach/availability

●        PUT /api/v1/coach/availability

●        GET /api/v1/coach/leave-requests

●        POST /api/v1/coach/leave-requests

●        GET /api/v1/coach/income

#### **3.3. Class Attendance Marking & Session Notes**   {#3.3.-class-attendance-marking-&-session-notes}

Actor: Coach

Function trigger: Coach selects an assigned session on /coach/attendance to take attendance and add feedback notes.

Function description: Records 3-state attendance (PRESENT, EXCUSED\_ABSENCE, UNEXCUSED\_ABSENCE) with optional coach notes, automatically consuming or restoring held member quota with expired-package safeguards (BR-19, BR-20).

Screen layout:

Function Details:

Normal Flow & Business Logic:

> 1\. Coach loads assigned session roster via GET /api/v1/bookings/classes/{sessionId}/roster.

> 2\. For each student, Coach submits PUT /api/v1/bookings/{bookingId}/attendance?status=...\&coachNote=....

> 3\. Backend updates attendance\_status and recomputes quota: PRESENT or UNEXCUSED\_ABSENCE consumes 1 held quota unit; EXCUSED\_ABSENCE releases held quota (unless source membership is already EXPIRED per BR-20) or initiates refund logic for retail bookings.

Abnormal Cases:

●        Coaches cannot view rosters or mark attendance for classes taught by other coaches (HTTP 403).

Related APIs:

●        GET /api/v1/bookings/classes/{sessionId}/roster

●        PUT /api/v1/bookings/{bookingId}/attendance

#### **3.4. Assigned Students, Body Logs & AI-Assisted PT / Class Workout Plans** {#3.4.-assigned-students,-body-logs-&-ai-assisted-pt-/-class-workout-plans}

Actor: Coach

Function trigger: Coach opens /coach/students to view assigned students, log student body metrics, draft AI workout plans, assign class/PT plans, or message students.

Function description: Enforces BR-13 student privacy isolation (only students enrolled in Coach’s sessions/PT), injects PAR-Q/InBody data into Google Gemini AI to draft workouts for mandatory Coach review/customization (BR-21, BR-22), and sends direct notices.

Screen layout:

Function Details:

Normal Flow & Business Logic:

> 1\. Coach views assigned students via GET /api/v1/bookings/coach-students and inspects a student’s history via GET /api/v1/workout-progress/member/{memberId}.

> 2\. Coach records physical metrics for an assigned student via POST /api/v1/workout-progress/body-logs.

> 3\. Clicking "Generate AI Plan" calls POST /api/v1/ai/coach-plan, combining PAR-Q injuries, BMI/SMM/PBF, and fitness goal into a Gemini AI draft workout.

> 4\. Coach reviews/edits exercises, sets, reps, feedback, and homework, then publishes an individual plan (POST /api/v1/workout-progress/plans) or batch class plan (POST /api/v1/workout-progress/class-plans).

> 5\. Coach sends announcements to a student or entire class via POST /api/v1/coach/send-notice.

Abnormal Cases:

●        Accessing progress logs of unassigned members is denied; publishing unreviewed empty plans or invalid metrics is rejected.

Related APIs:

●        GET /api/v1/bookings/coach-students

●        GET /api/v1/workout-progress/member/{memberId}

●        POST /api/v1/workout-progress/body-logs

●        POST /api/v1/ai/coach-plan

●        POST /api/v1/workout-progress/plans

●        POST /api/v1/workout-progress/class-plans

●        POST /api/v1/coach/send-notice

#### **3.5. Coach Reviews & Profile Management** {#3.5.-coach-reviews-&-profile-management}

Actor: Coach

Function trigger: Coach opens /coach/reviews to monitor student ratings or /coach/profile to edit bio, specialty, certifications, and avatar.

Function description: Displays student feedback and average star ratings for classes coached by the user, and manages professional coach metadata (specialty, experience\_years, certifications, bio) plus avatar and QR badge.

Screen layout:

Function Details:

Normal Flow & Business Logic:

> 1\. GET /api/v1/feedbacks/coach/me loads student star ratings and comments directed to the Coach.

> 2\. GET/PUT /api/v1/coach/profile and PUT /api/v1/coach/avatar persist coach specialty, years of experience, certifications, bio, emergency contact, and photo.

Abnormal Cases:

●        Invalid avatar payloads or unauthorized edits fail with HTTP 400/403.

Related APIs:

●        GET /api/v1/feedbacks/coach/me

●        GET /api/v1/coach/profile

●        PUT /api/v1/coach/profile

●        PUT /api/v1/coach/avatar

### **4\. Manager Management**  {#4.-manager-management}

#### **4.1.** Executive Dashboard **4.1.1. View Executive Dashboard and Export Report** {#4.1.-executive-dashboard-4.1.1.-view-executive-dashboard-and-export-report}

**Function Trigger**

The Manager logs in and is redirected to /admin, or selects a report date.

**Function Description**

This function shows daily operating KPIs from database data: collected revenue, new members, classes of the day, class fill rate, payment-method breakdown and daily transactions. The report can be exported to CSV.

**Screen Layout**

****

**Function Details**

1\.      The system defaults the report date to today.

2\.      The frontend requests the daily report and the weekly class schedule, then filters classes of the selected date.

3\.      The system merges payment\_transactions and reception\_payments, removing duplicates of the same member, membership or amount within 10 minutes.

4\.      Collected revenue \= sum of completed transactions (PAID / COMPLETED).

5\.      New members \= accounts with role MEMBER created on the selected date.

6\.      Fill rate \= total booked seats ÷ total maximum seats of that day’s classes.

7\.      The system groups completed payments by method and lists all transactions of the day.

8\.      The Manager can export the KPIs to a CSV file.

**Abnormal Cases:**

•         If there is no data for the date, the system shows zero values and empty tables.

•         If the API fails, an error message is displayed.

**Related APIs:**

•         GET /api/v1/receptionist/report?date={date}

•         GET /api/v1/bookings/receptionist-schedule?weekStart={date}

#### **4.2. Personnel Approval Feature** {#4.2.-personnel-approval-feature}

##### ***4.2.1. View Facilities and Update Facility Status***

**Function Trigger**

The Manager opens /admin/facilities and changes a facility’s status.

**Function Description**

This function lets the Manager open or close a facility. The status is synchronized to sibling facilities, public facility pages and linked sports courts.

**Screen Layout**

****

**Function Details**

1\.      The system lists facilities with sport, capacity and status.

2\.      The Manager selects AVAILABLE or MAINTENANCE.

3\.      MAINTENANCE: linked courts are deactivated. If no maintenance window is active, the system creates a lock window from now to one month later.

4\.      AVAILABLE: linked courts are reactivated and future maintenance windows are removed.

5\.      Public facility pages are updated to match.

**Abnormal Cases:**

•         Status other than AVAILABLE / MAINTENANCE → 400\.

•         Facility not found → 404\.

•         Non-manager → 403\.

**Related APIs:**

•         GET /api/v1/manager/facilities

•         GET /api/v1/manager/domain-sports

•         PATCH /api/v1/manager/facilities/{facilityId}/status

##### ***4.2.2. Create, Update and Cancel Class Sessions***

**Function Trigger**

The Manager creates, edits or cancels a group class session.

**Function Description**

This function schedules recurring weekly group classes with coach and facility assignment, and notifies affected users of any change.

**Screen Layout**

****

****

****

**Function Details**

**A. Create**

1\.      The Manager enters class name, sport, coach, facility, start/end time, maximum slots, price and number of weekly occurrences.

2\.      The system validates: class name required (max 100 characters); start time in the future and end time after start time; max slots ≥ 1; price ≥ 0; occurrences 1–52.

3\.      The facility must be AVAILABLE and belong to the selected sport. The coach must have role COACH.

4\.      For every occurrence, the system checks that neither the coach nor the facility has an overlapping session.

5\.      Sessions are created with status SCHEDULED and 0 booked slots.

**B. Update**

1\.      The Manager changes any field (name, coach, facility, time, slots, price, status).

2\.      The system notifies the coach and all members with BOOKED / CONFIRMED bookings.

**C. Cancel**

1\.      The Manager cancels a session with a reason.

2\.      The session becomes CANCELLED, and its active bookings are CANCELLED.

3\.      Linked payments are marked REFUNDED.

4\.      The coach and members are notified.

**Abnormal Cases:**

•         Facility under maintenance → 409\.

•         Coach or facility schedule conflict → 409\.

•         Invalid data → 400\.

•         Session not found → 404\.

**Related APIs:**

•         GET /api/v1/manager/class-sessions

•         POST /api/v1/manager/class-sessions

•         PUT /api/v1/manager/class-sessions/{sessionId}

•         DELETE /api/v1/manager/class-sessions/{sessionId}?reason=

#### **4.3. Court Maintenance Management** {#4.3.-court-maintenance-management}

##### *4.3.1. Create Extend and Delete Court Maintenance*

**Function Trigger**

The Manager opens /admin/maintenance and schedules, extends or deletes a maintenance window.

**Function Description**

Maintenance windows block bookings on a court. The court is closed automatically while the window is active and reopened when it ends. Affected members are notified.

**Screen Layout**

**

**Function Details**

1\.      The system lists courts and maintenance windows with status SCHEDULED, IN\_PROGRESS or COMPLETED.

2\.      Create: the Manager selects a court, start/end time and reason. End time must be after start time.

3\.      The system synchronizes court status. If the window is active now, the court is deactivated.

4\.      The system finds overlapping court bookings and class bookings and notifies each member. Members may reschedule for free or cancel without penalty (full refund).

5\.      Extend: the new end time must be later than the current end time. The reason is appended, and affected members are notified again.

6\.      Delete: the window is removed. If the court was closed by that window, it is reopened.

7\.      A scheduler re-synchronizes all courts every 60 seconds.

8\.      During a window, quote, checkout and check-in are blocked, and no-show penalties are not applied.

9\.      Every action writes an audit log (MAINTENANCE\_CREATED / EXTENDED / DELETED).

**Abnormal Cases:**

•         Missing court or time → 400\.

•         End time not after start time / new end not after current end → 400\.

•         Court or window not found → 404\.

**Related APIs:**

•         GET /api/v1/manager/courts

•         GET /api/v1/manager/maintenance

•         POST /api/v1/manager/maintenance

•         PUT /api/v1/manager/maintenance/{id}/extend

•         DELETE /api/v1/manager/maintenance/{id}

##### ***4.3.2. Update Court Status Manually***

**Function Trigger**

The Manager toggles a court active or inactive.

**Function Description**

Manage the operational status (enabled/disabled) of a court (PATCH /api/v1/manager/courts/{id}/status). The system automatically synchronizes this with the public-facing page, removes maintenance schedules upon reactivation, and will not automatically re-enable a court that has been manually locked (COURT\_STATUS\_UPDATED).

**Screen Layout**

**

**Function Details**

1\.      The system updates the court’s active flag and synchronizes linked facilities and public pages.

2\.      Activating a court removes its future maintenance windows.

3\.      A manually closed court is never reopened automatically.

4\.      The action is audit-logged (COURT\_STATUS\_UPDATED).

**Abnormal Cases:**

* 404 Not Found (COURT\_NOT\_FOUND): The court ID does not exist or has been deleted.  
* 400 Bad Request (INVALID\_STATUS): The submitted data is missing or the status format is incorrect.  
* 403 Forbidden (ACCESS\_DENIED): The account lacks the required Manager permissions.  
* 500 Internal Error (SYNC\_FAILED): A system error or data synchronization failure occurred.

**Related APIs:**

•         PATCH /api/v1/manager/courts/{id}/status

#### **4.4. Membership Package Management** {#4.4.-membership-package-management}

##### ***4.4.1. Create, Update and Activate/Deactivate Packages***

**Function Trigger**

The Manager opens /admin/packages and creates, edits or toggles a package.

**Function Description**

This function maintains the package catalog. Only ACTIVE packages are shown to members and sold at the counter.

**Screen Layout**

**

**

**

**Function Details**

1\.      The system lists all packages, newest first.

2\.      The Manager enters name, sport (optional), price, duration in days, access type, description and status.

3\.      The system validates: name required (max 100 characters); price \> 0 (max 10 digits, 2 decimal places); duration \> 0 days; access type ALL\_DAY, PEAK or OFF\_PEAK; status ACTIVE or INACTIVE; the selected sport must exist.

4\.      The Manager can switch a package between ACTIVE and INACTIVE.

5\.      Existing memberships are not affected by package changes.

**Abnormal Cases:**

•         Invalid data → 400\.

•         Package not found → 404\.

**Related APIs:**

•         GET /api/v1/manager/packages

•         GET /api/v1/manager/sports

•         POST /api/v1/manager/packages

•         PUT /api/v1/manager/packages/{packageId}

•         PATCH /api/v1/manager/packages/{packageId}/status

#### **4.5. Voucher Management** {#4.5.-voucher-management}

##### ***4.5.1. Create, Update, Toggle and Delete Vouchers***

**Function Trigger**

The Manager opens the Vouchers tab in /admin/packages.

**Function Description**

This function manages promotional codes applied to bookings or packages.

**Screen Layout**

**

**

**Function Details**

1\.      The Manager enters code, discount type (PERCENT / FIXED), value, minimum purchase, usage limit, valid from/until, scope (ALL, BOOKING\_ONLY, MEMBERSHIP\_ONLY) and status.

2\.      The code is converted to uppercase and must be unique.

3\.      Defaults: type PERCENT, minimum purchase 0, usage limit 100, valid from today, valid until today \+ 3 months, scope ALL, status ACTIVE.

4\.      The Manager can edit any field, toggle ACTIVE / INACTIVE, or delete a voucher.

5\.      When a voucher is applied, the system checks: status ACTIVE, today within the validity dates, used count below the usage limit, minimum purchase met and scope matched.

6\.      A percent discount (0–100%) is capped by the maximum discount amount if one is set. The discount never exceeds the order amount.

7\.      The used count increases when the voucher is applied. If the payment fails or the unpaid booking is cancelled, the count is released.

**Abnormal Cases:**

•         Empty code → 400\.

•         Duplicate code → 409\.

•         Voucher not found → 404\.

**Related APIs:**

•         GET /api/v1/manager/vouchers

•         POST /api/v1/manager/vouchers

•         PUT /api/v1/manager/vouchers/{id}

•         PATCH /api/v1/manager/vouchers/{id}/toggle-status

•         DELETE /api/v1/manager/vouchers/{id}

•         POST /api/v1/vouchers/validate

#### **4.6. Approvals Center** {#4.6.-approvals-center}

##### ***4.6.1. Approve or Reject Membership Activation***

**Function Trigger**

The Manager opens the Pending Memberships tab in /admin/staff-approvals.

**Function Description**

This function activates paid membership packages or rejects them with an automatic full refund request.

**Screen Layout**

**

**Function Details**

1\.      The system lists memberships in PENDING\_APPROVAL with member, package, price, payment method and reference code.

2\.      Only paid memberships can be approved or rejected.

3\.      Approve: status becomes ACTIVE; start date is today, or the day after an active package of the same renewal group ends; end date \= start \+ duration − 1; session and court quotas are initialized from the package; the member is notified and audit MEMBERSHIP\_APPROVED is written.

4\.      Reject: a reason is required (default "Không đạt yêu cầu duyệt"); status becomes REJECTED and a 100% refund request (PENDING\_APPROVAL) is created; the member is notified and audit MEMBERSHIP\_REJECTED is written.

**Abnormal Cases:**

•         Not in PENDING / PENDING\_APPROVAL → 400\.

•         Not paid → 409\.

•         Package not found → 404\.

**Related APIs:**

•         GET /api/v1/manager/memberships/pending

•         PATCH /api/v1/manager/memberships/{membershipId}/approve

•         PATCH /api/v1/manager/memberships/{membershipId}/reject

##### ***4.6.2. Approve or Reject Refund Requests***

**Function Trigger**

The Manager opens the Refund Requests tab.

**Function Description**

This function executes refunds through the VNPay Refund API and finalizes related bookings or memberships (see Process 4).

**Screen Layout**

**

**Function Details**

1\.      The system lists all refund requests, newest first.

2\.      Only requests in PENDING\_APPROVAL can be decided.

3\.      Reject: a decision note is required. Status becomes REJECTED.

4\.      Approve: the original transaction must be PAID, belong to the same member and equal the refund amount. The system re-checks usage: court not CHECKED\_IN / NO\_SHOW, class not yet marked, package with no used or held quota.

5\.      For VNPay payments, the system calls the VNPay Refund API (transaction type 02, TxnRef, TransactionNo, TransactionDate, exact amount) and verifies the response signature.

6\.      Response 00 (or cash payment): payment and gateway receipt become REFUNDED, the request becomes APPROVED, and the linked booking or membership is CANCELLED.

7\.      Any other response: the request stays PENDING\_APPROVAL with the note "gateway reconciliation required".

8\.      The member is notified, and audit REFUND\_DECIDED is written.

**Abnormal Cases:**

•         Request already processed → 409\.

•         Missing note on rejection → 400\.

•         Original transaction invalid / booking already used → 409\.

**Related APIs:**

•         GET /api/v1/manager/refunds

•         POST /api/v1/manager/refunds/{id}/decision

##### ***4.6.3. Approve Coach Leave and Reassign Sessions***

**Function Trigger**

The Manager opens the Coach Leave & Reassign tab.

**Function Description**

This function approves or rejects coach leave requests and reassigns affected sessions to a substitute coach.

**Screen Layout**

**

**Function Details**

1\.      The system lists coach leave requests. Only PENDING requests can be decided.

2\.      If the leave period contains active sessions, approval requires a substitute coach.

3\.      The substitute must be an ACTIVE coach other than the requester, have no overlapping sessions, be available in the session time, and have taught the sport before or have a specialty matching the sport.

4\.      On approval, all sessions in the leave period are reassigned. Affected members and both coaches are notified, and audit COACH\_LEAVE\_REASSIGNED is written.

5\.      Rejection requires a reason. The coach is notified, and audit COACH\_LEAVE\_REJECTED is written.

**Abnormal Cases:**

•         Already processed → 409\.

•         Missing substitute or substitute conflict → 409\.

•         Invalid substitute → 400\.

•         Missing rejection reason → 400\.

**Related APIs:**

•         GET /api/v1/manager/coach-leave-requests

•         POST /api/v1/manager/coach-leave-requests/{id}/decision

##### ***4.6.4. Approve or Reject Staff Registrations***

**Function Trigger**

The Manager opens the Staff Registrations tab.

**Function Description**

This feature allows a Manager to view a list of employee accounts awaiting approval (PENDING) and either approve (/approve) or reject (/reject) them. Upon approval, the account status changes to ACTIVE; upon rejection, it changes to INACTIVE. The system will return a 409 Conflict error if the account has already been processed or does not hold the employee role.

**Screen Layout**

****

****

**Function Details**

1\.      The system lists PENDING accounts with staff roles.

2\.      Approve → status ACTIVE. Reject → status INACTIVE.

**Abnormal Cases:**

•         Already processed or not a staff role → 409\.

**Related APIs:**

•         GET /api/v1/manager/staff-registrations

•         PATCH /api/v1/manager/staff-registrations/{userId}/approve

•         PATCH /api/v1/manager/staff-registrations/{userId}/reject

#### **4.7. Payment Reconciliation** {#4.7.-payment-reconciliation}

##### ***4.7.1. Refund Excess VNPay Payments***

**Function Trigger**

The Manager receives an excess-payment notification and opens /admin/payment-reconciliation.

**Function Description**

This function refunds duplicate gateway payments without affecting the original order.

**Screen Layout**

**

**Function Details**

1\.      If VNPay reports a second successful payment for an order already PAID or REFUNDED, the system stores it as an EXCESS receipt.

2\.      No benefit is granted twice. The member and all Managers are notified.

3\.      The page lists receipts in EXCESS or REVIEW\_REQUIRED.

4\.      The Manager refunds an EXCESS receipt. The system refunds only that receipt’s amount through VNPay and never touches the original order.

5\.      Response 00 → receipt REFUNDED. Otherwise → REVIEW\_REQUIRED, with no automatic resend.

6\.      Audit EXCESS\_PAYMENT\_REFUND is written.

**Abnormal Cases:**

•         Receipt not EXCESS → 409\.

•         Missing gateway transaction date → 409\.

**Related APIs:**

•         GET /api/v1/manager/payment-reconciliation

•         POST /api/v1/manager/payment-reconciliation/{id}/refund

#### **4.8. Broadcast Notices** {#4.8.-broadcast-notices}

##### ***4.8.1. Send Broadcast Notification***

**Function Trigger**

The Manager opens /admin/broadcast and sends an announcement.

**Screen Layout**

**

**Function Details**

1\.      The Manager enters a title, a message and an audience (ALL, MEMBER, COACH, RECEPTIONIST).

2\.      The system sends an in-app notification (type BROADCAST) to every ACTIVE user of that audience. Manager and Admin accounts are excluded.

3\.      The system returns the number of recipients and writes audit BROADCAST\_SENT.

**Abnormal Cases:**

•         Empty title or message → 400\.

**Related APIs:**

•         POST /api/v1/manager/broadcast

#### **4.9. User, Member and Staff Management** {#4.9.-user,-member-and-staff-management}

##### ***4.9.1. Manage Users and Members***

**Function Trigger**

The Manager opens /admin/staff or /admin/members.

**Screen Layout**

**

**Function Details**

1\.      Search users by keyword and role, paged (maximum 50 per page).

2\.      Search members by keyword and status (ACTIVE, PENDING, LOCKED, INACTIVE).

3\.      Lock / unlock: only MEMBER accounts. Lock requires ACTIVE status, unlock requires LOCKED status. A Manager cannot lock themselves or any Manager/Admin.

4\.      Create account (any role): full name, email, phone, password and role are required; name and email max 100 characters, phone max 15, valid email, password ≥ 8 characters; email must not already exist.

5\.      The new account is ACTIVE with a forced password change, and a temporary password is emailed.

**Abnormal Cases:**

•         Invalid page / role / status → 400\.

•         Duplicate email → 409\.

•         Locking a Manager → 403\.

**Related APIs:**

•         GET /api/v1/manager/users

•         GET /api/v1/manager/members

•         PATCH /api/v1/manager/members/{userId}/lock

•         PATCH /api/v1/manager/members/{userId}/unlock

•         POST /api/v1/manager/users

##### ***4.9.2. View Staff Performance***

**Function Trigger**

The Manager opens the KPI tab in /admin/staff.

**Function Description**

Allow managers to view staff performance reports under the KPI tab (GET /api/v1/manager/staff-performance). The system aggregates data based on roles: Instructors (number of sessions taught, number of students, revenue, average rating of 5.0, and a commission of 40% of session revenue, with a minimum of 200,000 VND per session) and Receptionists (number of check-ins and POS revenue).

**Screen Layout**

****

****

**Function Details**

1\.      Coaches: sessions taught, students, revenue and average rating (default 5.0). Commission \= 40% of session revenue, minimum 200,000 VND per session.

2\.      Receptionists: check-ins processed and POS sales.

**Related APIs:**

•         GET /api/v1/manager/staff-performance

#### **4.10. System Governance** {#4.10.-system-governance}

##### ***4.10.1. Settings, AI Configuration, Audit Logs and Support Tickets***

**Function Trigger**

The Manager opens /admin/settings or /admin/audit-logs.

**Screen Layout**

**

**

**Function Details**

1\.      The Manager views and saves system policies and the RBAC permission matrix (stored as JSON in system\_settings).

2\.      The Manager configures the AI assistant: enabled flag, model, temperature, system prompt.

3\.      The system shows the latest 200 audit log records.

4\.      The Manager replies to member tickets. Status defaults to RESOLVED, and the member is notified.

5\.      Every change is audit-logged (UPDATE\_SETTINGS, UPDATE\_AI\_CONFIG, SUPPORT\_TICKET\_REPLIED).

**Related APIs:**

•         GET/PUT /api/v1/manager/settings

•         GET/PUT /api/v1/manager/ai-config

•         GET /api/v1/manager/audit-logs

•         GET /api/v1/manager/tickets

        •         POST /api/v1/manager/tickets/{id}/reply

#### **4.11 Business Rules Summary**  {#4.11-business-rules-summary}

| Rule ID | Business Rule |
| ----- | ----- |
| BR-MGR-01 | Only ROLE\_MANAGER / ROLE\_ADMIN can access /api/v1/manager/\*\*. |
| BR-MGR-02 | Facility status is AVAILABLE or MAINTENANCE and is synchronized to linked courts and public pages. |
| BR-MGR-03 | Class sessions: 1–52 weekly occurrences, future start, available facility of the same sport, no coach or facility overlap. |
| BR-MGR-04 | Maintenance end must be after start. An extension must be later than the current end. Overlapping bookings are notified. |
| BR-MGR-05 | Courts are closed and reopened by maintenance every 60 seconds. Manually closed courts are never reopened automatically. |
| BR-MGR-06 | Package price \> 0, duration \> 0, access type ALL\_DAY / PEAK / OFF\_PEAK. Only ACTIVE packages are sold. |
| BR-MGR-07 | Voucher codes are unique and uppercase. They are usable only when ACTIVE, within validity dates, under the usage limit, meeting minimum purchase and scope. |
| BR-MGR-08 | Memberships can be approved or rejected only when PENDING\_APPROVAL and paid. Rejection auto-creates a 100% refund request. |
| BR-MGR-09 | Refunds are full-amount only. Rejection requires a note. A VNPay refund must return code 00 before the payment becomes REFUNDED. |
| BR-MGR-10 | A refund is blocked if the court was checked in, the class was marked, or package quota was used or held. |
| BR-MGR-11 | Leave approval with affected sessions requires a valid substitute coach (active, no overlap, available, sport expertise). |
| BR-MGR-12 | Excess receipts are refunded individually. An unconfirmed result becomes REVIEW\_REQUIRED and is never resent automatically. |
| BR-MGR-13 | Broadcasts reach only ACTIVE non-manager users of the selected audience. |
| BR-MGR-14 | Only MEMBER accounts can be locked. A Manager cannot lock themselves or other Managers / Admins. |
| BR-MGR-15 | Manager-created accounts are ACTIVE with a forced password change, and a temporary password is emailed. |
| BR-MGR-16 | All approval, maintenance, refund, broadcast and configuration actions are audit-logged. |

## **III. Database Design** {#iii.-database-design}

### **1\. Database Schema** {#1.-database-schema}

**Table Description**

| No | Table | Description |
| :---- | :---- | :---- |
| 1 | users | Stores central user identity data, system roles, and status. |
| 2 | member\_health\_profiles | Contains medical details, emergency contacts, and physical readiness notes for members. |
| 3 | sports | Catalog of available sports disciplines managed by the facility. |
| 4 | facilities | Master records for physical venues, complexes, and locations. |
| 5 | sports\_courts | Sub-units within facilities assigned to specific sports. |
| 6 | vouchers | Promotional codes, discounts, and gift voucher definitions. |
| 7 | membership\_packages | Available recurring subscription tiers, costs, and durations. |
| 8 | user\_memberships | Active and historical member plan subscriptions. |
| 9 | class\_sessions | Scheduled group fitness classes and coaching sessions. |
| 10 | bookings | Core header record for all facility, class, and resource reservations. |
| 11 | payment\_transactions | Financial audit trail for all paid bookings, memberships, and fees. |
| 12 | court\_bookings | Detailed slot assignments linking reservations to specific sports courts. |
| 13 | equipments | Master inventory list of sports hardware available for rental or use. |
| 14 | equipment\_loans | Transactional records tracking equipment checkout and return. |
| 15 | coach\_leave\_requests | Time-off and availability exemption tracking for instructional staff. |
| 16 | refund\_requests | Workflow records for member refund applications and approvals. |
| 17 | audit\_logs | Immutable system event and change data trail for compliance. |
| 18 | auth\_sessions | Active JWT refresh tokens and device session states. |
| 19 | verification\_tokens | Single-use tokens for email validation and password resets. |
| 20 | class\_enrollments | Junction table mapping members to specific class sessions. |
| 21 | facility\_schedules | Operating hours and recurring maintenance windows for venues. |
| 22 | voucher\_usages | Redemption logs tracking individual voucher claims per user. |

### **2\. Table Detail** {#2.-table-detail}

**User**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | user\_id | INT |  | Yes | Yes | PK | Auto-increment identifier |
| 2 | email | VARCHAR | 255 | Yes | Yes |  | User login email address |
| 3 | password\_hash | VARCHAR | 255 | No | Yes |  | Hashed password |
| 4 | first\_name  | VARCHAR | 50 | No | Yes |  | User's given name  |
| 5 | last\_name  | VARCHAR | 50 | No | Yes |  | User's family name / surname  |
| 6 | phone\_number | VARCHAR | 20 | No | No |  | Contact phone number |
| 7 | Status | ENUM |  | No | Yes |  | Options: 'ACTIVE', 'SUSPENDED', 'PENDING'  |
| 8 | role | ENUM |  | No | Yes |  | 'admin', 'staff', 'coach', 'member' |
| 9 | created\_at | TIMESTAMP |  | No | Yes |  | Creation timestamp |

**member\_health\_profiles**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | id | INT |  | Yes | Yes | PK | Primary key |
| 2 | user\_id | INT |  | Yes | Yes | FK | References users(user\_id) |
| 3 | date\_of\_birth  | DATE  |  | No | Yes  |  | Used for age verification and eligibility  |
| 4 | emergency\_contact\_name  | VARCHAR  | 100 | No | Yes |  | Emergency point of contact name  |
| 5 | emergency\_contact\_phone  | VARCHAR  | 20 | No | Yes |  | Direct contact phone for emergency  |
| 6 | medical\_conditions  | TEXT  |  | No | No |  | Known allergies, chronic conditions, or restrictions  |

**Sports**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | sport\_id | INT |  | Yes | Yes | PK | Sport identifier |
| 2 | sport\_name | VARCHAR | 100 | Yes | Yes |  | Name of the sport |
| 3 | slug  | VARCHAR  | 50 | Yes | Yes |  | URL-friendly identifier string  |
| 4 | description | TEXT |  | No | No |  | Detailed description |

**facilities**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | facility\_id | INT |  | Yes | Yes | PK | Unique identifier for physical facility  |
| 2 | facility\_name | VARCHAR | 100 | No | Yes |  | Venue name (e.g., Downtown Sports Complex)  |
| 3 | city  | VARCHAR | 50 | No | Yes |  | Municipality or city name  |
| 4 | status  | ENUM  |  | No | Yes |  | Options: 'OPERATIONAL', 'MAINTENANCE', 'CLOSED'  |

**sports\_courts**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | court\_id | INT |  | Yes | Yes | PK | Court identifier |
| 2 | facility\_id | INT |  | No | Yes | FK | References facilities(facility\_id) |
| 3 | sport\_id | INT |  | No | Yes | FK | References sports(sport\_id) |
| 4 | court\_name | VARCHAR | 50 | No | Yes |  | Court name/number |
| 5 | hourly\_rate | DECIMAL | 10,2 | No | Yes |  | Hourly rental cost |
| 6 | status  | ENUM  |  | No | Yes |  | Options: 'AVAILABLE', 'BOOKED', 'MAINTENANCE'  |

**vouchers**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | voucher\_id | INT |  | Yes | Yes | PK | Voucher identifier |
| 2 | code | VARCHAR | 50 | Yes | Yes |  | Unique promo code |
| 3 | discount\_percent | DECIMAL | 5,2 | No | Yes |  | Discount percentage value |
| 4 | valid\_until | DATE |  | No | Yes |  | Expiration date |

**membership\_packages**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | package\_id | INT | 11 | Yes | Yes | PK | Package identifier |
| 2 | package\_name | VARCHAR | 100 | No | Yes |  | Package title |
| 3 | price | DECIMAL | 10,2 | No | Yes |  | Package cost |
| 4 | duration\_days | INT | 11 | No | Yes |  | Validity duration in days |

**user\_memberships**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | user\_membership\_id | INT | 11 | Yes | Yes | PK | User membership record ID |
| 2 | user\_id | INT | 11 | No | Yes | FK | References users(user\_id) |
| 3 | package\_id | INT | 11 | No | Yes | FK | References membership\_packages(package\_id) |
| 4 | start\_date | DATE |  | No | Yes |  | Start date of active subscription |
| 5 | end\_date | DATE |  | No | Yes |  | Expiration date of subscription |
| 6 | status | ENUM |  | No | Yes |  | 'active', 'expired', 'cancelled' |

**class\_sessions**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | class\_id | INT | 11 | Yes | Yes | PK | Class session identifier |
| 2 | coach\_id | INT | 11 | No | Yes | FK | References users(user\_id) |
| 3 | court\_id | INT | 11 | No | Yes | FK | References sports\_courts(court\_id) |
| 4 | title | VARCHAR | 100 | No | Yes |  | Title of class |
| 5 | start\_time | DATETIME |  | No | Yes |  | Session start datetime |
| 6 | end\_time | DATETIME |  | No | Yes |  | Session end datetime |
| 7 | max\_capacity | INT | 11 | No | Yes |  | Maximum allowed participants |

**bookings**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | booking\_id | INT |  | Yes | Yes | PK | Booking identifier |
| 2 | user\_id | INT |  | No | Yes | FK | References users(user\_id) |
| 3 | class\_id | INT |  | No | No | FK | References class\_sessions(class\_id) |
| 4 | voucher\_id | INT |  | No | No | FK | References vouchers(voucher\_id) |
| 5 | total\_amount | DECIMAL | 10,2 | No | Yes |  | Total price after discounts |
| 6 | status | ENUM |  | No | Yes |  | 'pending', 'confirmed', 'cancelled' |
| 7 | created\_at | TIMESTAMP |  | No | Yes |  | Booking creation time |

**court\_bookings**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | court\_booking\_id | INT | 11 | Yes | Yes | PK | Court booking record ID |
| 2 | booking\_id | INT | 11 | No | Yes | FK | References bookings(booking\_id) |
| 3 | court\_id | INT | 11 | No | Yes | FK | References sports\_courts(court\_id) |
| 4 | start\_time | DATETIME |  | No | Yes |  | Court reservation start time |
| 5 | end\_time | DATETIME |  | No | Yes |  | Court reservation end time |

**payment\_transactions**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | transaction\_id | INT | 11 | Yes | Yes | PK | Payment transaction ID |
| 2 | booking\_id | INT | 11 | No | No | FK | References bookings(booking\_id) |
| 3 | user\_membership\_id | INT | 11 | No | No | FK | References user\_memberships(user\_membership\_id) |
| 4 | amount | DECIMAL | 10,2 | No | Yes |  | Transaction amount |
| 5 | payment\_method | ENUM |  | No | Yes |  | 'credit\_card', 'bank\_transfer', 'e\_wallet' |
| 6 | status | ENUM |  | No | Yes |  | 'successful', 'failed', 'pending' |
| 7 | created\_at | TIMESTAMP |  | No | Yes |  | Transaction timestamp |

**equipments**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | equipment\_id | INT | 11 | Yes | Yes | PK | Equipment item ID |
| 2 | facility\_id | INT | 11 | No | Yes | FK | References facilities(facility\_id) |
| 3 | equipment\_name | VARCHAR | 100 | No | Yes |  | Name of equipment |
| 4 | total\_quantity | INT | 11 | No | Yes |  | Total inventory quantity |
| 5 | available\_quantity | INT | 11 | No | Yes |  | Currently available count |

**equipment\_loans**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | loan\_id | INT | 11 | Yes | Yes | PK | Loan record ID |
| 2 | booking\_id | INT | 11 | No | Yes | FK | References bookings(booking\_id) |
| 3 | equipment\_id | INT | 11 | No | Yes | FK | References equipments(equipment\_id) |
| 4 | quantity | INT | 11 | No | Yes |  | Quantity borrowed |
| 5 | returned | BOOLEAN |  | No | Yes |  | Return status flag |

**coach\_leave\_requests**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | request\_id | INT | 11 | Yes | Yes | PK | Leave request identifier |
| 2 | coach\_id | INT | 11 | No | Yes | FK | References users(user\_id) |
| 3 | start\_date | DATE |  | No | Yes |  | Leave start date |
| 4 | end\_date | DATE |  | No | Yes |  | Leave end date |
| 5 | reason | TEXT |  | No | No |  | Reason for leave request |
| 6 | status | ENUM |  | No | Yes |  | 'pending', 'approved', 'rejected' |

**refund\_requests**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | refund\_id | INT | 11 | Yes | Yes | PK | Refund request ID |
| 2 | transaction\_id | INT | 11 | No | Yes | FK | References payment\_transactions(transaction\_id) |
| 3 | reason | TEXT |  | No | No |  | Reason for requesting refund |
| 4 | status | ENUM |  | No | Yes |  | 'pending', 'approved', 'rejected' |

**audit\_logs**

| \# | Field name | Type | Size | Unique | Not Null | PK/FK | Notes |
| :---: | ----- | ----- | ----- | :---: | :---: | :---: | ----- |
| 1 | log\_id | INT | 11 | Yes | Yes | PK | Audit log entry ID |
| 2 | user\_id | INT | 11 | No | No | FK | References users(user\_id) |
| 3 | action | VARCHAR | 100 | No | Yes |  | Action name/description |
| 4 | created\_at  | TIMESTAMP |  | No | Yes |  | Log timestamp |
