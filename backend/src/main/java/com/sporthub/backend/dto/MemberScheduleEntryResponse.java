package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MemberScheduleEntryResponse(
        String bookingType,
        Long bookingId,
        String title,
        String sportName,
        String location,
        LocalDateTime startTime,
        LocalDateTime endTime,
        BigDecimal amountPaid,
        String status,
        Long coachId,
        String coachName,
        String coachPhone,
        String coachAvatar,
        String attendanceStatus,
        String coachNote,
        String refundStatus) {
}
