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
        String referenceCode) {
}
