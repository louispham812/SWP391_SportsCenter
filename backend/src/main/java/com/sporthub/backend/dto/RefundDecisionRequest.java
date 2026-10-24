package com.sporthub.backend.dto;

public record RefundDecisionRequest(
        boolean approved,
        String decisionNote) {
}
