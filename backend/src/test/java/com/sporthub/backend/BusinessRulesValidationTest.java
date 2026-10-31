package com.sporthub.backend;

import com.sporthub.backend.controller.*;
import com.sporthub.backend.dto.*;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.enums.AttendanceStatus;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BusinessRulesValidationTest {

    private UserRepository userRepository;
    private AuthSessionRepository sessionRepository;
    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    private UserMembershipRepository userMembershipRepository;
    private MembershipPackageRepository packageRepository;
    private PublicSportRepository sportRepository;
    private EngagementService engagementService;
    private RefundRequestRepository refundRequestRepository;
    private PaymentTransactionRepository paymentTransactionRepository;
    private MembershipService membershipService;
    private ManagerController managerController;

    private BookingRepository bookingRepository;
    private ClassSessionRepository classSessionRepository;
    private BookingService bookingService;

    private CoachLeaveRequestRepository coachLeaveRequestRepository;
    private CoachLeaveController coachLeaveController;

    private EquipmentRepository equipmentRepository;
    private EquipmentLoanRepository equipmentLoanRepository;
    private EquipmentController equipmentController;

    private ReceptionPaymentRepository receptionPaymentRepository;
    private RefundRequestController refundRequestController;

    private SupportTicketRepository supportTicketRepository;
    private SupportTicketController supportTicketController;

    private UsernamePasswordAuthenticationToken managerAuth;
    private UsernamePasswordAuthenticationToken receptionistAuth;
    private UsernamePasswordAuthenticationToken coachAuth;
    private UsernamePasswordAuthenticationToken memberAuth;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        sessionRepository = mock(AuthSessionRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        VerificationTokenRepository verificationTokenRepository = mock(VerificationTokenRepository.class);
        EmailService emailService = mock(EmailService.class);
        AuditLogService auditLogService = mock(AuditLogService.class);

        authService = new AuthService(
                userRepository, sessionRepository, verificationTokenRepository,
                passwordEncoder, emailService, auditLogService
        );

        userMembershipRepository = mock(UserMembershipRepository.class);
        packageRepository = mock(MembershipPackageRepository.class);
        sportRepository = mock(PublicSportRepository.class);
        engagementService = mock(EngagementService.class);
        refundRequestRepository = mock(RefundRequestRepository.class);
        paymentTransactionRepository = mock(PaymentTransactionRepository.class);
        membershipService = mock(MembershipService.class);

        managerController = new ManagerController(
                userRepository, packageRepository, sportRepository, passwordEncoder,
                emailService, auditLogService, authService, membershipService
        );

        bookingRepository = mock(BookingRepository.class);
        classSessionRepository = mock(ClassSessionRepository.class);
        CourtBookingRepository courtBookingRepository = mock(CourtBookingRepository.class);
        CourtMaintenanceRepository courtMaintenanceRepository = mock(CourtMaintenanceRepository.class);
        SportsCourtRepository sportsCourtRepository = mock(SportsCourtRepository.class);
        PublicFacilityRepository publicFacilityRepository = mock(PublicFacilityRepository.class);

        bookingService = new BookingService(
                bookingRepository,
                classSessionRepository,
                userRepository,
                publicSportRepositoryMock(),
                publicFacilityRepository,
                sportsCourtRepository,
                courtBookingRepository,
                courtMaintenanceRepository,
                paymentTransactionRepository,
                userMembershipRepository,
                packageRepository,
                membershipService,
                auditLogService
        );

        coachLeaveRequestRepository = mock(CoachLeaveRequestRepository.class);
        coachLeaveController = new CoachLeaveController(
                coachLeaveRequestRepository, userRepository, classSessionRepository, bookingRepository, engagementService
        );

        equipmentRepository = mock(EquipmentRepository.class);
        equipmentLoanRepository = mock(EquipmentLoanRepository.class);
        equipmentController = new EquipmentController(equipmentRepository, equipmentLoanRepository, userRepository);

        receptionPaymentRepository = mock(ReceptionPaymentRepository.class);
        refundRequestController = new RefundRequestController(
                refundRequestRepository, userRepository, paymentTransactionRepository, receptionPaymentRepository, engagementService
        );

        supportTicketRepository = mock(SupportTicketRepository.class);
        supportTicketController = new SupportTicketController(supportTicketRepository, userRepository, engagementService);

        managerAuth = new UsernamePasswordAuthenticationToken("1", "", List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));
        receptionistAuth = new UsernamePasswordAuthenticationToken("2", "", List.of(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")));
        coachAuth = new UsernamePasswordAuthenticationToken("3", "", List.of(new SimpleGrantedAuthority("ROLE_COACH")));
        memberAuth = new UsernamePasswordAuthenticationToken("4", "", List.of(new SimpleGrantedAuthority("ROLE_MEMBER")));
    }

    private PublicSportRepository publicSportRepositoryMock() {
        return mock(PublicSportRepository.class);
    }

    // =========================================================================
    // 1. AuthService - BR-02: Password complexity & Phone validation
    // =========================================================================

    @Test
    void authRegisterRejectsWeakPasswordWithoutUppercaseOrDigit() {
        RegisterRequest reqNoUpper = new RegisterRequest();
        reqNoUpper.setFullName("Nguyen Van Test");
        reqNoUpper.setEmail("test1@sporthub.com");
        reqNoUpper.setPhone("0987654321");
        reqNoUpper.setPassword("alllowercase123");

        RegisterRequest reqNoDigit = new RegisterRequest();
        reqNoDigit.setFullName("Nguyen Van Test");
        reqNoDigit.setEmail("test2@sporthub.com");
        reqNoDigit.setPhone("0987654321");
        reqNoDigit.setPassword("NoDigitPassword!");

        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () -> authService.register(reqNoUpper));
        assertTrue(ex1.getMessage().contains("BR-02") || ex1.getMessage().contains("chữ in hoa"));

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () -> authService.register(reqNoDigit));
        assertTrue(ex2.getMessage().contains("BR-02") || ex2.getMessage().contains("chữ số"));
    }

    @Test
    void authRegisterRejectsInvalidPhoneFormat() {
        RegisterRequest req = new RegisterRequest();
        req.setFullName("Nguyen Van Test");
        req.setEmail("test_phone@sporthub.com");
        req.setPhone("123abc456");
        req.setPassword("ValidPass@123");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> authService.register(req));
        assertTrue(ex.getMessage().contains("Số điện thoại không hợp lệ"));
    }

    @Test
    void authRegisterSucceedsWithValidCredentials() {
        RegisterRequest req = new RegisterRequest();
        req.setFullName("Nguyen Van Valid");
        req.setEmail("valid@sporthub.com");
        req.setPhone("0912345678");
        req.setPassword("ValidPass@123");

        when(userRepository.existsByEmailIgnoreCase("valid@sporthub.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(88L);
            return u;
        });

        AuthResponse res = authService.register(req);
        assertNotNull(res);
        assertEquals("MEMBER", res.getRole());
        assertEquals("Nguyen Van Valid", res.getFullName());
    }

    // =========================================================================
    // 2. ManagerController - BR-03 & BR-04 (MGR-23)
    // =========================================================================

    @Test
    void managerCannotLockManagerAdminOrThemselves() {
        User targetManager = User.builder().userId(10L).role("MANAGER").status("ACTIVE").build();
        User targetAdmin = User.builder().userId(11L).role("ADMIN").status("ACTIVE").build();

        // 1. Cannot lock themselves (managerAuth has ID = 1)
        ResponseStatusException exSelf = assertThrows(ResponseStatusException.class,
                () -> managerController.lockMember(1L, managerAuth));
        assertEquals(HttpStatus.BAD_REQUEST, exSelf.getStatusCode());
        assertTrue(exSelf.getReason().contains("BR-03"));

        // 2. Cannot lock another manager
        when(userRepository.findById(10L)).thenReturn(Optional.of(targetManager));
        ResponseStatusException exMgr = assertThrows(ResponseStatusException.class,
                () -> managerController.lockMember(10L, managerAuth));
        assertEquals(HttpStatus.FORBIDDEN, exMgr.getStatusCode());
        assertTrue(exMgr.getReason().contains("BR-03"));

        // 3. Cannot lock admin
        when(userRepository.findById(11L)).thenReturn(Optional.of(targetAdmin));
        ResponseStatusException exAdmin = assertThrows(ResponseStatusException.class,
                () -> managerController.lockMember(11L, managerAuth));
        assertEquals(HttpStatus.FORBIDDEN, exAdmin.getStatusCode());
        assertTrue(exAdmin.getReason().contains("BR-03"));
    }

    @Test
    void managerCanApprovePendingMembership() {
        UserMembership membership = new UserMembership();
        membership.setMembershipId(50L);
        membership.setUserId(4L);
        membership.setPackageId(1L);
        membership.setStatus("PENDING");

        MembershipPackage pkg = new MembershipPackage();
        pkg.setPackageId(1L);
        pkg.setName("Gói VIP Diamond");
        pkg.setDurationDays(30);

        when(userRepository.findByEmailIgnoreCase("1")).thenReturn(Optional.of(User.builder().userId(1L).role("MANAGER").build()));

        MembershipQuotaResponse approved = managerController.approveMembership(50L, managerAuth);
        assertNotNull(approved);
        assertEquals(50L, approved.membershipId());

        verify(membershipService).approveMembership(eq(50L), eq(1L));
    }

    @Test
    void managerCanRejectPendingMembershipAndTriggerRefund() {
        when(userRepository.findByEmailIgnoreCase("1")).thenReturn(Optional.of(User.builder().userId(1L).role("MANAGER").build()));

        String rejected = managerController.rejectMembership(51L, "Thông tin thanh toán không khớp", managerAuth);
        assertNotNull(rejected);

        verify(membershipService).rejectMembership(eq(51L), eq("Thông tin thanh toán không khớp"), eq(1L));
    }

    // =========================================================================
    // 3. BookingService - BR-14 (Attendance Role Restrictions)
    // =========================================================================

    @Test
    void receptionistCannotMarkInitialAttendanceWhenPending() {
        Booking booking = new Booking();
        booking.setBookingId(101L);
        booking.setSessionId(201L);
        booking.setMemberId(4L);
        booking.setStatus("BOOKED");
        booking.setAttendanceStatus(AttendanceStatus.PENDING);

        ClassSession session = ClassSession.builder().sessionId(201L).coachId(3L).className("Pickleball K01").build();

        when(bookingRepository.findById(101L)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findById(201L)).thenReturn(Optional.of(session));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> bookingService.updateAttendance(101L, 2L, "RECEPTIONIST", "PRESENT", "Diem danh"));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("BR-14"));
    }

    @Test
    void receptionistCanEditAlreadyMarkedAttendance() {
        Booking booking = new Booking();
        booking.setBookingId(102L);
        booking.setSessionId(202L);
        booking.setMemberId(4L);
        booking.setStatus("BOOKED");
        booking.setAttendanceStatus(AttendanceStatus.PRESENT); // Already marked!

        ClassSession session = ClassSession.builder().sessionId(202L).coachId(3L).className("Pickleball K02").build();

        when(bookingRepository.findById(102L)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findById(202L)).thenReturn(Optional.of(session));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking updated = bookingService.updateAttendance(102L, 2L, "RECEPTIONIST", "EXCUSED_ABSENCE", "Có giấy phép");
        assertEquals(AttendanceStatus.EXCUSED_ABSENCE, updated.getAttendanceStatus());
        assertTrue(updated.getCoachNote().contains("[Vắng có phép]"));
    }

    // =========================================================================
    // 4. CoachLeaveController - BR-16 (MGR-24)
    // =========================================================================

    @Test
    void managerCannotRejectCoachLeaveWithoutDecisionNote() {
        CoachLeaveRequest req = CoachLeaveRequest.builder()
                .requestId(60L)
                .coachId(3L)
                .coachName("Coach Minh")
                .status("PENDING")
                .build();

        when(coachLeaveRequestRepository.findById(60L)).thenReturn(Optional.of(req));

        LeaveDecisionRequest decisionEmptyNote = new LeaveDecisionRequest(false, 0L, "   ");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> coachLeaveController.decideLeaveRequest(60L, decisionEmptyNote, managerAuth));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("BR-16"));
    }

    // =========================================================================
    // 5. EquipmentController - BR-17 (REC-24 Overdue Loans)
    // =========================================================================

    @Test
    void equipmentLoansAutomaticallyMarkOverdueWhenPastSevenDays() {
        EquipmentLoan normalLoan = EquipmentLoan.builder()
                .loanId(1L)
                .status("BORROWED")
                .loanedAt(LocalDateTime.now().minusDays(2))
                .build();

        EquipmentLoan overdueLoan = EquipmentLoan.builder()
                .loanId(2L)
                .status("BORROWED")
                .loanedAt(LocalDateTime.now().minusDays(9)) // > 7 days ago!
                .build();

        when(equipmentLoanRepository.findAllByOrderByLoanedAtDesc()).thenReturn(List.of(normalLoan, overdueLoan));

        var response = equipmentController.getLoans();
        assertNotNull(response.getBody());
        assertEquals("BORROWED", normalLoan.getStatus());
        assertEquals("OVERDUE", overdueLoan.getStatus());
        verify(equipmentLoanRepository).saveAll(any());
    }

    // =========================================================================
    // 6. RefundRequestController - BR-20 (MGR-16)
    // =========================================================================

    @Test
    void refundRequestRejectsNegativeAmountOrExceedingPaidAmount() {
        User member = User.builder().userId(4L).fullName("Member A").build();
        when(userRepository.findById(4L)).thenReturn(Optional.of(member));

        // 1. Amount <= 0
        CreateRefundRequest zeroReq = new CreateRefundRequest(
                1L, "REF-001", "Tennis Booking", BigDecimal.ZERO, "Ly do test", "Vietcombank", "123456", "A"
        );
        ResponseStatusException exZero = assertThrows(ResponseStatusException.class,
                () -> refundRequestController.createRefundRequest(zeroReq, memberAuth));
        assertEquals(HttpStatus.BAD_REQUEST, exZero.getStatusCode());

        // 2. Amount > Paid Amount
        PaymentTransaction tx = new PaymentTransaction();
        tx.setPaymentId(1L);
        tx.setAmount(new BigDecimal("200000"));
        tx.setPaymentStatus("PAID");
        when(paymentTransactionRepository.findById(1L)).thenReturn(Optional.of(tx));

        CreateRefundRequest exceedReq = new CreateRefundRequest(
                1L, "REF-001", "Tennis Booking", new BigDecimal("500000"), "Muon hoan nhieu hon", "Vietcombank", "123456", "A"
        );
        ResponseStatusException exExceed = assertThrows(ResponseStatusException.class,
                () -> refundRequestController.createRefundRequest(exceedReq, memberAuth));
        assertEquals(HttpStatus.BAD_REQUEST, exExceed.getStatusCode());
        assertTrue(exExceed.getReason().contains("BR-20"));
    }

    @Test
    void refundRequestCannotRejectWithoutDecisionNote() {
        RefundRequest refund = RefundRequest.builder()
                .refundId(77L)
                .status("PENDING")
                .refundAmount(new BigDecimal("100000"))
                .build();
        when(refundRequestRepository.findById(77L)).thenReturn(Optional.of(refund));

        RefundDecisionRequest emptyNoteDecision = new RefundDecisionRequest(false, "   ");
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> refundRequestController.decideRefund(77L, emptyNoteDecision, managerAuth));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("BR-20"));
    }

    // =========================================================================
    // 7. SupportTicketController - BR-15 (MEM-18)
    // =========================================================================

    @Test
    void supportTicketRejectsTooShortTitleOrDescription() {
        User member = User.builder().userId(4L).fullName("Member A").build();
        when(userRepository.findById(4L)).thenReturn(Optional.of(member));

        CreateTicketRequest shortTitle = new CreateTicketRequest("ATTENDANCE", "Ngắn", "Mô tả đủ dài hơn 10 ký tự", "NORMAL");
        ResponseStatusException exTitle = assertThrows(ResponseStatusException.class,
                () -> supportTicketController.createTicket(shortTitle, memberAuth));
        assertEquals(HttpStatus.BAD_REQUEST, exTitle.getStatusCode());
        assertTrue(exTitle.getReason().contains("BR-15"));

        CreateTicketRequest shortDesc = new CreateTicketRequest("ATTENDANCE", "Tiêu đề hợp lệ", "Quá ngắn", "NORMAL");
        ResponseStatusException exDesc = assertThrows(ResponseStatusException.class,
                () -> supportTicketController.createTicket(shortDesc, memberAuth));
        assertEquals(HttpStatus.BAD_REQUEST, exDesc.getStatusCode());
        assertTrue(exDesc.getReason().contains("BR-15"));
    }
}
