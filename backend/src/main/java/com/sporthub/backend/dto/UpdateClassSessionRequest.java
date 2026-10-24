package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UpdateClassSessionRequest(
        String className,
        Long coachId,
        Long facilityId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer maxSlots,
        BigDecimal priceAmount,
        String status) {
}
