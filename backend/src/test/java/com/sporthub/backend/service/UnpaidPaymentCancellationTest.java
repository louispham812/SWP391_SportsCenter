package com.sporthub.backend.service;

import com.sporthub.backend.controller.PaymentController;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.gateway.PaymentGateway;
import com.sporthub.backend.service.payment.MembershipPaymentHandler;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class UnpaidPaymentCancellationTest {
    final PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
    final BookingRepository bookings = mock(BookingRepository.class);
    final CourtBookingRepository courts = mock(CourtBookingRepository.class);
    final ClassSessionRepository sessions = mock(ClassSessionRepository.class);
    final UserMembershipRepository memberships = mock(UserMembershipRepository.class);
    final ReceptionPaymentRepository receipts = mock(ReceptionPaymentRepository.class);
    final VoucherService vouchers = mock(VoucherService.class);
    final UnpaidPaymentCancellationService service = new UnpaidPaymentCancellationService(payments, bookings, courts, sessions, memberships, receipts, vouchers);

    PaymentTransaction payment(String type) {
        var p = new PaymentTransaction(); p.setPaymentId(77L); p.setMemberId(9L);
        p.setBookingType(type); p.setPaymentMethod("VNPAY"); p.setPaymentStatus("PENDING"); return p;
    }
    Booking classBooking(PaymentTransaction payment) {
        var b = new Booking(); b.setBookingId(42L); b.setMemberId(9L); b.setSessionId(3L); b.setPaymentId(77L); b.setStatus("BOOKED");
        var session = new ClassSession(); session.setSessionId(3L); session.setStatus("SCHEDULED"); session.setBookedSlots(1);
        when(bookings.findByPaymentId(77L)).thenReturn(b);
        when(bookings.findByIdForUpdate(42L)).thenReturn(Optional.of(b));
        when(sessions.findByIdForUpdate(3L)).thenReturn(Optional.of(session)); return b;
    }
    @Test void abandoningClassReleasesSeatAndVoucherOnlyOnce() {
        var p = payment("CLASS"); var b = classBooking(p);
        service.cancelLocked(p); service.cancelLocked(p);
        assertEquals("CANCELLED", p.getPaymentStatus()); assertEquals("CANCELLED", b.getStatus());
        var session = sessions.findByIdForUpdate(3L).orElseThrow();
        assertEquals(0, session.getBookedSlots()); assertEquals("SCHEDULED", session.getStatus());
        verify(vouchers, times(1)).release(p); verify(bookings, times(1)).save(b);
    }
    @Test void paidGatewayReceiptWinsAndBookingIsPreserved() {
        var p = payment("CLASS"); p.setPaymentStatus("PAID");
        assertSame(p, service.cancelLocked(p)); assertEquals("PAID", p.getPaymentStatus());
        verifyNoInteractions(bookings, courts, memberships, vouchers);
    }
    @Test void cashHoldsAreNotCancelledByBrowserBackCleanup() {
        var p = payment("CLASS"); p.setPaymentMethod("CASH_COUNTER");
        assertThrows(ResponseStatusException.class, () -> service.cancelLocked(p));
        verifyNoInteractions(bookings, courts, memberships, vouchers);
    }
    @Test void abandonedPtAlsoReleasesCoachSession() {
        var p = payment("PT"); classBooking(p); service.cancelLocked(p);
        assertEquals("CANCELLED", sessions.findByIdForUpdate(3L).orElseThrow().getStatus());
    }
    @Test void abandonedCourtBecomesAvailable() {
        var p = payment("COURT"); var court = new CourtBooking(); court.setCourtBookingId(2L); court.setStatus("PENDING");
        when(courts.findByPaymentId(77L)).thenReturn(court); when(courts.findByIdForUpdate(2L)).thenReturn(Optional.of(court));
        service.cancelLocked(p); assertEquals("CANCELLED", court.getStatus()); verify(vouchers).release(p);
    }
    @Test void failedMembershipCanBePurchasedAgainAfterAbandonment() {
        var p = payment("MEMBERSHIP_PACKAGE"); p.setMembershipId(3L); p.setPaymentStatus("FAILED");
        var m = new UserMembership(); m.setMembershipId(3L); m.setUserId(9L); m.setStatus("PENDING_PAYMENT");
        when(memberships.findByIdForUpdate(3L)).thenReturn(Optional.of(m));
        service.cancelLocked(p); assertEquals("CANCELLED", m.getStatus()); assertEquals("CANCELLED", p.getPaymentStatus());
    }
    @Test void memberCannotCancelAnotherMembersPayment() {
        var p = payment("CLASS"); when(payments.findByIdForUpdate(77L)).thenReturn(Optional.of(p));
        var controller = new PaymentController(payments, mock(PaymentGateway.class));
        ReflectionTestUtils.setField(controller, "unpaidPayments", service);
        var auth = new UsernamePasswordAuthenticationToken("10", "", List.of(new SimpleGrantedAuthority("ROLE_MEMBER")));
        var error = assertThrows(ResponseStatusException.class, () -> controller.cancelUnpaid(77L, auth));
        assertEquals(403, error.getStatusCode().value()); verifyNoInteractions(bookings, vouchers);
    }
    @Test void cancelledMembershipPaidLaterRequestsRefundRatherThanGrantingBenefits() {
        var p = payment("MEMBERSHIP_PACKAGE"); p.setMembershipId(3L); p.setPaymentStatus("PAID");
        var m = new UserMembership(); m.setMembershipId(3L); m.setUserId(9L); m.setStatus("CANCELLED");
        when(memberships.findByIdForUpdate(3L)).thenReturn(Optional.of(m));
        var late = mock(LatePaymentService.class);
        var handler = new MembershipPaymentHandler(receipts, memberships, mock(EngagementService.class));
        ReflectionTestUtils.setField(handler, "latePayments", late);
        assertFalse(handler.handlePaymentConfirmation(p, 100d).isSuccess());
        verify(late).requestRefund(p, 3L, "MEMBERSHIP"); assertEquals("CANCELLED", m.getStatus());
        verify(memberships, never()).save(any());
    }
}
