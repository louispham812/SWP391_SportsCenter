package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CourtSlotResponse(
        Long courtId,
        String courtName,
        String description,
        String sportName,
        BigDecimal hourlyRate,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String status) {

    public CourtSlotResponse(
            Long courtId,
            String courtName,
            String description,
            String sportName,
            BigDecimal hourlyRate,
            LocalDateTime startTime,
            LocalDateTime endTime) {
        this(courtId, courtName, description, sportName, hourlyRate, startTime, endTime, "AVAILABLE");
    }
}
