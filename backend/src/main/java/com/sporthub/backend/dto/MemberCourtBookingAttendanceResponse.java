package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MemberCourtBookingAttendanceResponse(
        Long courtBookingId,
        Long courtId,
        String courtName,
        String sportName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        BigDecimal amountPaid,
        String status) {
}
