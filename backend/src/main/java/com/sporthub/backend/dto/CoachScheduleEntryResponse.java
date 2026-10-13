package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record CoachScheduleEntryResponse(
        Long sessionId,
        String className,
        String sportName,
        String facilityName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        Integer bookedSlots,
        Integer maxSlots,
        String status) {
}
