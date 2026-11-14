package com.sporthub.backend.service;

import com.sporthub.backend.controller.VNPayWebhookController;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.gateway.VNPayGateway;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class VNPayCancellationCallbackTest {
    final PaymentTransactionRepository payments = mock(PaymentTransactionRepository.class);
    final BookingRepository bookings = mock(BookingRepository.class);
    final ClassSessionRepository sessions = mock(ClassSessionRepository.class);
    final VoucherService vouchers = mock(VoucherService.class);
    final VNPayGateway gateway = mock(VNPayGateway.class);
    final PaymentAttemptService attempts = mock(PaymentAttemptService.class);
    final UnpaidPaymentCancellationService cancellation = new UnpaidPaymentCancellationService(payments, bookings,
        mock(CourtBookingRepository.class), sessions, mock(UserMembershipRepository.class), mock(ReceptionPaymentRepository.class), vouchers);
    final VNPayWebhookController controller = new VNPayWebhookController(gateway, payments, List.of(), cancellation);
    final PaymentTransaction payment = new PaymentTransaction();
    final Booking booking = new Booking();
    final ClassSession session = new ClassSession();

    VNPayCancellationCallbackTest() {
        payment.setPaymentId(77L); payment.setMemberId(9L); payment.setPaymentMethod("VNPAY");
        payment.setPaymentStatus("PENDING"); payment.setBookingType("CLASS"); payment.setAmount(BigDecimal.valueOf(170000));
        booking.setBookingId(42L); booking.setSessionId(3L); booking.setStatus("BOOKED");
        session.setSessionId(3L); session.setBookedSlots(1); session.setStatus("SCHEDULED");
        when(payments.findByIdForUpdate(77L)).thenReturn(Optional.of(payment));
        when(bookings.findByPaymentId(77L)).thenReturn(booking);
        when(bookings.findByIdForUpdate(42L)).thenReturn(Optional.of(booking));
        when(sessions.findByIdForUpdate(3L)).thenReturn(Optional.of(session));
        when(gateway.verifySignature(anyMap(), anyString())).thenReturn(true);
        ReflectionTestUtils.setField(controller, "attempts", attempts);
    }
    Map<String, String> callback() {
        return Map.of("vnp_TxnRef", "77_attempt", "vnp_ResponseCode", "24", "vnp_Amount", "17000000", "vnp_SecureHash", "valid");
    }
    @Test void signedGatewayCancelReleasesBookingBeforeReturningAndIsIdempotent() {
        controller.handleReturn(callback()); controller.handleIPN(callback());
        assertEquals("CANCELLED", payment.getPaymentStatus()); assertEquals("CANCELLED", booking.getStatus());
        assertEquals(0, session.getBookedSlots()); verify(vouchers, times(1)).release(payment);
        verify(bookings, times(1)).save(booking); verify(attempts, never()).recordSuccess(any(), any(), any());
    }
    @Test void cancelledAttemptCannotUndoAnAlreadyPaidOrder() {
        payment.setPaymentStatus("PAID"); booking.setStatus("CONFIRMED");
        var result = (Map<?, ?>) controller.handleReturn(callback()).getBody();
        assertEquals("PAID", payment.getPaymentStatus()); assertEquals("CONFIRMED", booking.getStatus());
        assertEquals(Boolean.TRUE, result.get("success")); verifyNoInteractions(vouchers);
    }
    @Test void invalidSignatureCannotCancelAnOrderThroughThePublicWebhook() {
        when(gateway.verifySignature(anyMap(), anyString())).thenReturn(false);
        controller.handleReturn(callback());
        assertEquals("PENDING", payment.getPaymentStatus()); assertEquals("BOOKED", booking.getStatus());
        verifyNoInteractions(vouchers); verify(bookings, never()).save(any());
    }
}
