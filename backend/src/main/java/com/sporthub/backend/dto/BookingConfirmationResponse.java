package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingConfirmationResponse(
        String bookingType,
        Long bookingId,
        Long paymentId,
        String itemName,
        String sportName,
        String location,
        LocalDateTime startTime,
        LocalDateTime endTime,
        BigDecimal amountPaid,
        String paymentStatus,
        String referenceCode,
        // NEW: Quota info nếu dùng quota
        Boolean usedQuota,
        Integer quotaUsed,
        Integer quotaRemaining,
        String quotaMessage) {
    
    // Constructor cho paid booking (không dùng quota)
    public BookingConfirmationResponse(
            String bookingType,
            Long bookingId,
            Long paymentId,
            String itemName,
            String sportName,
            String location,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BigDecimal amountPaid,
            String paymentStatus,
            String referenceCode) {
        this(bookingType, bookingId, paymentId, itemName, sportName, location, 
             startTime, endTime, amountPaid, paymentStatus, referenceCode,
             false, 0, 0, null);
    }
}
