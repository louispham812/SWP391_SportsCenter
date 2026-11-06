# Graph Report - SWP391_SportsCenter  (2026-11-06)

## Corpus Check
- 348 files · ~274,895 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 3, .example 2, .properties 2)

## Summary
- 2091 nodes · 7571 edges · 113 communities (50 shown, 63 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 602 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `67c65a2e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- helpers.js
- MemberProfileController.java
- apiRequest
- AiAssistantService.java
- App.jsx
- BusinessRulesValidationTest.java
- CoachSchedulePage.jsx
- CoachStudentsPage.jsx
- EngagementService
- MembershipPackageRepository
- BookingRepository
- ManagerController
- .getDailyReport
- MemberBookingFlowPage.jsx
- CoachLeaveController
- org.springframework.security.core.Authentication
- list
- Voucher
- react
- org.springframework.transaction.annotation.Transactional
- ReceptionistController
- CoachProfileController
- lombok.NoArgsConstructor
- org.junit.jupiter.api.Test
- CHI TIẾT 23 QUY TẮC NGHIỆP VỤ
- CourtBooking
- localdatetime
- FacilityCourtSyncService
- BookingServiceTest
- SecurityConfig.java
- EquipmentController
- Booking
- UserRepository
- VNPayWebhookController.java
- ClassSession
- PaymentService
- MemberTransactionsPage.jsx
- AuthController
- .notifyUser
- WorkoutProgressController
- .checkout
- AuthService
- MemberSchedulePage.jsx
- Facility
- BookingService
- block-pr-to-main.yml
- org.springframework.http.ResponseEntity
- .findByEmailIgnoreCase
- PaymentTransaction.java
- BearerTokenAuthenticationFilter.java
- .requireManager
- AuthSession
- AuditLog
- org.springframework.web.bind.annotation.GetMapping
- EquipmentLoan
- BusinessRulesValidationTest
- BookingFlowController
- SecurityConfigTest.java
- VerificationTokenRepository
- DatabaseConnectionTest
- VNPayGateway
- AdminDashboardPage.jsx
- BookingService.java
- Feedback
- .createUser
- .searchMembers
- BodyProgressLog
- ReceptionClassesPage.jsx
- Equipment
- Notification
- SupportTicket
- WorkoutPlan
- 🎬 2. KỊCH BẢN DEMO LIÊN THÔNG 7 LUỒNG NGHIỆP VỤ (THEO ĐÚNG TRÌNH TỰ CHẤM FINAL)
- CheckInController
- .createTicket
- SystemSetting
- 🏆 SportHub - Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng (SWP391)
- PackageController
- EmailServiceTest
- .createClassSession
- PaymentController
- MembershipStatus
- 📊 SportHub - Bảng Theo Dõi Tiến Độ Dự Án (Progress Tracking)
- React + Vite
- Runtime Validation Report
- BackendApplication.java
- CoachPublicProfileResponse
- .oxlintrc.json
- 📋 2. Chi Tiết Thực Hiện Theo User Stories & Requirements
- 🎯 4. Các Phân Quyền & Hệ Thống 31+ Tính Năng Hoàn Chỉnh
- VNPayWebhookController
- BookingType
- PackageType
- PaymentStatus
- PaymentGatewayException
- RefundProcessingException
- 🧪 4. Kết Quả Kiểm Thử Nghiệm Thu (Quality Assurance)
- 🚀 7. Hướng Dẫn Khởi Chạy Dự Án (Setup Guide)
- CourtSlotResponse
- .getQuote
- CoachStudentBookingResponse
- workspace.globals.yaml
- workspace
- archive_legacy_sql/README.md
- BearerTokenAuthenticationFilterTest.java
- activate-hooks.sh script
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `apiRequest()` - 140 edges
2. `UserRepository` - 90 edges
3. `useApp()` - 74 edges
4. `react` - 71 edges
5. `BookingService` - 70 edges
6. `User` - 56 edges
7. `BookingRepository` - 56 edges
8. `EngagementService` - 55 edges
9. `App()` - 52 edges
10. `Booking` - 46 edges

## Surprising Connections (you probably didn't know these)
- `1. Kiểm thử Backend (`mvn clean test`):` --references--> `DatabaseConnectionTest`  [INFERRED]
  PROGRESS_TRACKING.md → backend/src/test/java/com/sporthub/backend/DatabaseConnectionTest.java
- `🧪 8. Kiểm Thử & Đảm Bảo Chất Lượng (Testing & Defense Audit)` --references--> `DatabaseConnectionTest`  [INFERRED]
  README.md → backend/src/test/java/com/sporthub/backend/DatabaseConnectionTest.java
- `1. Kiểm thử Backend (`mvn clean test`):` --references--> `AiAssistantServiceTest`  [INFERRED]
  PROGRESS_TRACKING.md → backend/src/test/java/com/sporthub/backend/service/AiAssistantServiceTest.java
- `🧪 8. Kiểm Thử & Đảm Bảo Chất Lượng (Testing & Defense Audit)` --references--> `AiAssistantServiceTest`  [INFERRED]
  README.md → backend/src/test/java/com/sporthub/backend/service/AiAssistantServiceTest.java
- `1. Kiểm thử Backend (`mvn clean test`):` --references--> `BookingServiceTest`  [INFERRED]
  PROGRESS_TRACKING.md → backend/src/test/java/com/sporthub/backend/service/BookingServiceTest.java

## Import Cycles
- None detected.

## Communities (113 total, 63 thin omitted)

### Community 0 - "helpers.js"
Cohesion: 0.05
Nodes (43): loginCoach(), loginManager(), loginMember(), loginReceptionist(), logoutMember(), readMemberTestData(), testDataPath, dependencies (+35 more)

### Community 1 - "MemberProfileController.java"
Cohesion: 0.06
Nodes (11): AvatarUpdateRequest, CoachProfileUpdateRequest, MemberHealthProfileRequest, MemberMembershipResponse, MemberPackagePurchaseResponse, MemberProfileRequest, MembershipQuotaResponse, MemberTransactionResponse (+3 more)

### Community 2 - "apiRequest"
Cohesion: 0.09
Nodes (58): CreateUserModal(), TableSkeleton(), AdminLayout(), AdminAuditLogPage(), AdminBroadcastPage(), AUDIENCES, AdminFacilitiesPage(), emptySession (+50 more)

### Community 3 - "AiAssistantService.java"
Cohesion: 0.08
Nodes (9): AiAssistantController, AssistantChatRequest, AssistantMessageRequest, AssistantResponse, CoachPlanRequest, MemberHealthProfile, MemberHealthProfileRepository, AiAssistantService (+1 more)

### Community 4 - "App.jsx"
Cohesion: 0.10
Nodes (40): App(), RequireRole(), QrCodeSvg(), ReceptionistLayout(), ToastContainer(), AppContext, AppProvider(), getAuthSession() (+32 more)

### Community 6 - "CoachSchedulePage.jsx"
Cohesion: 0.10
Nodes (39): NotificationList(), TYPE_ICON, CoachLayout(), parseNotifications(), PortalLayout(), CoachDashboardPage(), dateKey(), formatTime() (+31 more)

### Community 7 - "CoachStudentsPage.jsx"
Cohesion: 0.14
Nodes (33): FormattedAiText(), renderInlineFormatting(), Pagination(), CardGridSkeleton(), MemberLayout(), CoachStudentsPage(), formatDateTime(), MemberAIAssistantPage() (+25 more)

### Community 8 - "EngagementService"
Cohesion: 0.10
Nodes (9): RefundRequestController, CreateRefundRequest, PaymentTransaction, ReceptionPaymentRepository, EngagementService, BookingPaymentHandler, ClassBookingPaymentHandler, CourtBookingPaymentHandler (+1 more)

### Community 9 - "MembershipPackageRepository"
Cohesion: 0.10
Nodes (10): MembershipPackage, RefundRequest, UserMembership, MembershipPackageRepository, RefundRequestRepository, UserMembershipRepository, MembershipService, RefundService (+2 more)

### Community 10 - "BookingRepository"
Cohesion: 0.12
Nodes (13): FacilityManagementController, UpdateClassSessionRequest, BookingRepository, ClassSessionRepository, CourtBookingRepository, CourtMaintenanceRepository, PaymentTransactionRepository, PublicFacilityRepository (+5 more)

### Community 11 - "ManagerController"
Cohesion: 0.12
Nodes (5): ManagerController, PackageStatusRequest, ManagerMemberResponse, ManagerPackageRequest, PendingStaffRegistrationResponse

### Community 12 - ".getDailyReport"
Cohesion: 0.07
Nodes (11): MemberAttendanceRecordResponse, MemberAttendanceSummaryResponse, MemberCheckInResponse, MemberCourtBookingAttendanceResponse, RecentCheckInItem, ReceptionistDashboardOverviewResponse, TodayClassItem, PaymentMethodTotal (+3 more)

### Community 13 - "MemberBookingFlowPage.jsx"
Cohesion: 0.16
Nodes (31): PaymentMethodSelector(), BookingConfirmationPage(), BookingHome(), CheckoutPage(), ClassPicker(), CoachPicker(), CourtPicker(), ErrorNotice() (+23 more)

### Community 14 - "CoachLeaveController"
Cohesion: 0.10
Nodes (7): CoachLeaveController, CoachLeaveRequestDTO, CreateLeaveRequest, LeaveDecisionRequest, CoachLeaveRequest, CoachLeaveRequestRepository, CoachLeaveWorkflowTest

### Community 15 - "org.springframework.security.core.Authentication"
Cohesion: 0.18
Nodes (4): BroadcastRequest, EngagementController, FeedbackRequest, MaintenanceRequest

### Community 17 - "Voucher"
Cohesion: 0.09
Nodes (5): VoucherController, ValidateVoucherRequest, ValidateVoucherResponse, VoucherResponse, Voucher

### Community 18 - "react"
Cohesion: 0.20
Nodes (20): Footer(), Navbar(), AboutPage(), LandingPage(), formatPrice(), PricingPage(), PublicContentPage(), API_BASE_URL (+12 more)

### Community 19 - "org.springframework.transaction.annotation.Transactional"
Cohesion: 0.16
Nodes (3): MemberProfileController, MemberPackagePurchaseRequest, MemberProfileResponse

### Community 20 - "ReceptionistController"
Cohesion: 0.14
Nodes (10): AvatarUpdateRequest, EmergencyContactRequest, PaymentEntry, ReceptionistController, RfidUpdateRequest, ReceptionistCheckInRequest, ReceptionistCheckInResponse, ReceptionistMembershipSaleRequest (+2 more)

### Community 21 - "CoachProfileController"
Cohesion: 0.15
Nodes (6): CoachProfileController, CoachFeedbackDTO, CoachIncomeResponse, SessionIncomeDetail, CoachProfileResponse, CoachSendNoticeRequest

### Community 22 - "lombok.NoArgsConstructor"
Cohesion: 0.26
Nodes (11): CancelBookingResponse, ChangePasswordRequest, CheckInResponse, FacilityDTO, ForgotPasswordRequest, PaymentConfirmationResult, ResendOtpRequest, ResetPasswordRequest (+3 more)

### Community 24 - "CHI TIẾT 23 QUY TẮC NGHIỆP VỤ"
Cohesion: 0.07
Nodes (26): BR-01: Khởi tạo tài khoản & Xác thực người dùng (Account Creation & User Authentication), BR-02: Phân loại & Đặc tính 3 nhóm gói tập (Package Classification & Specification), BR-03: Điều kiện mở bán Khóa lớp & Cơ chế giữ chỗ (Course Class Sale & Seat Reservation), BR-04: Quy trình phê duyệt kích hoạt gói tập & Nâng hạng hội viên (Package Activation Approval & VIP Tiering), BR-05: Vòng đời gói, Quản lý Quota & Xử lý hết hạn (Package Lifecycle, Quota & Expiry Policy), BR-06: Quy tắc Gia hạn gói tập & Nối tiếp thời hạn (Membership Renewal & Continuity Rules), BR-07: Giữ chỗ tạm thời & Chống trùng lịch (Temporary Hold & Anti-Conflict Booking), BR-08: Thứ tự ưu tiên xét quyền lợi & Khấu trừ Quota (Entitlement Priority & Quota Deduction Order) (+18 more)

### Community 25 - "CourtBooking"
Cohesion: 0.13
Nodes (5): RegisterRequest, CourtBooking, PublicFacility, PublicSport, Sport

### Community 30 - "EquipmentController"
Cohesion: 0.14
Nodes (5): EquipmentController, BorrowEquipmentRequest, EquipmentLoanResponse, EquipmentResponse, ReturnEquipmentRequest

### Community 32 - "UserRepository"
Cohesion: 0.20
Nodes (7): MemberCheckInRepository, UserRepository, AuditLogService, CheckInService, EmailService, ReceptionistControllerTest, VNPayRefundTest

### Community 33 - "VNPayWebhookController.java"
Cohesion: 0.19
Nodes (3): PublicContentController, CoachScheduleEntryResponse, RosterBookingResponse

### Community 36 - "MemberTransactionsPage.jsx"
Cohesion: 0.17
Nodes (14): formatDateTime(), formatVnd(), ReceiptModal(), formatRefCode(), formatVnd(), getItemTypeIcon(), getItemTypeLabel(), RefundRequestModal() (+6 more)

### Community 39 - "WorkoutProgressController"
Cohesion: 0.20
Nodes (4): BodyLogRequest, ClassPlanRequest, PlanRequest, WorkoutProgressController

### Community 42 - "MemberSchedulePage.jsx"
Cohesion: 0.22
Nodes (16): ScheduleSkeleton(), formatMoney(), formatTime(), getDateKey(), getWeekDays(), MemberSchedulePage(), startOfWeek(), WEEKDAYS (+8 more)

### Community 43 - "Facility"
Cohesion: 0.18
Nodes (4): FacilityController, Facility, FacilityRepository, FacilityService

### Community 45 - "block-pr-to-main.yml"
Cohesion: 0.11
Nodes (17): if, runs-on, steps, GH_TOKEN, PR_URL, jobs, block-pr, name (+9 more)

### Community 55 - "BusinessRulesValidationTest"
Cohesion: 0.16
Nodes (5): SupportTicketController, CreateTicketRequest, RefundDecisionRequest, PublicSportRepository, BusinessRulesValidationTest

### Community 56 - "BookingFlowController"
Cohesion: 0.26
Nodes (3): BookingFlowController, ClassSessionResponse, MemberScheduleEntryResponse

### Community 61 - "AdminDashboardPage.jsx"
Cohesion: 0.31
Nodes (11): StatCardSkeleton(), AdminDashboardPage(), dateString(), formatPrice(), formatTime(), startOfWeekString(), currency(), ReceptionShiftReportPage() (+3 more)

### Community 62 - "BookingService.java"
Cohesion: 0.19
Nodes (6): PaymentConstants, AttendanceStatus, EXCUSED_ABSENCE, PENDING, PRESENT, UNEXCUSED_ABSENCE

### Community 67 - "ReceptionClassesPage.jsx"
Cohesion: 0.33
Nodes (10): CoachAttendancePage(), formatDateTime(), mondayOf(), ReceptionClassesPage(), time(), toDateKey(), getSessionRoster(), getUpcomingClasses() (+2 more)

### Community 72 - "🎬 2. KỊCH BẢN DEMO LIÊN THÔNG 7 LUỒNG NGHIỆP VỤ (THEO ĐÚNG TRÌNH TỰ CHẤM FINAL)"
Cohesion: 0.18
Nodes (11): 🔑 1. BẢNG TÀI KHOẢN DEMO CHUẨN BỊ TRƯỚC HỘI ĐỒNG, 🎬 2. KỊCH BẢN DEMO LIÊN THÔNG 7 LUỒNG NGHIỆP VỤ (THEO ĐÚNG TRÌNH TỰ CHẤM FINAL), ⚡ 3. LỆNH CHẠY KIỂM THỬ TỰ ĐỘNG TRƯỚC HỘI ĐỒNG (LIVE VERIFICATION COMMANDS), 🏆 KỊCH BẢN KIỂM THỬ & DEMO BẢO VỆ ĐỒ ÁN FINAL (FULL-STACK E2E DEFENSE SCRIPT), 🌟 LUỒNG 1: Quản Trị Gói Tập & Voucher $\rightarrow$ Hội Viên Mua Gói $\rightarrow$ Admin Duyệt Kích Hoạt, 🎾 LUỒNG 2: Đặt Sân Trực Tuyến, Chiết Khấu VIP + Áp Mã Voucher & Hủy Lịch Hoàn Tiền 100%, 🛎️ LUỒNG 3: Quầy Lễ Tân: Check-in QR/RFID, Bán Hàng POS In Hóa Đơn K80, Mượn/Trả Đồ & Kết Ca, 🏋️ LUỒNG 4: Huấn Luyện Viên Điểm Danh, Giao Giáo Án PT, Học Viên Tập Luyện & Đánh Giá 5 Sao (+3 more)

### Community 76 - "🏆 SportHub - Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng (SWP391)"
Cohesion: 0.20
Nodes (10): 🌟 1. Giới Thiệu Dự Án, 💻 2. Công Nghệ Sử Dụng (Tech Stack), 📁 3. Cấu Trúc Thư Mục Dự Án, 🗄️ 5. Kiến Trúc Cơ Sở Dữ Liệu (Database Architecture), 🔑 6. Tài Khoản Dùng Thử (Demo Accounts), 🧪 8. Kiểm Thử & Đảm Bảo Chất Lượng (Testing & Defense Audit), 🌿 9. Bảng Tiến Độ & Quy Trình Git, Bảng tóm tắt 21 bảng CSDL: (+2 more)

### Community 82 - "MembershipStatus"
Cohesion: 0.25
Nodes (7): MembershipStatus, ACTIVE, CANCELLED, EXPIRED, PENDING_APPROVAL, PENDING_PAYMENT, REJECTED

### Community 83 - "📊 SportHub - Bảng Theo Dõi Tiến Độ Dự Án (Progress Tracking)"
Cohesion: 0.29
Nodes (5): 📈 1. Tổng Quan Tiến Độ Các Phân Hệ (Module Progress), 🗄️ 3. Tình Trạng Cơ Sở Dữ Liệu (Database Status), 🚀 5. Kết Luận & Sẵn Sàng Bảo Vệ, 📊 SportHub - Bảng Theo Dõi Tiến Độ Dự Án (Progress Tracking), Đồ án Tốt nghiệp SWP391 - Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng

### Community 84 - "React + Vite"
Cohesion: 0.29
Nodes (6): Authentication API, Booking browser tests, Expanding the Oxlint configuration, Public home-page content, React Compiler, React + Vite

### Community 85 - "Runtime Validation Report"
Cohesion: 0.29
Nodes (6): Environment, Issues Found and Fixed, Runtime Validation Report, Summary, Test Data Retained, Test Evidence

### Community 88 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 89 - "📋 2. Chi Tiết Thực Hiện Theo User Stories & Requirements"
Cohesion: 0.33
Nodes (6): 📋 2. Chi Tiết Thực Hiện Theo User Stories & Requirements, 👤 A. Phân Hệ Hội Viên (Member) - `100% DONE`, 🛎️ B. Phân Hệ Lễ Tân (Receptionist) - `100% DONE`, 🏋️ C. Phân Hệ Huấn Luyện Viên (Coach) - `100% DONE`, 👔 D. Phân Hệ Quản Lý & Giám Đốc (Manager / Director) - `100% DONE`, 🛡️ E. Phân Hệ Quản Trị Viên (Admin) - `100% DONE`

### Community 90 - "🎯 4. Các Phân Quyền & Hệ Thống 31+ Tính Năng Hoàn Chỉnh"
Cohesion: 0.33
Nodes (6): 1. 👤 Phân Hệ Hội Viên (Member), 2. 🛎️ Phân Hệ Lễ Tân (Receptionist), 3. 🏋️ Phân Hệ Huấn Luyện Viên (Coach), 🎯 4. Các Phân Quyền & Hệ Thống 31+ Tính Năng Hoàn Chỉnh, 4. 👔 Phân Hệ Quản Lý & Giám Đốc (Manager / Director), 5. 🛡️ Phân Hệ Quản Trị Viên (Admin)

### Community 92 - "BookingType"
Cohesion: 0.40
Nodes (4): BookingType, CLASS, COURT, PT

### Community 93 - "PackageType"
Cohesion: 0.40
Nodes (4): PackageType, CLASS, PT, VIP

### Community 94 - "PaymentStatus"
Cohesion: 0.40
Nodes (4): PaymentStatus, PAID, REFUNDED, UNPAID

### Community 97 - "🧪 4. Kết Quả Kiểm Thử Nghiệm Thu (Quality Assurance)"
Cohesion: 0.40
Nodes (5): 1. Kiểm thử Backend (`mvn clean test`):, 2. Kiểm thử Tự động E2E Playwright (`npx playwright test`):, 3. Kiểm thử Frontend (`npm run build`):, 4. Kiểm thử Tích hợp Thực tế (Integration & End-to-End Defense Audit):, 🧪 4. Kết Quả Kiểm Thử Nghiệm Thu (Quality Assurance)

### Community 98 - "🚀 7. Hướng Dẫn Khởi Chạy Dự Án (Setup Guide)"
Cohesion: 0.40
Nodes (5): 🚀 7. Hướng Dẫn Khởi Chạy Dự Án (Setup Guide), Bước 1: Khởi tạo Cơ sở dữ liệu SQL Server, Bước 2: Khởi chạy Backend (Spring Boot API), Bước 3: Khởi chạy Frontend (React + Vite), Yêu cầu tiên quyết:

## Knowledge Gaps
- **19 isolated node(s):** `PENDING`, `PRESENT`, `EXCUSED_ABSENCE`, `UNEXCUSED_ABSENCE`, `COURT` (+14 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 468 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `UserRepository` connect `UserRepository` to `MemberProfileController.java`, `BusinessRulesValidationTest.java`, `EngagementService`, `MembershipPackageRepository`, `BookingRepository`, `ManagerController`, `.getDailyReport`, `CoachLeaveController`, `org.springframework.security.core.Authentication`, `list`, `org.springframework.transaction.annotation.Transactional`, `ReceptionistController`, `CoachProfileController`, `org.junit.jupiter.api.Test`, `BookingServiceTest`, `SecurityConfig.java`, `EquipmentController`, `WorkoutProgressController`, `AuthService`, `BookingService`, `.findByEmailIgnoreCase`, `BearerTokenAuthenticationFilter.java`, `EquipmentLoan`, `BusinessRulesValidationTest`, `SecurityConfigTest.java`, `DatabaseConnectionTest`, `BookingService.java`, `.createUser`, `.searchMembers`, `BodyProgressLog`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `PENDING`, `PRESENT`, `EXCUSED_ABSENCE` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `helpers.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05442428730099963 - nodes in this community are weakly interconnected._
- **Why does `BookingServiceTest` connect `BookingServiceTest` to `UserRepository`, `🧪 4. Kết Quả Kiểm Thử Nghiệm Thu (Quality Assurance)`, `ClassSession`, `PaymentService`, `BusinessRulesValidationTest.java`, `MembershipPackageRepository`, `BookingRepository`, `BookingService`, `🏆 SportHub - Hệ Thống Quản Lý Trung Tâm Thể Thao Đa Năng (SWP391)`, `.cancelCourtBooking`, `CoachProfileController`, `BusinessRulesValidationTest`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `MemberProfileController.java` be split into smaller, more focused modules?**
  _Cohesion score 0.05868544600938967 - nodes in this community are weakly interconnected._
- **Why does `BookingService` connect `BookingService` to `BusinessRulesValidationTest.java`, `EngagementService`, `MembershipPackageRepository`, `BookingRepository`, `org.springframework.transaction.annotation.Transactional`, `CoachProfileController`, `CourtBooking`, `BookingServiceTest`, `Booking`, `UserRepository`, `VNPayWebhookController.java`, `ClassSession`, `PaymentService`, `.checkout`, `Facility`, `org.springframework.web.bind.annotation.GetMapping`, `BusinessRulesValidationTest`, `BookingFlowController`, `VNPayGateway`, `BookingService.java`, `.cancelCourtBooking`, `CoachPublicProfileResponse`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Should `apiRequest` be split into smaller, more focused modules?**
  _Cohesion score 0.09109730848861283 - nodes in this community are weakly interconnected._