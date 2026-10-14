package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ClassSessionResponse(
        Long sessionId,
        String className,
        Long sportId,
        Long coachId,
        String coachName,
        Long facilityId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer maxSlots,
        Integer bookedSlots,
        String status,
        Long memberBookingId,
        String memberBookingStatus,
        BigDecimal priceAmount) {
}
