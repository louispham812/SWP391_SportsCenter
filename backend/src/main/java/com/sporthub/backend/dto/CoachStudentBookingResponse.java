package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CoachStudentBookingResponse(
        Long bookingId,
        Long memberId,
        String memberName,
        String memberPhone,
        String memberEmail,
        String memberAvatar,
        Long sessionId,
        String className,
        LocalDateTime startTime,
        String bookingStatus,
        String attendanceStatus,
        String fitnessLevel,
        String fitnessGoals,
        String injuryHistory,
        BigDecimal weightKg,
        BigDecimal heightCm,
        BigDecimal bmi) {

    public CoachStudentBookingResponse(
            Long bookingId,
            Long memberId,
            String memberName,
            String memberPhone,
            Long sessionId,
            String className,
            LocalDateTime startTime,
            String bookingStatus,
            String attendanceStatus) {
        this(bookingId, memberId, memberName, memberPhone, null, null, sessionId, className, startTime, bookingStatus, attendanceStatus, null, null, null, null, null, null);
    }

    public CoachStudentBookingResponse(
            Long bookingId,
            Long memberId,
            String memberName,
            String memberPhone,
            String memberEmail,
            String memberAvatar,
            Long sessionId,
            String className,
            LocalDateTime startTime,
            String bookingStatus,
            String attendanceStatus) {
        this(bookingId, memberId, memberName, memberPhone, memberEmail, memberAvatar, sessionId, className, startTime, bookingStatus, attendanceStatus, null, null, null, null, null, null);
    }
}
