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
        String discountLabel) {

    public BookingQuoteResponse(
            String bookingType,
            Long itemId,
            String itemName,
            String sportName,
            String location,
            LocalDateTime startTime,
            LocalDateTime endTime,
            BigDecimal amount) {
        this(bookingType, itemId, itemName, sportName, location, startTime, endTime, amount, amount, BigDecimal.ZERO, null);
    }
}
