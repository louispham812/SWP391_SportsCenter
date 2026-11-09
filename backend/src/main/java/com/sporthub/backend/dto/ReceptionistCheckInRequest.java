package com.sporthub.backend.dto;

public record ReceptionistCheckInRequest(Long memberId, Long bookingId) {
    public ReceptionistCheckInRequest(Long memberId) { this(memberId, null); }
}
