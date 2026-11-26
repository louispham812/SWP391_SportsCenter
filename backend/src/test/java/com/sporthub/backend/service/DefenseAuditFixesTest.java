package com.sporthub.backend.service;

import com.sporthub.backend.controller.*;
import com.sporthub.backend.dto.*;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.enums.PackageType;
import com.sporthub.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DefenseAuditFixesTest {

    private static Authentication auth(long id, String role) {
        return new UsernamePasswordAuthenticationToken(
                String.valueOf(id), "x", List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    @Test
    void timeoutSchedulerDoesNotRenotifyAlreadyFailedMembershipPayments() {
        BookingRepository bookings = mock(BookingRepository.class);
        CourtBookingRepository courts = mock(CourtBookingRepository.class);
        PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
        EngagementService engagement = mock(EngagementService.class);
        UserMembershipRepository memberships = mock(UserMembershipRepository.class);

        PaymentTransaction failedTx = new PaymentTransaction();
        failedTx.setPaymentId(77L);
        failedTx.setMemberId(9L);
        failedTx.setMembershipId(15L);
        failedTx.setPaymentStatus("FAILED");

        UserMembership pendingMem = new UserMembership();
        pendingMem.setMembershipId(15L);
        pendingMem.setStatus("PENDING_PAYMENT");

        when(bookings.findByStatusIgnoreCaseAndBookingTimeBefore(eq("BOOKED"), any())).thenReturn(List.of());
        when(courts.findByStatusIgnoreCaseAndCreatedAtBefore(eq("PENDING"), any())).thenReturn(List.of());
        when(payments.findByBookingTypeAndPaymentStatusIgnoreCaseAndCreatedAtBefore(eq("MEMBERSHIP_PACKAGE"), eq("PENDING"), any()))
                .thenReturn(List.of());
        when(payments.findByBookingTypeAndPaymentStatusIgnoreCaseAndCreatedAtBefore(eq("MEMBERSHIP_PACKAGE"), eq("FAILED"), any()))
                .thenReturn(List.of(failedTx));
        when(payments.findByIdForUpdate(77L)).thenReturn(Optional.of(failedTx));
        when(memberships.findByIdForUpdate(15L)).thenReturn(Optional.of(pendingMem));

        PaymentTimeoutScheduler scheduler = new PaymentTimeoutScheduler(bookings, courts, payments, engagement);
        ReflectionTestUtils.setField(scheduler, "memberships", memberships);

        scheduler.cancelUnpaidBookings();

        assertEquals("CANCELLED", pendingMem.getStatus());
        verify(memberships).save(pendingMem);
        verify(payments, never()).save(any());
        verify(engagement, never()).notifyUser(any(), any(), any(), any());
    }

    @Test
    void cancelClassSessionReleasesQuotaCreatesRefundAndPreventsDoubleCancel() {
        FacilityRepository facilities = mock(FacilityRepository.class);
        SportRepository sports = mock(SportRepository.class);
        UserRepository users = mock(UserRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        EngagementService engagement = mock(EngagementService.class);
        PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
        MembershipService membershipService = mock(MembershipService.class);
        RefundRequestRepository refunds = mock(RefundRequestRepository.class);
        VoucherService voucherService = mock(VoucherService.class);

        LocalDateTime futureStart = LocalDateTime.now().plusDays(2);
        ClassSession session = ClassSession.builder()
                .sessionId(50L).className("Tennis Đôi").coachId(5L).facilityId(4L).sportId(3L)
                .startTime(futureStart).endTime(futureStart.plusHours(1)).maxSlots(6).bookedSlots(3).status("SCHEDULED")
                .build();

        Booking quotaBooking = Booking.builder()
                .bookingId(1L).memberId(9L).sessionId(50L).status("CONFIRMED")
                .usesMembershipQuota(true).membershipId(8L).quotaState("HELD").build();
        Booking paidBooking = Booking.builder()
                .bookingId(2L).memberId(10L).sessionId(50L).status("CONFIRMED")
                .usesMembershipQuota(false).paymentId(21L).build();
        Booking pendingBooking = Booking.builder()
                .bookingId(3L).memberId(11L).sessionId(50L).status("BOOKED")
                .usesMembershipQuota(false).paymentId(22L).build();

        PaymentTransaction paidTx = new PaymentTransaction();
        paidTx.setPaymentId(21L); paidTx.setMemberId(10L); paidTx.setBookingType("CLASS");
        paidTx.setPaymentStatus("PAID"); paidTx.setAmount(BigDecimal.valueOf(200000)); paidTx.setReferenceCode("CLS-21");

        PaymentTransaction pendingTx = new PaymentTransaction();
        pendingTx.setPaymentId(22L); pendingTx.setMemberId(11L); pendingTx.setBookingType("CLASS");
        pendingTx.setPaymentStatus("PENDING"); pendingTx.setAmount(BigDecimal.valueOf(200000));

        User member10 = new User(); member10.setUserId(10L); member10.setFullName("Ngọc"); member10.setPhone("0900");

        when(sessions.findById(50L)).thenReturn(Optional.of(session));
        when(bookings.findBySessionIdInAndStatusIn(eq(List.of(50L)), anyList()))
                .thenReturn(List.of(quotaBooking, paidBooking, pendingBooking));
        when(payments.findById(21L)).thenReturn(Optional.of(paidTx));
        when(payments.findById(22L)).thenReturn(Optional.of(pendingTx));
        when(users.findById(10L)).thenReturn(Optional.of(member10));
        when(refunds.existsByTransactionIdAndStatusIn(eq(21L), anyList())).thenReturn(false);

        FacilityManagementController ctrl = new FacilityManagementController(
                facilities, sports, users, sessions, bookings, engagement, payments, null, null, null);
        ReflectionTestUtils.setField(ctrl, "membershipService", membershipService);
        ReflectionTestUtils.setField(ctrl, "refundRequestRepository", refunds);
        ReflectionTestUtils.setField(ctrl, "voucherService", voucherService);

        ctrl.cancelClassSession(50L, "Bảo trì", auth(1L, "MANAGER"));

        assertEquals("CANCELLED", session.getStatus());
        assertEquals(0, session.getBookedSlots());
        assertEquals("RELEASED", quotaBooking.getQuotaState());
        verify(membershipService).refundQuotaForExcusedAbsence(8L, 1, futureStart);
        assertEquals("PAID", paidTx.getPaymentStatus());
        verify(refunds).save(argThat(r -> r.getTransactionId().equals(21L) && "PENDING_APPROVAL".equals(r.getStatus())));
        assertEquals("FAILED", pendingTx.getPaymentStatus());
        verify(voucherService).release(pendingTx);

        ResponseStatusException secondCancel = assertThrows(ResponseStatusException.class,
                () -> ctrl.cancelClassSession(50L, "Again", auth(1L, "MANAGER")));
        assertEquals(409, secondCancel.getStatusCode().value());
    }

    @Test
    void createAndUpdateClassSessionEnforceCourtOverlapAndSlotBounds() {
        FacilityRepository facilities = mock(FacilityRepository.class);
        SportRepository sports = mock(SportRepository.class);
        UserRepository users = mock(UserRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        FacilityCourtSyncService sync = mock(FacilityCourtSyncService.class);
        CourtBookingRepository courtBookings = mock(CourtBookingRepository.class);

        Facility f = new Facility(); f.setFacilityId(4L); f.setSportId(3L); f.setStatus("AVAILABLE"); f.setFacilityName("Sân T1");
        Sport s = new Sport(); s.setSportId(3L); s.setSportName("Tennis");
        User coach = new User(); coach.setUserId(5L); coach.setRole("COACH"); coach.setStatus("ACTIVE");
        coach.setSpecialty("Tennis");

        LocalDateTime start = LocalDateTime.now().plusDays(3).withHour(18).withMinute(0);
        LocalDateTime end = start.plusHours(1);

        when(facilities.findById(4L)).thenReturn(Optional.of(f));
        when(sports.findById(3L)).thenReturn(Optional.of(s));
        when(users.findById(5L)).thenReturn(Optional.of(coach));
        when(sync.getCourtIdsForFacility(4L, 3L, "Sân T1")).thenReturn(List.of(3L));
        when(courtBookings.existsConfirmedOverlap(3L, start, end)).thenReturn(true);

        FacilityManagementController ctrl = new FacilityManagementController(
                facilities, sports, users, sessions, bookings, null, null, null, null, sync);
        ReflectionTestUtils.setField(ctrl, "courtBookingRepository", courtBookings);

        CreateClassSessionRequest req = new CreateClassSessionRequest(
                "Tennis Test", 3L, 5L, 4L, start, end, 1, 6, BigDecimal.valueOf(200000));
        ResponseStatusException overlapEx = assertThrows(ResponseStatusException.class,
                () -> ctrl.createClassSession(req, auth(1L, "MANAGER")));
        assertEquals(409, overlapEx.getStatusCode().value());

        ClassSession existing = ClassSession.builder().sessionId(60L).sportId(3L).facilityId(4L).status("SCHEDULED").build();
        when(sessions.findById(60L)).thenReturn(Optional.of(existing));
        when(bookings.countBySessionIdAndStatusIn(60L, List.of("BOOKED", "CONFIRMED"))).thenReturn(4L);

        ResponseStatusException reduceEx = assertThrows(ResponseStatusException.class,
                () -> ctrl.updateClassSession(60L, new UpdateClassSessionRequest(null, null, null, null, null, 2, null, null), auth(1L, "MANAGER")));
        assertEquals(409, reduceEx.getStatusCode().value());

        ResponseStatusException cancelViaPutEx = assertThrows(ResponseStatusException.class,
                () -> ctrl.updateClassSession(60L, new UpdateClassSessionRequest(null, null, null, null, null, null, null, "CANCELLED"), auth(1L, "MANAGER")));
        assertEquals(400, cancelViaPutEx.getStatusCode().value());
    }

    @Test
    void bookingServiceBlocksCourtClassOverlapPastCancelAndInvalidRefundRestore() {
        BookingRepository bookings = mock(BookingRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        UserRepository users = mock(UserRepository.class);
        PublicSportRepository pubSports = mock(PublicSportRepository.class);
        PublicFacilityRepository pubFacilities = mock(PublicFacilityRepository.class);
        SportsCourtRepository courts = mock(SportsCourtRepository.class);
        CourtBookingRepository courtBookings = mock(CourtBookingRepository.class);
        CourtMaintenanceRepository maintenance = mock(CourtMaintenanceRepository.class);
        PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
        UserMembershipRepository userMemberships = mock(UserMembershipRepository.class);
        MembershipPackageRepository packages = mock(MembershipPackageRepository.class);
        MembershipService membershipService = mock(MembershipService.class);
        FacilityCourtSyncService sync = mock(FacilityCourtSyncService.class);

        User member = new User(); member.setUserId(9L); member.setRole("MEMBER"); member.setStatus("ACTIVE");
        SportsCourt court = new SportsCourt();
        court.setCourtId(3L); court.setSportId(3L); court.setCourtName("Tennis Court 01");
        court.setActive(true); court.setHourlyRate(BigDecimal.valueOf(300000));
        court.setOpensAt(LocalTime.of(6, 0)); court.setClosesAt(LocalTime.of(22, 0));

        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(18).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusHours(1);
        ClassSession classOnCourt = ClassSession.builder()
                .sessionId(7L).facilityId(4L).status("SCHEDULED").startTime(start).endTime(end).build();

        when(users.findByIdForUpdate(9L)).thenReturn(Optional.of(member));
        when(courts.findByIdForUpdate(3L)).thenReturn(Optional.of(court));
        when(sync.getFacilityIdsForCourt(3L, 3L, "Tennis Court 01")).thenReturn(List.of(4L));
        when(sessions.findAll()).thenReturn(List.of(classOnCourt));

        BookingService service = new BookingService(
                bookings, sessions, users, pubSports, pubFacilities, courts, courtBookings,
                maintenance, payments, userMemberships, packages, membershipService,
                null, null, null, null, null);
        ReflectionTestUtils.setField(service, "syncService", sync);

        CheckoutRequest checkoutReq = new CheckoutRequest("COURT", 3L, start, end, "VNPAY", false, null);
        ResponseStatusException courtClassConflict = assertThrows(ResponseStatusException.class,
                () -> service.checkout(9L, checkoutReq));
        assertEquals(409, courtClassConflict.getStatusCode().value());

        CourtBooking pastBooking = new CourtBooking();
        pastBooking.setCourtBookingId(44L); pastBooking.setMemberId(9L); pastBooking.setStatus("CONFIRMED");
        pastBooking.setStartTime(LocalDateTime.now().minusMinutes(10));
        pastBooking.setEndTime(LocalDateTime.now().plusMinutes(50));
        when(courtBookings.findByIdForUpdate(44L)).thenReturn(Optional.of(pastBooking));
        ResponseStatusException pastCancel = assertThrows(ResponseStatusException.class,
                () -> service.cancelCourtBooking(44L, 9L));
        assertEquals(409, pastCancel.getStatusCode().value());

        CourtBooking fullSlotRestore = new CourtBooking();
        fullSlotRestore.setCourtBookingId(45L); fullSlotRestore.setCourtId(3L); fullSlotRestore.setStatus("CANCELLED");
        fullSlotRestore.setStartTime(start); fullSlotRestore.setEndTime(end);
        when(courtBookings.findByIdForUpdate(45L)).thenReturn(Optional.of(fullSlotRestore));
        when(courtBookings.existsConfirmedOverlapExcluding(3L, 45L, start, end)).thenReturn(true);
        ResponseStatusException restoreConflict = assertThrows(ResponseStatusException.class,
                () -> service.restoreBookingAfterRefundRejection(45L, "COURT"));
        assertEquals(409, restoreConflict.getStatusCode().value());
    }

    @Test
    void checkInAllowsGracePeriodAndBlocksPendingRefund() {
        SportsCourtRepository courts = mock(SportsCourtRepository.class);
        CourtBookingRepository courtBookings = mock(CourtBookingRepository.class);
        CourtMaintenanceRepository maintenance = mock(CourtMaintenanceRepository.class);
        PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        PublicFacilityRepository facilities = mock(PublicFacilityRepository.class);
        FacilityCourtSyncService sync = mock(FacilityCourtSyncService.class);
        MembershipService memberships = mock(MembershipService.class);
        RefundRequestRepository refunds = mock(RefundRequestRepository.class);

        LocalDateTime now = LocalDateTime.now();
        SportsCourt court = new SportsCourt(); court.setCourtId(3L); court.setActive(true);
        CourtBooking booking = new CourtBooking();
        booking.setCourtBookingId(88L); booking.setMemberId(9L); booking.setCourtId(3L);
        booking.setStatus("CONFIRMED"); booking.setPaymentId(14L);
        booking.setAmountPaid(BigDecimal.valueOf(320000));
        booking.setStartTime(now.plusMinutes(10)); booking.setEndTime(now.plusMinutes(70));

        PaymentTransaction tx = new PaymentTransaction();
        tx.setPaymentId(14L); tx.setMemberId(9L); tx.setBookingType("COURT");
        tx.setPaymentStatus("PAID"); tx.setAmount(BigDecimal.valueOf(320000));

        when(courts.findByIdForUpdate(3L)).thenReturn(Optional.of(court));
        when(courtBookings.findByIdForUpdate(88L)).thenReturn(Optional.of(booking));
        when(payments.findByIdForUpdate(14L)).thenReturn(Optional.of(tx));
        when(refunds.existsByTransactionIdAndStatusIn(eq(14L), anyList())).thenReturn(false);

        CheckInEligibilityService eligibility = new CheckInEligibilityService(
                courts, courtBookings, maintenance, payments, bookings, sessions, facilities, sync, memberships);
        ReflectionTestUtils.setField(eligibility, "systemSettingRepository", mock(SystemSettingRepository.class));
        ReflectionTestUtils.setField(eligibility, "refundRequestRepository", refunds);

        assertSame(booking, eligibility.validateCourt(booking, 9L, now));

        when(refunds.existsByTransactionIdAndStatusIn(eq(14L), anyList())).thenReturn(true);
        ResponseStatusException refundBlock = assertThrows(ResponseStatusException.class,
                () -> eligibility.validateCourt(booking, 9L, now));
        assertEquals(409, refundBlock.getStatusCode().value());
    }

    @Test
    void coachIncomeStaffPerformanceVoucherAndMembershipApproveAreConsistent() {
        UserRepository users = mock(UserRepository.class);
        ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        BookingRepository bookings = mock(BookingRepository.class);
        PublicSportRepository pubSports = mock(PublicSportRepository.class);
        FeedbackRepository feedbacks = mock(FeedbackRepository.class);

        User coach = new User(); coach.setUserId(5L); coach.setRole("COACH"); coach.setStatus("ACTIVE"); coach.setFullName("Minh");
        ClassSession emptySession = ClassSession.builder()
                .sessionId(2L).coachId(5L).sportId(2L).facilityId(1L).status("COMPLETED")
                .startTime(LocalDateTime.now().minusDays(1)).endTime(LocalDateTime.now().minusDays(1).plusHours(1))
                .priceAmount(BigDecimal.valueOf(150000)).build();
        when(users.findById(5L)).thenReturn(Optional.of(coach));
        when(sessions.findByCoachIdOrderByStartTimeAsc(5L)).thenReturn(List.of(emptySession));
        when(bookings.findBySessionIdInAndStatusIn(List.of(2L), List.of("CONFIRMED"))).thenReturn(List.of());
        when(pubSports.findAll()).thenReturn(List.of());

        CoachProfileController coachCtrl = new CoachProfileController(users, sessions, bookings, pubSports, feedbacks);
        ResponseEntity<CoachIncomeResponse> incomeResp = coachCtrl.getIncomeSummary(auth(5L, "COACH"));
        assertEquals(0, BigDecimal.ZERO.compareTo(incomeResp.getBody().totalIncome()));

        VoucherRepository vouchers = mock(VoucherRepository.class);
        Voucher existingVoucher = Voucher.builder()
                .voucherId(4L).code("TET2026").discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(20)).discountPercent(20)
                .discountAmount(BigDecimal.valueOf(500000))
                .minPurchase(BigDecimal.ZERO).validFrom(LocalDate.now()).validUntil(LocalDate.now().plusDays(10))
                .usageLimit(100).usedCount(0).appliesTo("ALL").status("ACTIVE").build();
        when(vouchers.findById(4L)).thenReturn(Optional.of(existingVoucher));
        when(vouchers.save(any(Voucher.class))).thenAnswer(inv -> inv.getArgument(0));

        VoucherController voucherCtrl = new VoucherController(vouchers);
        voucherCtrl.updateVoucher(4L, new SaveVoucherRequest(
                "TET2026", "PERCENT", BigDecimal.valueOf(25), null, null, null, null, null, null));
        assertEquals(0, BigDecimal.valueOf(500000).compareTo(existingVoucher.getDiscountAmount()));

        MembershipPackageRepository pkgRepo = mock(MembershipPackageRepository.class);
        UserMembershipRepository umRepo = mock(UserMembershipRepository.class);
        MembershipService memService = mock(MembershipService.class);
        AuditLogService auditLogService = mock(AuditLogService.class);
        User manager = new User(); manager.setUserId(1L); manager.setRole("MANAGER");
        UserMembership approvedUm = new UserMembership();
        approvedUm.setMembershipId(8L); approvedUm.setPackageId(8L);
        approvedUm.setInitialQuotaSessions(20); approvedUm.setRemainingQuotaSessions(20);
        approvedUm.setHeldQuotaSessions(0); approvedUm.setUsedQuotaSessions(0);
        approvedUm.setInitialQuotaCourts(10); approvedUm.setRemainingQuotaCourts(10);
        approvedUm.setHeldQuotaCourts(0); approvedUm.setUsedQuotaCourts(0);
        MembershipPackage pkg = new MembershipPackage();
        pkg.setPackageId(8L); pkg.setName("Hạng Vàng"); pkg.setPackageType(PackageType.VIP);

        when(users.findById(1L)).thenReturn(Optional.of(manager));
        when(umRepo.findById(8L)).thenReturn(Optional.of(approvedUm));
        when(pkgRepo.findById(8L)).thenReturn(Optional.of(pkg));

        ManagerController managerCtrl = new ManagerController(
                users, pkgRepo, pubSports, mock(PasswordEncoder.class), mock(EmailService.class),
                auditLogService, mock(AuthService.class), memService);
        ReflectionTestUtils.setField(managerCtrl, "userMembershipRepository", umRepo);

        MembershipQuotaResponse quotaResp = managerCtrl.approveMembership(8L, auth(1L, "MANAGER"));
        assertEquals(20, quotaResp.remainingQuota());
        assertEquals(10, quotaResp.remainingQuotaCourts());
    }
}
