package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BookingQuoteResponse(
        String bookingType,
        Long itemId,
        String itemName,
        String sportName,
        String location,
        LocalDateTime startTime,
        LocalDateTime endTime,
        BigDecimal amount,
        BigDecimal originalAmount,
        BigDecimal discountAmount,
        String discountLabel,
        // NEW: Quota info (null nếu không có gói hoặc không đủ quota)
        Boolean canUseQuota,
        Integer quotaRequired,
        Integer quotaAvailable,
        String quotaMessage) {

    public BookingQuoteResponse(
            String bookingType,
            Long itemId,
            String itemName,
            String sportName,
            String location,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BigDecimal amount) {
        this(bookingType, itemId, itemName, sportName, location, startTime, endTime, 
             amount, amount, BigDecimal.ZERO, null, false, 0, 0, null);
    }
    
    // Constructor với quota info
    public BookingQuoteResponse(
            String bookingType,
            Long itemId,
            String itemName,
            String sportName,
            String location,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BigDecimal amount,
            BigDecimal originalAmount,
            BigDecimal discountAmount,
            String discountLabel) {
        this(bookingType, itemId, itemName, sportName, location, startTime, endTime, 
             amount, originalAmount, discountAmount, discountLabel, false, 0, 0, null);
    }
}
