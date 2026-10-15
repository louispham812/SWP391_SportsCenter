package com.sporthub.backend.dto;

public record RosterBookingResponse(
        Long bookingId,
        Long memberId,
        String memberName,
        String memberPhone,
        String bookingStatus,
        String attendanceStatus,
        String coachNote) {
}
