package com.sporthub.backend.dto;

public record CoachPlanRequest(
        Long bookingId,
        String goal) {
}
