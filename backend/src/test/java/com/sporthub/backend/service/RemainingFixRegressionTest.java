package com.sporthub.backend.service;

import com.sporthub.backend.controller.*;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.enums.AttendanceStatus;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.gateway.*;
import com.sporthub.backend.service.payment.BookingPaymentHandler;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class RemainingFixRegressionTest {
    static final Long MEMBER = 9L;
    static Map<String, String> callback(String reference, String transaction) {
        return Map.of("vnp_TxnRef", reference, "vnp_TransactionNo", transaction, "vnp_SecureHash", "mock-valid",
            "vnp_ResponseCode", "00", "vnp_TransactionStatus", "00", "vnp_Amount", "1000", "vnp_PayDate", "20261109120000");
    }
    static class PaymentFixture {
        final PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
        final PaymentAttemptRepository attempts = mock(PaymentAttemptRepository.class);
        final GatewayReceiptRepository receipts = mock(GatewayReceiptRepository.class);
        final VNPayGateway gateway = mock(VNPayGateway.class);
        final EngagementService engagement = mock(EngagementService.class);
        final BookingPaymentHandler handler = mock(BookingPaymentHandler.class);
        final Map<String, PaymentAttempt> attemptsByRef = new LinkedHashMap<>();
        final Map<String, GatewayReceipt> receiptsByTransaction = new LinkedHashMap<>();
        final PaymentTransaction order = new PaymentTransaction();
        final PaymentAttemptService service;
        final VNPayWebhookController controller;
        PaymentFixture() {
            order.setPaymentId(2L); order.setMemberId(MEMBER); order.setAmount(BigDecimal.TEN); order.setPaymentStatus("PENDING"); order.setCreatedAt(LocalDateTime.now());
            when(payments.findByIdForUpdate(2L)).thenReturn(Optional.of(order));
            when(gateway.verifySignature(anyMap(), anyString())).thenReturn(true);
            when(attempts.findByGatewayReference(anyString())).thenAnswer(i -> Optional.ofNullable(attemptsByRef.get(i.getArgument(0))));
            when(attempts.findFirstByPaymentIdAndStatusOrderByCreatedAtDesc(any(), anyString())).thenAnswer(i -> attemptsByRef.values().stream().filter(a -> i.getArgument(1).equals(a.getStatus())).findFirst());
            when(attempts.saveAndFlush(any())).thenAnswer(i -> { PaymentAttempt a = i.getArgument(0); a.setAttemptId((long) attemptsByRef.size() + 1); attemptsByRef.put(a.getGatewayReference(), a); return a; });
            when(receipts.findByGatewayTransactionNo(anyString())).thenAnswer(i -> Optional.ofNullable(receiptsByTransaction.get(i.getArgument(0))));
            when(receipts.saveAndFlush(any())).thenAnswer(i -> { GatewayReceipt r = i.getArgument(0); r.setReceiptId((long) receiptsByTransaction.size() + 1); receiptsByTransaction.put(r.getGatewayTransactionNo(), r); return r; });
            service = new PaymentAttemptService(attempts, receipts, engagement, mock(UserRepository.class));
            controller = new VNPayWebhookController(gateway, payments, List.of(handler), mock(UnpaidPaymentCancellationService.class)); ReflectionTestUtils.setField(controller, "attempts", service);
        }
    }
    @Test void generatingAgainReusesTheSameUnexpiredAttemptAndOriginalHoldDeadline() {
        var f = new PaymentFixture();
        when(f.gateway.generatePaymentAttempt(any(), any(), any(), any(), any(), any())).thenAnswer(i -> Map.of("paymentUrl", "https://gateway.test/?ref=" + i.getArgument(4), "merchantDate", "20261109115900"));
        var first = f.service.generate(f.order, f.gateway, "127.0.0.1"); var second = f.service.generate(f.order, f.gateway, "127.0.0.1");
        assertEquals(first.get("paymentUrl"), second.get("paymentUrl")); assertEquals(1, f.attemptsByRef.size());
        assertEquals(f.order.getCreatedAt().plusMinutes(10), first.get("expiresAt"));
        verify(f.gateway, times(1)).generatePaymentAttempt(any(), any(), any(), any(), any(), any());
    }
    @Test void twoSuccessfulGatewayTransactionsAreStoredAndOnlyFirstGrantsEntitlements() {
        var f = new PaymentFixture();
        f.controller.handleIPN(callback("2_first", "txn_one")); f.controller.handleIPN(callback("2_second", "txn_two"));
        f.controller.handleReturn(callback("2_second", "txn_two")); f.controller.handleIPN(callback("2_first", "txn_one"));
        assertEquals(2, f.receiptsByTransaction.size()); assertEquals("APPLIED", f.receiptsByTransaction.get("txn_one").getStatus());
        assertEquals("EXCESS", f.receiptsByTransaction.get("txn_two").getStatus());
        assertEquals("txn_one", f.order.getReferenceCode()); assertEquals("2_first", f.order.getGatewayReference());
        assertEquals("20261109120000", f.order.getTransactionDate());
        assertEquals("20261109120000", f.receiptsByTransaction.get("txn_one").getTransactionDate());
        verify(f.handler, times(1)).handlePaymentConfirmation(f.order, 10.0);
        verify(f.engagement, times(1)).audit(eq(MEMBER), eq("SYSTEM"), eq("EXCESS_PAYMENT_RECEIVED"), anyString());
    }
    @Test void aDistinctTransactionAfterRefundIsRecordedAsExcessWithoutReopeningOrder() {
        var f = new PaymentFixture(); f.order.setPaymentStatus("REFUNDED"); f.order.setGatewayReference("2_old"); f.order.setReferenceCode("old_txn");
        f.controller.handleIPN(callback("2_old", "old_txn")); f.controller.handleIPN(callback("2_new", "new_txn"));
        assertEquals("REFUNDED", f.receiptsByTransaction.get("old_txn").getStatus()); assertEquals("EXCESS", f.receiptsByTransaction.get("new_txn").getStatus());
        assertEquals("REFUNDED", f.order.getPaymentStatus()); verifyNoInteractions(f.handler);
    }
    @Test void signedFailureAfterSuccessCannotDowngradeTheOrder() {
        var f = new PaymentFixture(); f.controller.handleIPN(callback("2_first", "txn_one"));
        var failure = new HashMap<>(callback("2_first", "0")); failure.put("vnp_ResponseCode", "24");
        f.controller.handleIPN(failure); assertEquals("PAID", f.order.getPaymentStatus()); assertEquals("SUCCESS", f.attemptsByRef.get("2_first").getStatus());
    }
    @Test void aGatewayTransactionCannotBeReusedForAnotherPayment() {
        var f = new PaymentFixture(); f.controller.handleIPN(callback("2_first", "txn_one"));
        PaymentTransaction other = new PaymentTransaction(); other.setPaymentId(3L); other.setMemberId(10L); other.setAmount(BigDecimal.TEN); other.setPaymentStatus("PENDING");
        when(f.payments.findByIdForUpdate(3L)).thenReturn(Optional.of(other));
        assertThrows(ResponseStatusException.class, () -> f.controller.handleIPN(callback("3_first", "txn_one")));
        assertEquals("PENDING", other.getPaymentStatus()); assertEquals(1, f.receiptsByTransaction.size());
    }
    @Test void invalidSignatureOrAmountNeverCreatesAReceipt() {
        var f = new PaymentFixture(); when(f.gateway.verifySignature(anyMap(), anyString())).thenReturn(false);
        f.controller.handleIPN(callback("2_first", "txn_one")); verifyNoInteractions(f.attempts, f.receipts, f.handler);
        when(f.gateway.verifySignature(anyMap(), anyString())).thenReturn(true);
        var wrong = new HashMap<>(callback("2_first", "txn_one")); wrong.put("vnp_Amount", "2000");
        f.controller.handleIPN(wrong); verifyNoInteractions(f.attempts, f.receipts, f.handler);
    }
    @Test void excessRefundUsesItsOwnGatewayIdentifiersAndDoesNotChangeOriginalOrder() {
        var f = new PaymentFixture(); f.controller.handleIPN(callback("2_first", "txn_one")); f.controller.handleIPN(callback("2_second", "txn_two"));
        GatewayReceipt extra = f.receiptsByTransaction.get("txn_two"); extra.setTransactionDate("20261109115900");
        when(f.receipts.findById(extra.getReceiptId())).thenReturn(Optional.of(extra)); when(f.receipts.findByIdForUpdate(extra.getReceiptId())).thenReturn(Optional.of(extra));
        when(f.gateway.refundPayment(any(), any(), anyString(), anyString())).thenReturn(Map.of("vnp_ResponseCode", "00"));
        var c = new PaymentReconciliationController(f.receipts, f.payments, f.gateway, f.engagement);
        var manager = new UsernamePasswordAuthenticationToken("1", "", List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));
        c.refund(extra.getReceiptId(), manager);
        var source = org.mockito.ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(f.gateway).refundPayment(source.capture(), argThat(a -> a.compareTo(BigDecimal.TEN) == 0), anyString(), eq("excess-receipt:txn_two"));
        assertEquals("txn_two", source.getValue().getReferenceCode()); assertEquals("2_second", source.getValue().getGatewayReference());
        assertEquals("REFUNDED", extra.getStatus()); assertEquals("PAID", f.order.getPaymentStatus()); assertEquals("txn_one", f.order.getReferenceCode());
        assertThrows(ResponseStatusException.class, () -> c.refund(extra.getReceiptId(), manager));
        verify(f.handler, times(1)).handlePaymentConfirmation(any(), any());
    }
    @Test void unconfirmedExcessRefundRequiresReviewAndCannotBeBlindlyRetried() {
        var f = new PaymentFixture(); f.controller.handleIPN(callback("2_first", "txn_one")); f.controller.handleIPN(callback("2_second", "txn_two"));
        GatewayReceipt extra = f.receiptsByTransaction.get("txn_two"); extra.setTransactionDate("20261109115900");
        when(f.receipts.findById(extra.getReceiptId())).thenReturn(Optional.of(extra)); when(f.receipts.findByIdForUpdate(extra.getReceiptId())).thenReturn(Optional.of(extra));
        when(f.gateway.refundPayment(any(), any(), anyString(), anyString())).thenReturn(Map.of("vnp_ResponseCode", "99"));
        var c = new PaymentReconciliationController(f.receipts, f.payments, f.gateway, f.engagement);
        var manager = new UsernamePasswordAuthenticationToken("1", "", List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));
        c.refund(extra.getReceiptId(), manager); assertEquals("REVIEW_REQUIRED", extra.getStatus());
        assertThrows(ResponseStatusException.class, () -> c.refund(extra.getReceiptId(), manager));
        verify(f.gateway, times(1)).refundPayment(any(), any(), anyString(), anyString()); assertEquals("PAID", f.order.getPaymentStatus());
    }
    static UserMembership term(boolean expired) {
        UserMembership m = new UserMembership(); m.setMembershipId(1L); m.setUserId(MEMBER); m.setStatus(expired ? "EXPIRED" : "ACTIVE");
        m.setStartDate(LocalDate.now().minusDays(30)); m.setEndDate(expired ? LocalDate.now().minusDays(1) : LocalDate.now().plusDays(1));
        m.setInitialQuotaSessions(1); m.setUsedQuotaSessions(1); m.setInitialQuotaCourts(10); m.setRemainingQuotaCourts(9); m.setHeldQuotaCourts(1); return m;
    }
    @Test void expiredPresentExcusedPresentRoundTripDoesNotConsumeASecondUnit() {
        var rows = mock(UserMembershipRepository.class); var m = term(true); when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m));
        var service = new MembershipService(rows, mock(MembershipPackageRepository.class), null, null, null);
        Booking b = Booking.builder().membershipId(1L).usesMembershipQuota(true).attendanceStatus(AttendanceStatus.PRESENT).build();
        service.settleAttendanceQuota(b, AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED_ABSENCE, LocalDateTime.now().minusDays(2));
        assertEquals("USED", b.getQuotaState()); assertEquals(1, m.getUsedQuotaSessions());
        service.settleAttendanceQuota(b, AttendanceStatus.EXCUSED_ABSENCE, AttendanceStatus.PRESENT, LocalDateTime.now().minusDays(2));
        assertEquals("USED", b.getQuotaState()); assertEquals(1, m.getUsedQuotaSessions()); assertEquals(0, m.getRemainingQuotaSessions());
    }
    @Test void activeAttendanceRoundTripReturnsAndConsumesQuotaOnce() {
        var rows = mock(UserMembershipRepository.class); var m = term(false); when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m));
        var service = new MembershipService(rows, mock(MembershipPackageRepository.class), null, null, null);
        Booking b = Booking.builder().membershipId(1L).usesMembershipQuota(true).quotaState("USED").build();
        service.settleAttendanceQuota(b, AttendanceStatus.PRESENT, AttendanceStatus.EXCUSED_ABSENCE, LocalDateTime.now().minusDays(2));
        assertEquals("RELEASED", b.getQuotaState()); assertEquals(1, m.getRemainingQuotaSessions());
        service.settleAttendanceQuota(b, AttendanceStatus.EXCUSED_ABSENCE, AttendanceStatus.PRESENT, LocalDateTime.now().minusDays(2));
        service.settleAttendanceQuota(b, AttendanceStatus.PRESENT, AttendanceStatus.PRESENT, LocalDateTime.now().minusDays(2));
        assertEquals(1, m.getUsedQuotaSessions()); assertEquals(0, m.getRemainingQuotaSessions());
    }
    @Test void quotaReturnedBeforeExpiryIsNotSpentAgainAfterExpiry() {
        var rows = mock(UserMembershipRepository.class); var m = term(true); m.setUsedQuotaSessions(0); m.setRemainingQuotaSessions(1);
        when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m)); var service = new MembershipService(rows, mock(MembershipPackageRepository.class), null, null, null);
        Booking b = Booking.builder().membershipId(1L).quotaState("RELEASED").build();
        service.settleAttendanceQuota(b, AttendanceStatus.EXCUSED_ABSENCE, AttendanceStatus.PRESENT, LocalDateTime.now().minusDays(2));
        assertEquals("FORFEITED", b.getQuotaState()); assertEquals(0, m.getUsedQuotaSessions()); assertEquals(1, m.getRemainingQuotaSessions());
    }
    @Test void ambiguousLegacyExcusedAccountingRequiresReviewInsteadOfGuessing() {
        var rows = mock(UserMembershipRepository.class); var m = term(true); when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m));
        var service = new MembershipService(rows, mock(MembershipPackageRepository.class), null, null, null);
        Booking b = Booking.builder().membershipId(1L).build();
        assertThrows(ResponseStatusException.class, () -> service.settleAttendanceQuota(b, AttendanceStatus.EXCUSED_ABSENCE, AttendanceStatus.PRESENT, LocalDateTime.now().minusDays(2)));
        assertEquals(1, m.getUsedQuotaSessions()); verify(rows, never()).save(any());
    }
    @Test void pastMaintenanceBookingIsCancelledAndItsExactHoldIsSettledOnce() {
        var courts = mock(CourtBookingRepository.class); var rows = mock(UserMembershipRepository.class); var maintenance = mock(CourtMaintenanceRepository.class);
        var m = term(true); when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m)); when(rows.findByStatusIgnoreCase("EXPIRED")).thenReturn(List.of(m));
        CourtBooking b = new CourtBooking(); b.setCourtBookingId(2L); b.setCourtId(3L); b.setMemberId(MEMBER); b.setMembershipId(1L); b.setStatus("CONFIRMED"); b.setUsesMembershipQuota(true); b.setQuotaHoursUsed(BigDecimal.ONE); b.setStartTime(LocalDateTime.now().minusDays(1)); b.setEndTime(b.getStartTime().plusHours(1));
        when(courts.findByStatus("CONFIRMED")).thenReturn(List.of(b)); when(courts.findByMemberIdOrderByStartTimeAsc(MEMBER)).thenReturn(List.of(b)); when(courts.findByIdForUpdate(2L)).thenReturn(Optional.of(b));
        when(maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(3L), any(), any())).thenReturn(true);
        var quota = mock(MembershipService.class); var payments = mock(PaymentService.class);
        var lifecycle = new BookingLifecycleService(mock(BookingRepository.class), courts, mock(ClassSessionRepository.class), mock(SportsCourtRepository.class), rows, quota, payments, mock(EngagementService.class));
        ReflectionTestUtils.setField(lifecycle, "maintenance", maintenance); lifecycle.reconcile(); lifecycle.reconcile();
        assertEquals("CANCELLED", b.getStatus()); assertEquals("FORFEITED", b.getQuotaState()); assertFalse(b.getUsesMembershipQuota());
        assertEquals(0, m.getHeldQuotaCourts()); assertEquals(10, m.getRemainingQuotaCourts());
        verify(quota, never()).consumeCourtQuota(any(), anyDouble()); verifyNoInteractions(payments);
        verify(courts, times(1)).save(b);
    }
    @Test void expiryPreservesUnresolvedLegacyHoldsInsteadOfSilentlyErasingThem() {
        var rows = mock(UserMembershipRepository.class); var m = term(true);
        when(rows.findByStatusIgnoreCase("EXPIRED")).thenReturn(List.of(m)); when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m));
        new BookingLifecycleService(mock(BookingRepository.class), mock(CourtBookingRepository.class), mock(ClassSessionRepository.class), mock(SportsCourtRepository.class), rows, mock(MembershipService.class), mock(PaymentService.class), mock(EngagementService.class)).reconcile();
        assertEquals(1, m.getHeldQuotaCourts()); assertEquals(9, m.getRemainingQuotaCourts());
    }

    static class CheckInFixture {
        final UserRepository users = mock(UserRepository.class);
        final SportsCourtRepository sports = mock(SportsCourtRepository.class);
        final CourtBookingRepository courts = mock(CourtBookingRepository.class);
        final CourtMaintenanceRepository maintenance = mock(CourtMaintenanceRepository.class);
        final PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
        final BookingRepository bookings = mock(BookingRepository.class);
        final ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        final PublicFacilityRepository facilities = mock(PublicFacilityRepository.class);
        final FacilityCourtSyncService sync = mock(FacilityCourtSyncService.class);
        final UserMembershipRepository rows = mock(UserMembershipRepository.class);
        final UserMembership m = term(false);
        final MembershipService quota = new MembershipService(rows, mock(MembershipPackageRepository.class), null, null, null);
        final CourtBooking b = new CourtBooking();
        final PaymentTransaction p = new PaymentTransaction();
        final SportsCourt court = new SportsCourt();
        final CheckInService checkIn;
        final CheckInEligibilityService eligibility;
        CheckInFixture() {
            b.setCourtBookingId(4L); b.setCourtId(3L); b.setMemberId(MEMBER); b.setPaymentId(2L); b.setStatus("CONFIRMED"); b.setStartTime(LocalDateTime.now().minusMinutes(5)); b.setEndTime(LocalDateTime.now().plusMinutes(55)); b.setAmountPaid(BigDecimal.TEN);
            court.setCourtId(3L); court.setActive(true); court.setOpensAt(LocalTime.MIN); court.setClosesAt(LocalTime.MAX);
            p.setPaymentId(2L); p.setMemberId(MEMBER); p.setPaymentStatus("PAID"); p.setBookingType("COURT"); p.setAmount(BigDecimal.TEN);
            when(users.findByIdForUpdate(MEMBER)).thenReturn(Optional.of(User.builder().userId(MEMBER).role("MEMBER").status("ACTIVE").build()));
            when(courts.findCheckInEligibleBookings(eq(MEMBER), any(), any(), any())).thenReturn(List.of(b)); when(courts.findByIdForUpdate(4L)).thenReturn(Optional.of(b));
            when(sports.findByIdForUpdate(3L)).thenReturn(Optional.of(court)); when(payments.findByIdForUpdate(2L)).thenReturn(Optional.of(p)); when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m));
            eligibility = new CheckInEligibilityService(sports, courts, maintenance, payments, bookings, sessions, facilities, sync, quota);
            ReflectionTestUtils.setField(eligibility, "membershipRows", rows);
            checkIn = new CheckInService(mock(MemberCheckInRepository.class), users, bookings, courts, quota); ReflectionTestUtils.setField(checkIn, "eligibility", eligibility);
        }
        void useQuota() { b.setPaymentId(null); b.setMembershipId(1L); b.setUsesMembershipQuota(true); b.setQuotaState("HELD"); b.setQuotaHoursUsed(BigDecimal.ONE); }
    }
    @Test void retailMemberWithoutAPackageCanCheckInWithPaidProof() {
        var f = new CheckInFixture(); f.checkIn.checkInBooking(MEMBER, 4L); assertEquals("CHECKED_IN", f.b.getStatus());
        verifyNoInteractions(f.rows);
    }
    @Test void checkInRejectsMaintenanceAndClosedCourtWithoutChangingBookingOrQuota() {
        var f = new CheckInFixture(); f.useQuota(); when(f.maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(3L), any(), any())).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> f.checkIn.checkInBooking(MEMBER, 4L)); assertEquals(1, f.m.getHeldQuotaCourts()); assertEquals("CONFIRMED", f.b.getStatus()); verify(f.courts, never()).save(any());
        when(f.maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(3L), any(), any())).thenReturn(false); f.court.setActive(false);
        assertThrows(ResponseStatusException.class, () -> f.checkIn.checkInBooking(MEMBER, 4L)); assertEquals(1, f.m.getHeldQuotaCourts());
    }
    @Test void checkInRejectsUnpaidRefundedWrongOwnerAndMissingProof() {
        var f = new CheckInFixture(); f.p.setPaymentStatus("PENDING");
        assertThrows(ResponseStatusException.class, () -> f.checkIn.checkInBooking(MEMBER, 4L));
        f.p.setPaymentStatus("REFUNDED"); assertThrows(ResponseStatusException.class, () -> f.checkIn.checkInBooking(MEMBER, 4L));
        f.p.setPaymentStatus("PAID"); f.p.setMemberId(777L); assertThrows(ResponseStatusException.class, () -> f.checkIn.checkInBooking(MEMBER, 4L));
        f.b.setPaymentId(null); assertThrows(ResponseStatusException.class, () -> f.checkIn.checkInBooking(MEMBER, 4L));
        assertEquals("CONFIRMED", f.b.getStatus()); verify(f.courts, never()).save(any());
    }
    @Test void expiredQuotaCannotCheckInBeforeTheExpiryJobRuns() {
        var f = new CheckInFixture(); f.useQuota(); f.m.setEndDate(LocalDate.now().minusDays(1));
        assertThrows(ResponseStatusException.class, () -> f.checkIn.checkInBooking(MEMBER, 4L)); assertEquals(1, f.m.getHeldQuotaCourts()); assertEquals(0, f.m.getUsedQuotaCourts());
    }
    @Test void quotaCheckInConsumesOneHoldAndRepeatedScanCannotConsumeAgain() {
        var f = new CheckInFixture(); f.useQuota(); f.checkIn.checkInBooking(MEMBER, 4L);
        assertEquals("USED", f.b.getQuotaState()); assertEquals(0, f.m.getHeldQuotaCourts()); assertEquals(1, f.m.getUsedQuotaCourts());
        assertThrows(ResponseStatusException.class, () -> f.checkIn.checkInBooking(MEMBER, 4L)); assertEquals(1, f.m.getUsedQuotaCourts()); verify(f.courts, times(1)).save(f.b);
    }

    Booking classBooking(CheckInFixture f, boolean quota) {
        Booking b = Booking.builder().bookingId(6L).sessionId(7L).memberId(MEMBER).status("CONFIRMED").feeAmount(BigDecimal.TEN).paymentId(quota ? null : 2L)
            .usesMembershipQuota(quota).membershipId(quota ? 1L : null).quotaState(quota ? "HELD" : null).build();
        ClassSession session = ClassSession.builder().sessionId(7L).facilityId(8L).sportId(1L).startTime(f.b.getStartTime()).endTime(f.b.getEndTime()).build();
        PublicFacility facility = new PublicFacility(); facility.setFacilityId(8L); facility.setActive(true);
        when(f.sessions.findByIdForUpdate(7L)).thenReturn(Optional.of(session)); when(f.facilities.findByIdForUpdate(8L)).thenReturn(Optional.of(facility));
        when(f.sync.getCourtIdsForFacility(8L, 1L, null)).thenReturn(List.of(3L)); when(f.bookings.findByIdForUpdate(6L)).thenReturn(Optional.of(b)); f.p.setBookingType("CLASS");
        return b;
    }
    @Test void classAdmissionRechecksPaymentFacilityAndMaintenanceWithoutMarkingAttendance() {
        var f = new CheckInFixture(); Booking b = classBooking(f, false);
        assertSame(b, f.eligibility.validateClass(b, MEMBER, LocalDateTime.now())); assertEquals(AttendanceStatus.PENDING, b.getAttendanceStatus());
        f.p.setPaymentStatus("PENDING"); assertThrows(ResponseStatusException.class, () -> f.eligibility.validateClass(b, MEMBER, LocalDateTime.now()));
        f.p.setPaymentStatus("PAID"); var facility = f.facilities.findByIdForUpdate(8L).orElseThrow(); facility.setActive(false);
        assertThrows(ResponseStatusException.class, () -> f.eligibility.validateClass(b, MEMBER, LocalDateTime.now())); facility.setActive(true);
        when(f.maintenance.existsByCourtIdAndStartTimeLessThanAndEndTimeGreaterThan(eq(3L), any(), any())).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> f.eligibility.validateClass(b, MEMBER, LocalDateTime.now()));
        assertEquals("CONFIRMED", b.getStatus()); verifyNoInteractions(f.rows);
    }
    @Test void classAdmissionChecksQuotaExpiryButNeverConsumesTheCoachsAttendanceQuota() {
        var f = new CheckInFixture(); Booking b = classBooking(f, true); f.m.setUsedQuotaSessions(0); f.m.setHeldQuotaSessions(1);
        f.eligibility.validateClass(b, MEMBER, LocalDateTime.now()); assertEquals(1, f.m.getHeldQuotaSessions()); assertEquals(0, f.m.getUsedQuotaSessions());
        f.m.setEndDate(LocalDate.now().minusDays(1)); assertThrows(ResponseStatusException.class, () -> f.eligibility.validateClass(b, MEMBER, LocalDateTime.now()));
        assertEquals(1, f.m.getHeldQuotaSessions()); assertEquals(AttendanceStatus.PENDING, b.getAttendanceStatus());
    }
    @Test void expiredPendingExcusedPresentSequenceForfeitsHoldWithoutChargingItTwice() {
        var rows = mock(UserMembershipRepository.class); var m = term(true); m.setUsedQuotaSessions(0); m.setHeldQuotaSessions(1);
        when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m)); var service = new MembershipService(rows, mock(MembershipPackageRepository.class), null, null, null);
        Booking b = Booking.builder().membershipId(1L).quotaState("HELD").build();
        service.settleAttendanceQuota(b, AttendanceStatus.PENDING, AttendanceStatus.EXCUSED_ABSENCE, LocalDateTime.now().minusDays(2));
        service.settleAttendanceQuota(b, AttendanceStatus.EXCUSED_ABSENCE, AttendanceStatus.PRESENT, LocalDateTime.now().minusDays(2));
        assertEquals("FORFEITED", b.getQuotaState()); assertEquals(0, m.getHeldQuotaSessions()); assertEquals(0, m.getUsedQuotaSessions()); assertFalse(service.isEffective(m));
    }
    @Test void cancelledClassSettlesExpiredHoldWithoutLeavingAConfirmedQuotaBooking() {
        var rows = mock(UserMembershipRepository.class); var m = term(true); m.setUsedQuotaSessions(0); m.setHeldQuotaSessions(1);
        when(rows.findByStatusIgnoreCase("EXPIRED")).thenReturn(List.of(m)); when(rows.findByIdForUpdate(1L)).thenReturn(Optional.of(m));
        var bookings = mock(BookingRepository.class); var sessions = mock(ClassSessionRepository.class);
        Booking b = Booking.builder().bookingId(2L).memberId(MEMBER).sessionId(3L).membershipId(1L).usesMembershipQuota(true).quotaState("HELD").status("CONFIRMED").build();
        when(bookings.findByMemberId(MEMBER)).thenReturn(List.of(b)); when(bookings.findByIdForUpdate(2L)).thenReturn(Optional.of(b));
        when(sessions.findById(3L)).thenReturn(Optional.of(ClassSession.builder().sessionId(3L).status("CANCELLED").build()));
        var lifecycle = new BookingLifecycleService(bookings, mock(CourtBookingRepository.class), sessions, mock(SportsCourtRepository.class), rows, mock(MembershipService.class), mock(PaymentService.class), mock(EngagementService.class));
        lifecycle.reconcile(); lifecycle.reconcile(); assertEquals("CANCELLED", b.getStatus()); assertEquals("FORFEITED", b.getQuotaState());
        assertEquals(0, m.getHeldQuotaSessions()); assertEquals(0, m.getUsedQuotaSessions()); verify(bookings, times(1)).save(b);
    }
}
