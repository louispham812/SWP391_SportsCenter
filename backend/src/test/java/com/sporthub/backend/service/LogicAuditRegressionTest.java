package com.sporthub.backend.service;

import com.sporthub.backend.controller.*;
import com.sporthub.backend.dto.*;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.enums.PackageType;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.gateway.VNPayGateway;
import com.sporthub.backend.service.payment.MembershipPaymentHandler;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class LogicAuditRegressionTest {
    static UsernamePasswordAuthenticationToken actor(String role) { return new UsernamePasswordAuthenticationToken("9", "", List.of(new SimpleGrantedAuthority("ROLE_" + role))); }
    static UserMembership membership() {
        UserMembership m = new UserMembership(); m.setMembershipId(1L); m.setUserId(9L); m.setPackageId(2L);
        m.setStatus("ACTIVE"); m.setStartDate(LocalDate.now().minusDays(1)); m.setEndDate(LocalDate.now());
        m.setInitialQuotaCourts(10); m.setRemainingQuotaCourts(9); m.setHeldQuotaCourts(1);
        m.setInitialQuotaSessions(5); m.setRemainingQuotaSessions(5); return m;
    }

    @Test void invalidPaymentMethodCannotCreatePaidTransaction() {
        var repo = mock(PaymentTransactionRepository.class);
        assertThrows(ResponseStatusException.class, () -> new PaymentService(repo).createPayment(9L, "COURT", BigDecimal.TEN, "SANDBOX"));
        verifyNoInteractions(repo);
    }
    @Test void cashWaitsForCollectionAndInternalQuotaCannotPayANonzeroAmount() {
        var repo = mock(PaymentTransactionRepository.class); when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        PaymentService service = new PaymentService(repo);
        assertEquals("PENDING", service.createPayment(9L, "COURT", BigDecimal.TEN, "CASH").getPaymentStatus());
        assertThrows(ResponseStatusException.class, () -> service.createPayment(9L, "COURT", BigDecimal.TEN, "MEMBERSHIP_QUOTA"));
        assertEquals("PAID", service.createPayment(9L, "CLASS", BigDecimal.ZERO, "MEMBERSHIP_QUOTA").getPaymentStatus());
    }
    @Test void finalValidDayWorksAndFutureTermCannotBeSpentEarly() {
        var repo = mock(UserMembershipRepository.class); var packages = mock(MembershipPackageRepository.class); var m = membership();
        when(repo.findByUserIdAndStatus(9L, "ACTIVE")).thenReturn(List.of(m));
        when(packages.findById(2L)).thenReturn(Optional.of(MembershipPackage.builder().packageType(PackageType.VIP).build()));
        var service = new MembershipService(repo, packages, null, null, null);
        assertSame(m, service.getActiveMembershipWithCourtQuota(9L, 1));
        assertSame(m, service.getActiveMembershipWithQuota(9L, 1, "CLASS", 4L));
        m.setStartDate(LocalDate.now().plusDays(1)); m.setEndDate(LocalDate.now().plusDays(31));
        assertNull(service.getActiveMembershipWithCourtQuota(9L, 1));
    }
    @Test void ptEntitlementCannotBeUsedForAnotherSportOrForAClass() {
        var repo = mock(UserMembershipRepository.class); var packages = mock(MembershipPackageRepository.class); var m = membership();
        when(repo.findByUserIdAndStatus(9L, "ACTIVE")).thenReturn(List.of(m));
        when(packages.findById(2L)).thenReturn(Optional.of(MembershipPackage.builder().packageType(PackageType.PT).sportId(4L).build()));
        var service = new MembershipService(repo, packages, null, null, null);
        assertNull(service.getActiveMembershipWithQuota(9L, 1, "CLASS", 4L));
        assertNull(service.getActiveMembershipWithQuota(9L, 1, "PT", 5L));
        assertSame(m, service.getActiveMembershipWithQuota(9L, 1, "PT", 4L));
    }
    @Test void duplicateQuotaReleaseFailsInsteadOfCreatingNegativeHold() {
        var repo = mock(UserMembershipRepository.class); var m = membership(); when(repo.findByIdForUpdate(1L)).thenReturn(Optional.of(m));
        var service = new MembershipService(repo, mock(MembershipPackageRepository.class), null, null, null);
        service.releaseCourtQuota(1L, 1);
        assertThrows(ResponseStatusException.class, () -> service.releaseCourtQuota(1L, 1));
        assertEquals(10, m.getRemainingQuotaCourts()); assertEquals(0, m.getHeldQuotaCourts());
    }
    @Test void quotaFormulaRejectsNegativeComponentsEvenWhenTheirSumMatches() {
        var m = membership(); m.setHeldQuotaCourts(-1); m.setRemainingQuotaCourts(11);
        var service = new MembershipService(mock(UserMembershipRepository.class), mock(MembershipPackageRepository.class), null, null, null);
        assertThrows(IllegalStateException.class, () -> service.validateCourtQuotaFormula(m));
    }
    @Test void pendingStaffCannotActivateByRequestingRegistrationOtp() {
        var users = mock(UserRepository.class); var tokens = mock(VerificationTokenRepository.class); var email = mock(EmailService.class);
        when(users.findByEmailIgnoreCase("audit@example.test")).thenReturn(Optional.of(User.builder().userId(9L).role("RECEPTIONIST").status("PENDING").build()));
        var service = new AuthService(users, mock(AuthSessionRepository.class), tokens, mock(PasswordEncoder.class), email, mock(AuditLogService.class));
        assertThrows(IllegalArgumentException.class, () -> service.resendOtp(new ResendOtpRequest("audit@example.test")));
        verifyNoInteractions(tokens, email);
    }
    @Test void publicRegistrationIgnoresRequestedStaffRole() {
        var users = mock(UserRepository.class); when(users.save(any())).thenAnswer(i -> { User u = i.getArgument(0); u.setUserId(9L); return u; });
        var service = new AuthService(users, mock(AuthSessionRepository.class), mock(VerificationTokenRepository.class), mock(PasswordEncoder.class), mock(EmailService.class), mock(AuditLogService.class));
        AuthResponse result = service.register(new RegisterRequest("Audit Member", "audit@example.test", "0901234567", "Audit@12345", "RECEPTIONIST"));
        assertEquals("MEMBER", result.getRole()); assertEquals("PENDING", result.getStatus());
    }
    @Test void wrongRegistrationOtpCommitsItsAttemptCountThroughSpringTransactionProxy() {
        var users = mock(UserRepository.class); var tokens = mock(VerificationTokenRepository.class);
        when(users.findByEmailIgnoreCase("audit@example.test")).thenReturn(Optional.of(User.builder().userId(9L).role("MEMBER").status("PENDING").build()));
        VerificationToken token = VerificationToken.builder().failedAttempts(0).locked(false).tokenHash("wrong-hash").expiresAt(LocalDateTime.now().plusMinutes(10)).build();
        when(tokens.findByEmailAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(anyString(), anyString(), any())).thenReturn(Optional.of(token));
        var service = new AuthService(users, mock(AuthSessionRepository.class), tokens, mock(PasswordEncoder.class), mock(EmailService.class), mock(AuditLogService.class));
        var tx = mock(org.springframework.transaction.PlatformTransactionManager.class);
        when(tx.getTransaction(any())).thenAnswer(i -> new org.springframework.transaction.support.SimpleTransactionStatus());
        var advice = new org.springframework.transaction.interceptor.TransactionInterceptor();
        advice.setTransactionManager(tx); advice.setTransactionAttributeSource(new org.springframework.transaction.annotation.AnnotationTransactionAttributeSource());
        var factory = new org.springframework.aop.framework.ProxyFactory(service); factory.setProxyTargetClass(true); factory.addAdvice(advice);
        AuthService proxy = (AuthService) factory.getProxy();
        for (int attempt = 0; attempt < 5; attempt++) assertThrows(IllegalArgumentException.class, () -> proxy.verifyEmail(new VerifyOtpRequest("audit@example.test", "123456")));
        assertEquals(5, token.getFailedAttempts()); verify(tx, times(5)).commit(any()); verify(tx, never()).rollback(any());
    }
    @Test void memberCannotWriteAnAiPlanForAnotherMember() {
        var plans = mock(WorkoutPlanRepository.class);
        var c = new WorkoutProgressController(plans, mock(BodyProgressLogRepository.class), mock(UserRepository.class), mock(EngagementService.class));
        assertThrows(ResponseStatusException.class, () -> c.createPlan(new WorkoutProgressController.PlanRequest(777L, "Audit", null, "[]", null, null, null, "AI"), actor("MEMBER")));
        verifyNoInteractions(plans);
    }
    @Test void coachNeedsAnAssignedStudentForReadAndWrite() {
        var plans = mock(WorkoutPlanRepository.class); var logs = mock(BodyProgressLogRepository.class); var assigned = mock(BookingRepository.class);
        var c = new WorkoutProgressController(plans, logs, mock(UserRepository.class), mock(EngagementService.class)); ReflectionTestUtils.setField(c, "bookingRepository", assigned);
        assertThrows(ResponseStatusException.class, () -> c.memberWorkoutProgress(777L, actor("COACH")));
        assertThrows(ResponseStatusException.class, () -> c.createPlan(new WorkoutProgressController.PlanRequest(777L, "Audit", null, "[]", null, null, null, "COACH"), actor("COACH")));
        verifyNoInteractions(plans, logs);
    }
    @Test void replayOfSuccessfulCallbackCannotResurrectRefundedPayment() {
        var payments = mock(PaymentTransactionRepository.class); var gateway = mock(VNPayGateway.class);
        PaymentTransaction p = new PaymentTransaction(); p.setPaymentId(2L); p.setPaymentStatus("REFUNDED"); p.setAmount(BigDecimal.TEN);
        when(payments.findByIdForUpdate(2L)).thenReturn(Optional.of(p)); when(gateway.verifySignature(anyMap(), anyString())).thenReturn(true);
        new VNPayWebhookController(gateway, payments, List.of(), mock(UnpaidPaymentCancellationService.class)).handleIPN(Map.of("vnp_TxnRef", "2_123", "vnp_SecureHash", "valid", "vnp_Amount", "1000", "vnp_ResponseCode", "00"));
        assertEquals("REFUNDED", p.getPaymentStatus()); verify(payments, never()).save(any());
    }
    @Test void paymentStatusRequiresOwnerAndGeneratingPaidLinkIsRejected() {
        var payments = mock(PaymentTransactionRepository.class); var gateway = mock(VNPayGateway.class);
        PaymentTransaction p = new PaymentTransaction(); p.setPaymentId(2L); p.setMemberId(777L); p.setPaymentStatus("PAID"); p.setAmount(BigDecimal.TEN);
        when(payments.findById(2L)).thenReturn(Optional.of(p)); when(payments.findByIdForUpdate(2L)).thenReturn(Optional.of(p)); var c = new PaymentController(payments, gateway);
        assertThrows(ResponseStatusException.class, () -> c.getPaymentStatus(2L, actor("MEMBER")));
        p.setMemberId(9L);
        assertThrows(ResponseStatusException.class, () -> c.generatePayment(2L, null, "VNPAY", mock(jakarta.servlet.http.HttpServletRequest.class), actor("MEMBER")));
        verifyNoInteractions(gateway);
    }
    @Test void paidMembershipWaitsForManagerWithoutGrantingQuota() {
        var repo = mock(UserMembershipRepository.class); UserMembership m = membership(); m.setStatus("PENDING_PAYMENT");
        when(repo.findByIdForUpdate(1L)).thenReturn(Optional.of(m));
        PaymentTransaction p = new PaymentTransaction(); p.setPaymentId(2L); p.setMembershipId(1L); p.setMemberId(9L); p.setBookingType("MEMBERSHIP_PACKAGE"); p.setPaymentStatus("PAID");
        var handler = new MembershipPaymentHandler(mock(ReceptionPaymentRepository.class), repo, mock(EngagementService.class));
        handler.handlePaymentConfirmation(p, 10.0);
        assertEquals("PENDING_APPROVAL", m.getStatus()); assertEquals(9, m.getRemainingQuotaCourts());
    }
    @Test void overdueEquipmentCanBeReturnedExactlyOnce() {
        var loans = mock(EquipmentLoanRepository.class); var equipment = mock(EquipmentRepository.class);
        EquipmentLoan loan = EquipmentLoan.builder().loanId(1L).itemId(2L).quantity(1).status("OVERDUE").loanedAt(LocalDateTime.now().minusDays(8)).rentalPricePerHour(BigDecimal.ONE).build();
        Equipment item = Equipment.builder().itemId(2L).availableQuantity(0).totalQuantity(1).build();
        when(loans.findByIdForUpdate(1L)).thenReturn(Optional.of(loan)); when(equipment.findByIdForUpdate(2L)).thenReturn(Optional.of(item)); when(loans.save(any())).thenAnswer(i -> i.getArgument(0));
        var c = new EquipmentController(equipment, loans, mock(UserRepository.class)); c.returnEquipment(1L, new ReturnEquipmentRequest("CASH"));
        assertEquals("RETURNED", loan.getStatus()); assertEquals(1, item.getAvailableQuantity());
        assertThrows(ResponseStatusException.class, () -> c.returnEquipment(1L, null)); verify(equipment, times(1)).save(item);
    }
    @Test void voucherIsAppliedOnServerAndEnforcesScopeAndLimit() {
        var vouchers = mock(VoucherRepository.class); var payments = mock(PaymentTransactionRepository.class);
        Voucher v = Voucher.builder().voucherId(1L).code("TEN").appliesTo("BOOKING_ONLY").discountType("PERCENT").discountValue(BigDecimal.TEN).usageLimit(1).usedCount(0).build();
        when(vouchers.findByCodeForUpdate("TEN")).thenReturn(Optional.of(v));
        PaymentTransaction p = new PaymentTransaction(); p.setAmount(BigDecimal.valueOf(100)); p.setPaymentStatus("PENDING");
        var service = new VoucherService(vouchers, payments); service.apply(p, "TEN");
        assertEquals(0, BigDecimal.valueOf(90).compareTo(p.getAmount())); assertEquals(1, v.getUsedCount());
        assertThrows(ResponseStatusException.class, () -> service.apply(p, "TEN"));
        v.setUsedCount(0); v.setAppliesTo("MEMBERSHIP_ONLY");
        assertThrows(ResponseStatusException.class, () -> service.apply(p, "TEN"));
    }

    @Test void renewalCreatesANewPendingTermAndPreservesCurrentBenefits() {
        var memberships = mock(UserMembershipRepository.class); var packages = mock(MembershipPackageRepository.class);
        var receipts = mock(ReceptionPaymentRepository.class); var payments = mock(PaymentTransactionRepository.class);
        UserMembership current = membership(); LocalDate oldEnd = current.getEndDate();
        when(memberships.findByUserIdOrderByEndDateDesc(9L)).thenReturn(List.of(current));
        when(packages.findById(2L)).thenReturn(Optional.of(MembershipPackage.builder().packageId(2L).name("VIP").durationDays(30).price(BigDecimal.TEN).build()));
        when(memberships.save(any())).thenAnswer(i -> { UserMembership m = i.getArgument(0); m.setMembershipId(3L); return m; });
        when(receipts.save(any())).thenAnswer(i -> i.getArgument(0));
        when(payments.save(any())).thenAnswer(i -> { PaymentTransaction p = i.getArgument(0); p.setPaymentId(4L); return p; });
        var c = new MemberProfileController(mock(UserRepository.class), mock(MemberHealthProfileRepository.class), memberships, packages, receipts, payments, mock(BookingRepository.class), mock(ClassSessionRepository.class), mock(MemberCheckInRepository.class), mock(PublicSportRepository.class), new PaymentService(payments));
        var response = c.purchaseMembership(new MemberPackagePurchaseRequest(2L, "VNPAY"), actor("MEMBER"));
        assertEquals("PENDING", response.paymentStatus()); assertEquals("ACTIVE", current.getStatus()); assertEquals(oldEnd, current.getEndDate());
        verify(memberships, never()).save(current);
    }
    @Test void cannotExtendAOneHourReservationToThreeHoursThroughReschedule() {
        var bookings = mock(BookingRepository.class); var courts = mock(CourtBookingRepository.class);
        CourtBooking b = new CourtBooking(); b.setCourtBookingId(1L); b.setCourtId(2L); b.setMemberId(9L); b.setStatus("CONFIRMED");
        LocalDateTime start = LocalDateTime.now().plusDays(1); b.setStartTime(start); b.setEndTime(start.plusHours(1));
        when(courts.findByIdForUpdate(1L)).thenReturn(Optional.of(b));
        BookingService service = new BookingService(bookings, mock(ClassSessionRepository.class), mock(UserRepository.class), mock(PublicSportRepository.class), mock(PublicFacilityRepository.class), mock(SportsCourtRepository.class), courts, mock(CourtMaintenanceRepository.class), mock(PaymentTransactionRepository.class), mock(UserMembershipRepository.class), mock(MembershipPackageRepository.class), mock(MembershipService.class), null);
        assertThrows(ResponseStatusException.class, () -> service.rescheduleCourtBooking(1L, 9L, 2L, start, start.plusHours(3)));
        assertEquals(start.plusHours(1), b.getEndTime()); verify(courts, never()).save(any());
    }
    @Test void expiredPtHoldReleasesCoachSessionAndDoesNotCancelPaidBookings() {
        var bookings = mock(BookingRepository.class); var courts = mock(CourtBookingRepository.class); var payments = mock(PaymentTransactionRepository.class); var sessions = mock(ClassSessionRepository.class);
        Booking b = Booking.builder().bookingId(1L).memberId(9L).sessionId(3L).paymentId(2L).status("BOOKED").build();
        PaymentTransaction p = new PaymentTransaction(); p.setPaymentId(2L); p.setBookingType("PT"); p.setPaymentStatus("PENDING");
        ClassSession session = ClassSession.builder().sessionId(3L).status("SCHEDULED").build();
        when(bookings.findByStatusIgnoreCaseAndBookingTimeBefore(eq("BOOKED"), any())).thenReturn(List.of(b));
        when(bookings.findByIdForUpdate(1L)).thenReturn(Optional.of(b)); when(payments.findByIdForUpdate(2L)).thenReturn(Optional.of(p)); when(sessions.findByIdForUpdate(3L)).thenReturn(Optional.of(session));
        var scheduler = new PaymentTimeoutScheduler(bookings, courts, payments, null); ReflectionTestUtils.setField(scheduler, "sessions", sessions);
        p.setPaymentStatus("PAID"); scheduler.cancelUnpaidBookings(); assertEquals("BOOKED", b.getStatus());
        p.setPaymentStatus("PENDING"); scheduler.cancelUnpaidBookings();
        assertEquals("CANCELLED", b.getStatus()); assertEquals("CANCELLED", session.getStatus()); assertEquals("FAILED", p.getPaymentStatus());
    }
    @Test void courtNoShowConsumesHeldQuotaExactlyOnce() {
        var bookings = mock(BookingRepository.class); var courts = mock(CourtBookingRepository.class); var memberships = mock(UserMembershipRepository.class); var quota = mock(MembershipService.class);
        CourtBooking b = new CourtBooking(); b.setCourtBookingId(1L); b.setMemberId(9L); b.setStatus("CONFIRMED"); b.setUsesMembershipQuota(true); b.setMembershipId(2L); b.setQuotaHoursUsed(BigDecimal.ONE); b.setEndTime(LocalDateTime.now().minusMinutes(1));
        when(courts.findByStatus("CONFIRMED")).thenReturn(List.of(b)); when(courts.findByIdForUpdate(1L)).thenReturn(Optional.of(b));
        var lifecycle = new BookingLifecycleService(bookings, courts, mock(ClassSessionRepository.class), mock(SportsCourtRepository.class), memberships, quota, mock(PaymentService.class), mock(EngagementService.class));
        var maintenance = mock(CourtMaintenanceRepository.class); b.setCourtId(3L);
        ReflectionTestUtils.setField(lifecycle, "maintenance", maintenance);
        when(maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(3L), any(), any())).thenReturn(true, false);
        lifecycle.reconcile(); assertEquals("CONFIRMED", b.getStatus()); verifyNoInteractions(quota);
        lifecycle.reconcile(); lifecycle.reconcile(); assertEquals("NO_SHOW", b.getStatus()); verify(quota, times(1)).consumeCourtQuota(2L, 1.0);
    }
    @Test void expiredMembershipConvertsFutureQuotaCourtToANewTenMinutePaymentHold() {
        var bookings = mock(BookingRepository.class); var courts = mock(CourtBookingRepository.class); var memberships = mock(UserMembershipRepository.class); var sports = mock(SportsCourtRepository.class); var payments = mock(PaymentService.class);
        UserMembership m = membership(); m.setEndDate(LocalDate.now().minusDays(1)); m.setStatus("EXPIRED");
        CourtBooking b = new CourtBooking(); b.setCourtBookingId(2L); b.setQuotaHoursUsed(BigDecimal.ONE); b.setMemberId(9L); b.setCourtId(3L); b.setMembershipId(1L); b.setUsesMembershipQuota(true); b.setStatus("CONFIRMED"); b.setStartTime(LocalDateTime.now().plusDays(1)); b.setEndTime(b.getStartTime().plusHours(1));
        when(memberships.findByStatusIgnoreCase("EXPIRED")).thenReturn(List.of(m)); when(memberships.findByIdForUpdate(1L)).thenReturn(Optional.of(m)); when(courts.findByMemberIdOrderByStartTimeAsc(9L)).thenReturn(List.of(b)); when(courts.findByIdForUpdate(2L)).thenReturn(Optional.of(b));
        SportsCourt court = new SportsCourt(); court.setHourlyRate(BigDecimal.valueOf(100)); when(sports.findById(3L)).thenReturn(Optional.of(court));
        PaymentTransaction p = new PaymentTransaction(); p.setPaymentId(4L); when(payments.createPayment(eq(9L), eq("COURT"), any(), eq("VNPAY"))).thenReturn(p);
        var lifecycle = new BookingLifecycleService(bookings, courts, mock(ClassSessionRepository.class), sports, memberships, mock(MembershipService.class), payments, mock(EngagementService.class));
        lifecycle.reconcile(); lifecycle.reconcile(); assertEquals("PENDING", b.getStatus()); assertEquals(4L, b.getPaymentId()); assertFalse(b.getUsesMembershipQuota()); assertEquals(0, m.getHeldQuotaCourts());
        verify(payments, times(1)).createPayment(eq(9L), eq("COURT"), any(), eq("VNPAY"));
    }
    @Test void managerCannotAssignAReplacementCoachWhoAlreadyHasAConcurrentClass() {
        var leaves = mock(CoachLeaveRequestRepository.class); var users = mock(UserRepository.class); var sessions = mock(ClassSessionRepository.class);
        LocalDate day = LocalDate.now().plusDays(1);
        CoachLeaveRequest leave = CoachLeaveRequest.builder().requestId(1L).coachId(10L).startDate(day).endDate(day).status("PENDING").build();
        when(leaves.findByIdForUpdate(1L)).thenReturn(Optional.of(leave)); when(users.findByIdForUpdate(20L)).thenReturn(Optional.of(User.builder().userId(20L).role("COACH").status("ACTIVE").build()));
        ClassSession s = ClassSession.builder().sessionId(3L).coachId(10L).startTime(day.atTime(10, 0)).endTime(day.atTime(11, 0)).status("SCHEDULED").build();
        when(sessions.findAll()).thenReturn(List.of(s)); when(sessions.existsOverlappingSessionForCoach(eq(20L), any(), any())).thenReturn(true);
        var c = new CoachLeaveController(leaves, users, sessions, mock(BookingRepository.class));
        assertThrows(ResponseStatusException.class, () -> c.decideLeaveRequest(1L, new LeaveDecisionRequest(true, 20L, "Audit"), actor("MANAGER")));
        verify(sessions, never()).saveAll(any());
    }
}
