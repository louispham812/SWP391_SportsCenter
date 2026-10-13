package com.sporthub.backend.dto;

import java.math.BigDecimal;

public record MemberHealthProfileRequest(
        String fitnessLevel,
        String fitnessGoals,
        String injuryHistory,
        BigDecimal weightKg,
        BigDecimal heightCm,
        BigDecimal smmKg,
        BigDecimal pbfPercent,
        BigDecimal bmi) {
}
