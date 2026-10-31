package com.sporthub.backend.service;

import com.sporthub.backend.constants.PaymentConstants;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

/**
 * Service centralize payment creation logic
 * Thay thế duplicate code trong BookingService và MemberProfileController
 */
@Service
public class PaymentService {
    
    private final PaymentTransactionRepository paymentTransactionRepository;
    
    public PaymentService(PaymentTransactionRepository paymentTransactionRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
    }
    
    /**
     * Create payment transaction với đúng status và reference code
     * 
     * @param memberId User ID
     * @param bookingType CLASS, COURT, or MEMBERSHIP_PACKAGE
     * @param amount Payment amount
     * @param paymentMethod VIETQR, CASH_COUNTER, etc
     * @return Saved PaymentTransaction
     */
    public PaymentTransaction createPayment(
            Long memberId,
            String bookingType,
            BigDecimal amount,
            String paymentMethod) {
        
        // Normalize payment method
        String normalizedMethod = normalizePaymentMethod(paymentMethod);
        
        PaymentTransaction payment = new PaymentTransaction();
        payment.setMemberId(memberId);
        payment.setBookingType(bookingType);
        payment.setAmount(amount);
        payment.setPaymentMethod(normalizedMethod);
        payment.setPaymentStatus(determineInitialStatus(normalizedMethod));
        payment.setReferenceCode(generateReferenceCode(bookingType));
        payment.setCreatedAt(LocalDateTime.now());
        
        return paymentTransactionRepository.save(payment);
    }
    
    /**
     * Normalize payment method (handle aliases like QR → VIETQR, CASH → CASH_COUNTER)
     */
    private String normalizePaymentMethod(String method) {
        if (method == null || method.isBlank()) {
            return PaymentConstants.METHOD_CASH_COUNTER;
        }
        
        String normalized = method.toUpperCase(Locale.ROOT);
        
        // Handle aliases
        return switch (normalized) {
            case "QR" -> PaymentConstants.METHOD_VIETQR;
            case "CASH" -> PaymentConstants.METHOD_CASH_COUNTER;
            default -> normalized;
        };
    }
    
    /**
     * Determine initial payment status based on method
     * 
     * Rule: VIETQR → PENDING (chờ webhook)
     *       CASH_COUNTER → PAID (thanh toán ngay)
     */
    private String determineInitialStatus(String normalizedMethod) {
        if (PaymentConstants.METHOD_VIETQR.equals(normalizedMethod)) {
            return PaymentConstants.PAYMENT_STATUS_PENDING;
        }
        return PaymentConstants.PAYMENT_STATUS_PAID;
    }
    
    /**
     * Create refund transaction
     * 
     * @param memberId User ID
     * @param refundType CLASS_REFUND, COURT_REFUND, or MEMBERSHIP_REFUND
     * @param amount Refund amount
     * @param originalPaymentMethod Original payment method
     * @return Saved refund transaction
     */
    public PaymentTransaction createRefund(
            Long memberId,
            String refundType,
            BigDecimal amount,
            String originalPaymentMethod) {
        
        PaymentTransaction refund = new PaymentTransaction();
        refund.setMemberId(memberId);
        refund.setBookingType(refundType);
        refund.setAmount(amount);
        refund.setPaymentMethod(originalPaymentMethod != null ? originalPaymentMethod : "SANDBOX");
        refund.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_REFUNDED);
        refund.setReferenceCode(generateRefundReferenceCode(refundType));
        refund.setCreatedAt(LocalDateTime.now());
        
        return paymentTransactionRepository.save(refund);
    }
    
    /**
     * Generate unique reference code theo format:
     * CLS-XXXXXXXXXX (CLASS)
     * CRT-XXXXXXXXXX (COURT) 
     * PKG-XXXXXXXXXX (MEMBERSHIP_PACKAGE)
     */
    private String generateReferenceCode(String bookingType) {
        String prefix = switch (bookingType) {
            case PaymentConstants.BOOKING_TYPE_CLASS -> "CLS";
            case PaymentConstants.BOOKING_TYPE_COURT -> "CRT";
            case PaymentConstants.BOOKING_TYPE_MEMBERSHIP -> "PKG";
            default -> "PAY";
        };
        
        String uuid = UUID.randomUUID()
            .toString()
            .replace("-", "")
            .substring(0, 10)
            .toUpperCase(Locale.ROOT);
        
        return prefix + "-" + uuid;
    }
    
    /**
     * Generate refund reference code theo format:
     * RFD-CLS-XXXXXXXXXX (CLASS_REFUND)
     * RFD-CRT-XXXXXXXXXX (COURT_REFUND)
     * RFD-PKG-XXXXXXXXXX (MEMBERSHIP_REFUND)
     */
    private String generateRefundReferenceCode(String refundType) {
        String prefix = switch (refundType) {
            case "CLASS_REFUND" -> "RFD-CLS";
            case "COURT_REFUND" -> "RFD-CRT";
            case "MEMBERSHIP_REFUND" -> "RFD-PKG";
            default -> "RFD-PAY";
        };
        
        String uuid = UUID.randomUUID()
            .toString()
            .replace("-", "")
            .substring(0, 10)
            .toUpperCase(Locale.ROOT);
        
        return prefix + "-" + uuid;
    }
}
