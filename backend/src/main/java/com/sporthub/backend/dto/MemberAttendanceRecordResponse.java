package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record MemberAttendanceRecordResponse(
        Long bookingId,
        Long sessionId,
        String className,
        String sportName,
        String coachName,
        String coachAvatar,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String attendanceStatus,
        String coachNote) {
}
