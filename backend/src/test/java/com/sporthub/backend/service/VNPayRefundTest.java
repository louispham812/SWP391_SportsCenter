package com.sporthub.backend.service;

import com.sporthub.backend.controller.RefundRequestController;
import com.sporthub.backend.dto.*;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.gateway.VNPayGateway;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class VNPayRefundTest {
    final RefundRequestRepository refunds = mock(RefundRequestRepository.class);
    final PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
    final UserRepository users = mock(UserRepository.class);
    final VNPayGateway gateway = mock(VNPayGateway.class);
    final BookingService bookings = mock(BookingService.class);
    final MembershipService memberships = mock(MembershipService.class);
    final RefundRequestController controller = new RefundRequestController(refunds, users, payments, mock(ReceptionPaymentRepository.class), null, gateway, bookings, memberships);
    final UsernamePasswordAuthenticationToken manager = actor("MANAGER");
    static UsernamePasswordAuthenticationToken actor(String role) { return new UsernamePasswordAuthenticationToken("9", "", List.of(new SimpleGrantedAuthority("ROLE_" + role))); }
    PaymentTransaction payment() {
        PaymentTransaction p = new PaymentTransaction(); p.setPaymentId(2L); p.setMemberId(9L); p.setAmount(BigDecimal.TEN); p.setPaymentMethod("VNPAY"); p.setPaymentStatus("PAID");
        when(payments.findByIdForUpdate(2L)).thenReturn(Optional.of(p)); return p;
    }
    RefundRequest request() {
        RefundRequest r = RefundRequest.builder().refundId(1L).memberId(9L).transactionId(2L).bookingId(3L).bookingType("COURT").refundAmount(BigDecimal.TEN).reason("Cancel").status("PENDING_APPROVAL").build();
        when(refunds.findByIdForUpdate(1L)).thenReturn(Optional.of(r)); when(refunds.save(any())).thenAnswer(i -> i.getArgument(0)); return r;
    }
    @Test void unsuccessfulGatewayRefundKeepsPaymentPaidAndRequestPending() {
        PaymentTransaction p = payment(); RefundRequest r = request();
        when(gateway.refundPayment(any(), any(), any())).thenReturn(Map.of("vnp_ResponseCode", "99"));
        controller.decideRefund(1L, new RefundDecisionRequest(true, null), manager);
        assertEquals("PAID", p.getPaymentStatus()); assertEquals("PENDING_APPROVAL", r.getStatus());
        verify(bookings, never()).cancelBookingAfterRefund(any(), any(), any()); verify(payments, never()).save(any());
    }
    @Test void successfulGatewayRefundCompletesOnlyAfterGatewayConfirms() {
        PaymentTransaction p = payment(); RefundRequest r = request();
        when(gateway.refundPayment(any(), any(), any())).thenReturn(Map.of("vnp_ResponseCode", "00"));
        controller.decideRefund(1L, new RefundDecisionRequest(true, null), manager);
        assertEquals("REFUNDED", p.getPaymentStatus()); assertEquals("APPROVED", r.getStatus());
        verify(bookings).cancelBookingAfterRefund(3L, "COURT", 1L);
        assertThrows(ResponseStatusException.class, () -> controller.decideRefund(1L, new RefundDecisionRequest(true, null), manager));
        verify(gateway, times(1)).refundPayment(any(), any(), any());
    }
    @Test void memberCannotApproveRefund() {
        assertThrows(ResponseStatusException.class, () -> controller.decideRefund(1L, new RefundDecisionRequest(true, null), actor("MEMBER")));
        verifyNoInteractions(refunds, payments, gateway);
    }
    @Test void cannotRequestRefundForAnotherMembersPayment() {
        PaymentTransaction p = payment(); p.setMemberId(777L);
        when(users.findById(9L)).thenReturn(Optional.of(User.builder().userId(9L).build()));
        assertThrows(ResponseStatusException.class, () -> controller.createRefundRequest(new CreateRefundRequest(2L, null, null, BigDecimal.TEN, "Cancel", null, null, null), actor("MEMBER")));
        verify(refunds, never()).save(any());
    }
    @Test void cannotRequestRefundForUnpaidTransaction() {
        PaymentTransaction p = payment(); p.setPaymentStatus("PENDING");
        when(users.findById(9L)).thenReturn(Optional.of(User.builder().userId(9L).build()));
        assertThrows(ResponseStatusException.class, () -> controller.createRefundRequest(new CreateRefundRequest(2L, null, null, BigDecimal.TEN, "Cancel", null, null, null), actor("MEMBER")));
        verify(refunds, never()).save(any());
    }
    @Test void timelyCancellationQueuesRefundWithoutPretendingMoneyWasReturned() {
        BookingRepository bookingRepo = mock(BookingRepository.class); ClassSessionRepository sessions = mock(ClassSessionRepository.class);
        Booking b = Booking.builder().bookingId(3L).memberId(9L).sessionId(4L).status("CONFIRMED").paymentId(2L).feeAmount(BigDecimal.TEN).build();
        ClassSession session = ClassSession.builder().sessionId(4L).startTime(LocalDateTime.now().plusDays(1)).endTime(LocalDateTime.now().plusDays(1).plusHours(1)).className("Class").build();
        when(bookingRepo.findByIdForUpdate(3L)).thenReturn(Optional.of(b)); when(sessions.findByIdForUpdate(4L)).thenReturn(Optional.of(session));
        PaymentTransaction p = payment(); p.setBookingType("CLASS");
        when(payments.findById(2L)).thenReturn(Optional.of(p)); when(users.findById(9L)).thenReturn(Optional.of(User.builder().userId(9L).fullName("Member").build()));
        when(refunds.save(any())).thenAnswer(i -> { RefundRequest r = i.getArgument(0); r.setRefundId(1L); return r; });
        BookingService service = new BookingService(bookingRepo, sessions, users, mock(PublicSportRepository.class), mock(PublicFacilityRepository.class), mock(SportsCourtRepository.class), mock(CourtBookingRepository.class), mock(CourtMaintenanceRepository.class), payments, mock(UserMembershipRepository.class), mock(MembershipPackageRepository.class), memberships, null, null, null, gateway, refunds, null);
        CancelBookingResponse result = service.cancelClassBooking(3L, 9L);
        assertEquals("PENDING_APPROVAL", result.getStatus()); assertEquals("CANCELLED", b.getStatus()); assertEquals("PAID", p.getPaymentStatus());
        verifyNoInteractions(gateway);
    }
}
