package com.sporthub.backend.dto;

public record RosterBookingResponse(
        Long bookingId,
        Long memberId,
        String memberName,
        String memberPhone,
        String bookingStatus,
        String attendanceStatus,
        String coachNote,
        Boolean usesMembershipQuota) {

    public RosterBookingResponse(
            Long bookingId,
            Long memberId,
            String memberName,
            String memberPhone,
            String bookingStatus,
            String attendanceStatus,
            String coachNote) {
        this(bookingId, memberId, memberName, memberPhone, bookingStatus, attendanceStatus, coachNote, false);
    }
}
