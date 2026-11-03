package com.sporthub.backend.service.payment;

import com.sporthub.backend.dto.PaymentConfirmationResult;
import com.sporthub.backend.entity.PaymentTransaction;

/**
 * Strategy interface for webhook payment processing
 * Supports multiple payment gateways (VNPay, VietQR, etc.)
 * Used by VNPayWebhookController to confirm bookings after payment
 */
public interface BookingPaymentHandler {
    
    /**
     * @return booking type this handler supports (CLASS, COURT, MEMBERSHIP_PACKAGE)
     */
    String getSupportedBookingType();
    
    /**
     * Handle payment confirmation for specific booking type
     * 
     * @param payment PaymentTransaction đã được update status = PAID
     * @param transferAmount Số tiền từ webhook (Double from payment gateway)
     * @return PaymentConfirmationResult với success=true và booking details, hoặc null nếu không match
     */
    PaymentConfirmationResult handlePaymentConfirmation(PaymentTransaction payment, Double transferAmount);
}
