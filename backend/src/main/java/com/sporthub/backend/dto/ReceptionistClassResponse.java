package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ReceptionistClassResponse(
        Long sessionId,
        String className,
        String sportName,
        String facilityName,
        String coachName,
        Long sportId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer bookedSlots,
        Integer maxSlots,
        String status,
        BigDecimal priceAmount) {

    public ReceptionistClassResponse(
            Long sessionId,
            String className,
            String sportName,
            String facilityName,
            String coachName,
            Long sportId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer bookedSlots,
            Integer maxSlots,
            String status) {
        this(sessionId, className, sportName, facilityName, coachName, sportId,
                startTime, endTime, bookedSlots, maxSlots, status, null);
    }
}
