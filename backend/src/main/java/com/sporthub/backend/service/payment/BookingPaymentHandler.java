package com.sporthub.backend.service.payment;

import com.sporthub.backend.entity.PaymentTransaction;
import java.util.Map;

/**
 * Strategy interface cho webhook payment processing
 * Giảm ~200 lines duplicate code trong SePayWebhookController
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
     * @param transferAmount Số tiền từ webhook (Double from SePay)
     * @return Response map với success=true và booking details
     */
    Map<String, Object> handlePaymentConfirmation(PaymentTransaction payment, Double transferAmount);
}
