package com.sporthub.backend.service.gateway;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Payment Gateway Interface
 * 
 * Clean Architecture pattern để support nhiều payment gateway
 * (VNPay, MoMo, ZaloPay, etc.)
 * 
 * Implementation:
 * - VNPayGateway: Redirect to VNPay payment page with HMAC SHA512
 */
public interface PaymentGateway {
    
    /**
     * Generate payment URL or QR code
     * 
     * @param paymentId Unique payment transaction ID
     * @param amount Payment amount
     * @param description Payment description
     * @param ipAddress User IP address (optional, required for VNPay)
     * @return Map containing payment URL or QR data
     */
    Map<String, Object> generatePayment(
        Long paymentId, 
        BigDecimal amount, 
        String description,
        String ipAddress
    );

    default Map<String, Object> generatePaymentAttempt(Long paymentId, BigDecimal amount, String description,
            String ipAddress, String reference, java.time.LocalDateTime expiresAt) {
        throw new UnsupportedOperationException("Gateway không hỗ trợ payment attempt.");
    }
    
    /**
     * Get gateway name
     * 
     * @return Gateway identifier (VNPAY, etc.)
     */
    String getGatewayName();
}
