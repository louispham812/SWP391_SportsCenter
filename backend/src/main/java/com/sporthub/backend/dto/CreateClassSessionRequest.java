package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CreateClassSessionRequest(
        String className,
        Long sportId,
        Long coachId,
        Long facilityId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer sessionCount,
        Integer maxSlots,
        BigDecimal priceAmount) {
}
