package com.sporthub.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CoachLeaveRequestDTO(
        Long requestId,
        Long coachId,
        String coachName,
        String leaveType,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        String status,
        Long approvedBy,
        Integer affectedBookingsCount,
        Long reassignedCoachId,
        LocalDateTime createdAt) {
}
