package com.sporthub.backend.dto;

public record CoachPlanRequest(
        Long memberId,
        String goal) {
}
