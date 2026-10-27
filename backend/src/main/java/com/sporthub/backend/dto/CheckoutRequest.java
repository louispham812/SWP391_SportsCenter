package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record CheckoutRequest(
        String bookingType,
        Long itemId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String paymentMethod,
        Boolean useQuota,  // NEW: true = dùng quota, false/null = trả phí
        String voucherCode) {  // Existing field for voucher
    
    // Constructor để backward compatible với code cũ
    public CheckoutRequest(
            String bookingType,
            Long itemId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String paymentMethod) {
        this(bookingType, itemId, startTime, endTime, paymentMethod, false, null);
    }
}
