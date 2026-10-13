package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record CoachStudentBookingResponse(
        Long bookingId,
        Long memberId,
        String memberName,
        String memberPhone,
        Long sessionId,
        String className,
        LocalDateTime startTime,
        String bookingStatus,
        String attendanceStatus) {
}
