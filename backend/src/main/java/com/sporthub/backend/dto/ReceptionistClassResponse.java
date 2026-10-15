package com.sporthub.backend.dto;

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
        String status) {
}
