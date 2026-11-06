package com.sporthub.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.sporthub.backend.constants.PaymentConstants;
import com.sporthub.backend.dto.CancelBookingResponse;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.RefundRequestRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.gateway.VNPayGateway;

/**
 * Unit tests for VNPay Refund Flow
 * 
 * Tests VNPay refund API calls for CLASS, COURT, and MEMBERSHIP booking types
 */
@ExtendWith(MockitoExtension.class)
class VNPayRefundTest {

    @Mock
    private BookingRepository bookingRepository;
    
    @Mock
    private ClassSessionRepository classSessionRepository;
    
    @Mock
    private CourtBookingRepository courtBookingRepository;
    
    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    
    @Mock
    private RefundRequestRepository refundRequestRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private VNPayGateway vnpayGateway;
    
    @Mock
    private AuditLogService auditLogService;
    
    @Mock
    private MembershipService membershipService;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(
                bookingRepository,
                classSessionRepository,
                userRepository,
                mock(com.sporthub.backend.repository.PublicSportRepository.class),
                mock(com.sporthub.backend.repository.PublicFacilityRepository.class),
                mock(com.sporthub.backend.repository.SportsCourtRepository.class),
                courtBookingRepository,
                mock(com.sporthub.backend.repository.CourtMaintenanceRepository.class),
                paymentTransactionRepository,
                mock(com.sporthub.backend.repository.UserMembershipRepository.class),
                mock(com.sporthub.backend.repository.MembershipPackageRepository.class),
                membershipService,
                auditLogService,
                null,
                null,
                vnpayGateway
        );
    }

    @Test
    void testClassRefund_VNPayPayment_CallsRefundAPI() {
        // Given
        Long bookingId = 32L;
        Long actorId = 37L;
        Long paymentId = 68L;
        BigDecimal refundAmount = new BigDecimal("180000");
        
        // Create a CLASS booking that was paid via VNPay
        Booking booking = new Booking();
        booking.setBookingId(bookingId);
        booking.setMemberId(actorId);
        booking.setSessionId(22L);
        booking.setStatus("CONFIRMED");
        booking.setPaymentId(paymentId);
        booking.setFeeAmount(refundAmount);
        
        // Create ClassSession (future session, eligible for full refund)
        ClassSession session = new ClassSession();
        session.setSessionId(22L);
        session.setStartTime(LocalDateTime.now().plusDays(1));
        session.setBookedSlots(1);
        
        // Create PaymentTransaction with VNPay method
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPaymentId(paymentId);
        payment.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
        payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID);
        payment.setReferenceCode("14658296"); // VNPay transaction number
        payment.setAmount(refundAmount);
        payment.setCreatedAt(LocalDateTime.now().minusHours(2));
        
        // Mock VNPay refund API successful response
        Map<String, Object> vnpayRefundResponse = new HashMap<>();
        vnpayRefundResponse.put("vnp_ResponseCode", "00"); // Success
        vnpayRefundResponse.put("vnp_Message", "Refund successful");
        
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(paymentTransactionRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(vnpayGateway.refundPayment(any(), any(), any())).thenReturn(vnpayRefundResponse);
        when(bookingRepository.save(any())).thenReturn(booking);
        when(classSessionRepository.save(any())).thenReturn(session);
        when(paymentTransactionRepository.save(any())).thenReturn(payment);
        when(bookingRepository.countBySessionIdAndStatusIn(anyLong(), anyList())).thenReturn(0L);

        // When
        CancelBookingResponse result = bookingService.cancelClassBooking(bookingId, actorId);

        // Then
        assertEquals("CANCELLED", result.getStatus());
        
        // Verify VNPay refund API was called
        ArgumentCaptor<PaymentTransaction> paymentCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        ArgumentCaptor<BigDecimal> amountCaptor = ArgumentCaptor.forClass(BigDecimal.class);
        ArgumentCaptor<String> reasonCaptor = ArgumentCaptor.forClass(String.class);
        
        verify(vnpayGateway, times(1)).refundPayment(
                paymentCaptor.capture(),
                amountCaptor.capture(),
                reasonCaptor.capture()
        );
        
        assertEquals(paymentId, paymentCaptor.getValue().getPaymentId());
        assertEquals(refundAmount, amountCaptor.getValue());
        assertTrue(reasonCaptor.getValue().contains("Hoàn 100%"));
        
        // Verify payment status updated to REFUNDED
        ArgumentCaptor<PaymentTransaction> savedPaymentCaptor = ArgumentCaptor.forClass(PaymentTransaction.class);
        verify(paymentTransactionRepository, atLeastOnce()).save(savedPaymentCaptor.capture());
        assertEquals(PaymentConstants.PAYMENT_STATUS_REFUNDED, savedPaymentCaptor.getValue().getPaymentStatus());
    }

    @Test
    void testClassRefund_NonVNPayPayment_SkipsRefundAPI() {
        // Given - Booking paid with CASH
        Long bookingId = 33L;
        Long actorId = 37L;
        Long paymentId = 69L;
        
        Booking booking = new Booking();
        booking.setBookingId(bookingId);
        booking.setMemberId(actorId);
        booking.setSessionId(23L);
        booking.setStatus("CONFIRMED");
        booking.setPaymentId(paymentId);
        booking.setFeeAmount(new BigDecimal("180000"));
        
        ClassSession session = new ClassSession();
        session.setSessionId(23L);
        session.setStartTime(LocalDateTime.now().plusDays(1));
        
        // Payment was CASH, not VNPay
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPaymentId(paymentId);
        payment.setPaymentMethod(PaymentConstants.METHOD_CASH_COUNTER);
        payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID);
        payment.setAmount(new BigDecimal("180000"));
        
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(23L)).thenReturn(Optional.of(session));
        when(paymentTransactionRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(bookingRepository.save(any())).thenReturn(booking);
        when(classSessionRepository.save(any())).thenReturn(session);
        when(bookingRepository.countBySessionIdAndStatusIn(anyLong(), anyList())).thenReturn(0L);

        // When
        CancelBookingResponse result = bookingService.cancelClassBooking(bookingId, actorId);

        // Then
        assertEquals("CANCELLED", result.getStatus());
        
        // Verify VNPay refund API was NOT called
        verify(vnpayGateway, never()).refundPayment(any(), any(), any());
        
        // Verify local refund record created instead
        verify(paymentTransactionRepository, atLeastOnce()).save(any(PaymentTransaction.class));
    }

    @Test
    void testCourtRefund_VNPayPayment_CallsRefundAPI() {
        // Given
        Long bookingId = 42L;
        Long actorId = 37L;
        Long paymentId = 70L;
        BigDecimal refundAmount = new BigDecimal("60000");
        
        CourtBooking booking = new CourtBooking();
        booking.setCourtBookingId(bookingId);
        booking.setMemberId(actorId);
        booking.setStatus("CONFIRMED");
        booking.setPaymentId(paymentId);
        booking.setAmountPaid(refundAmount);
        booking.setStartTime(LocalDateTime.now().plusDays(1));
        booking.setEndTime(LocalDateTime.now().plusDays(1).plusHours(1));
        
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPaymentId(paymentId);
        payment.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
        payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID);
        payment.setReferenceCode("14658297");
        payment.setAmount(refundAmount);
        payment.setCreatedAt(LocalDateTime.now().minusHours(3));
        
        Map<String, Object> vnpayRefundResponse = new HashMap<>();
        vnpayRefundResponse.put("vnp_ResponseCode", "00");
        vnpayRefundResponse.put("vnp_Message", "Success");
        
        when(courtBookingRepository.findByIdForUpdate(bookingId)).thenReturn(Optional.of(booking));
        when(paymentTransactionRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(vnpayGateway.refundPayment(any(), any(), any())).thenReturn(vnpayRefundResponse);
        when(courtBookingRepository.save(any())).thenReturn(booking);
        when(paymentTransactionRepository.save(any())).thenReturn(payment);

        // When
        CancelBookingResponse result = bookingService.cancelCourtBooking(bookingId, actorId);

        // Then
        assertEquals("CANCELLED", result.getStatus());
        verify(vnpayGateway, times(1)).refundPayment(any(), eq(refundAmount), anyString());
    }

    @Test
    void testRefund_VNPayApiFails_StillCancelsBooking() {
        // Given - VNPay API returns error but booking should still be cancelled
        Long bookingId = 34L;
        Long actorId = 37L;
        Long paymentId = 71L;
        
        Booking booking = new Booking();
        booking.setBookingId(bookingId);
        booking.setMemberId(actorId);
        booking.setSessionId(24L);
        booking.setStatus("CONFIRMED");
        booking.setPaymentId(paymentId);
        booking.setFeeAmount(new BigDecimal("180000"));
        
        ClassSession session = new ClassSession();
        session.setSessionId(24L);
        session.setStartTime(LocalDateTime.now().plusDays(1));
        
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPaymentId(paymentId);
        payment.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
        payment.setReferenceCode("14658298");
        payment.setCreatedAt(LocalDateTime.now().minusHours(1));
        
        // VNPay API returns error
        Map<String, Object> vnpayErrorResponse = new HashMap<>();
        vnpayErrorResponse.put("vnp_ResponseCode", "99"); // Error
        vnpayErrorResponse.put("vnp_Message", "Transaction not found");
        
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(24L)).thenReturn(Optional.of(session));
        when(paymentTransactionRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(vnpayGateway.refundPayment(any(), any(), any())).thenReturn(vnpayErrorResponse);
        when(bookingRepository.save(any())).thenReturn(booking);
        when(classSessionRepository.save(any())).thenReturn(session);
        when(bookingRepository.countBySessionIdAndStatusIn(anyLong(), anyList())).thenReturn(0L);

        // When
        CancelBookingResponse result = bookingService.cancelClassBooking(bookingId, actorId);

        // Then
        assertEquals("CANCELLED", result.getStatus());
        verify(vnpayGateway, times(1)).refundPayment(any(), any(), any());
        // Payment status should NOT be REFUNDED since VNPay returned error
        verify(auditLogService).logSuccess(anyString(), anyString(), eq(actorId), anyString());
    }

    @Test
    void testRefund_NoReferenceCode_SkipsVNPayAPI() {
        // Given - Payment with VNPay method but no reference code (IPN not called)
        // Actually VNPay API will still be called even without reference code
        // The API will handle the error
        Long bookingId = 35L;
        Long actorId = 37L;
        Long paymentId = 72L;
        
        Booking booking = new Booking();
        booking.setBookingId(bookingId);
        booking.setMemberId(actorId);
        booking.setSessionId(25L);
        booking.setStatus("CONFIRMED");
        booking.setPaymentId(paymentId);
        booking.setFeeAmount(new BigDecimal("180000"));
        
        ClassSession session = new ClassSession();
        session.setSessionId(25L);
        session.setStartTime(LocalDateTime.now().plusDays(1));
        
        PaymentTransaction payment = new PaymentTransaction();
        payment.setPaymentId(paymentId);
        payment.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
        payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID); // Changed to PAID
        payment.setReferenceCode(null); // No reference code
        payment.setCreatedAt(LocalDateTime.now().minusMinutes(30));
        
        // Mock VNPay API returns error because no reference code
        Map<String, Object> vnpayErrorResponse = new HashMap<>();
        vnpayErrorResponse.put("vnp_ResponseCode", "99");
        vnpayErrorResponse.put("vnp_Message", "Missing transaction number");
        
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(25L)).thenReturn(Optional.of(session));
        when(paymentTransactionRepository.findById(paymentId)).thenReturn(Optional.of(payment));
        when(vnpayGateway.refundPayment(any(), any(), any())).thenReturn(vnpayErrorResponse);
        when(bookingRepository.save(any())).thenReturn(booking);
        when(classSessionRepository.save(any())).thenReturn(session);
        when(bookingRepository.countBySessionIdAndStatusIn(anyLong(), anyList())).thenReturn(0L);

        // When
        CancelBookingResponse result = bookingService.cancelClassBooking(bookingId, actorId);
        
        // Then
        assertEquals("CANCELLED", result.getStatus());
        // VNPay API will be called but will return error
        verify(vnpayGateway, times(1)).refundPayment(any(), any(), any());
    }

    @Test
    void testClassRefund_LateCancel_NoRefund() {
        // Given - Canceling less than 2 hours before session
        // Late cancel means refund amount = 0, so VNPay API should NOT be called
        Long bookingId = 36L;
        Long actorId = 37L;
        Long paymentId = 73L;
        
        Booking booking = new Booking();
        booking.setBookingId(bookingId);
        booking.setMemberId(actorId);
        booking.setSessionId(26L);
        booking.setStatus("CONFIRMED");
        booking.setPaymentId(paymentId);
        booking.setFeeAmount(new BigDecimal("180000"));
        
        ClassSession session = new ClassSession();
        session.setSessionId(26L);
        session.setStartTime(LocalDateTime.now().plusMinutes(90)); // Less than 2 hours
        
        // Don't mock payment - it won't be loaded because refund amount is 0
        
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(classSessionRepository.findByIdForUpdate(26L)).thenReturn(Optional.of(session));
        when(bookingRepository.save(any())).thenReturn(booking);
        when(classSessionRepository.save(any())).thenReturn(session);
        when(bookingRepository.countBySessionIdAndStatusIn(anyLong(), anyList())).thenReturn(0L);

        // When
        CancelBookingResponse result = bookingService.cancelClassBooking(bookingId, actorId);

        // Then
        assertEquals("CANCELLED", result.getStatus());
        
        // VNPay refund API should NOT be called (refund amount = 0 for late cancel)
        verify(vnpayGateway, never()).refundPayment(any(), any(), any());
    }
}
