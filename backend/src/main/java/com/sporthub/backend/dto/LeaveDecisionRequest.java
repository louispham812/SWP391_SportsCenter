package com.sporthub.backend.dto;

public record LeaveDecisionRequest(
        boolean approved,
        Long reassignedCoachId,
        String decisionNote) {
}
