package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record CoachPublicProfileResponse(
        Long coachId,
        String fullName,
        String email,
        String phone,
        String avatar,
        String specialty,
        String bio,
        int activeClassesCount,
        List<String> sportsTaught,
        List<Long> sportIds,
        BigDecimal hourlyRate,
        Double averageRating,
        Integer reviewCount,
        String availabilityJson) {

    public CoachPublicProfileResponse(
            Long coachId,
            String fullName,
            String email,
            String phone,
            String avatar,
            String specialty,
            String bio,
            int activeClassesCount,
            List<String> sportsTaught) {
        this(
                coachId,
                fullName,
                email,
                phone,
                avatar,
                specialty,
                bio,
                activeClassesCount,
                sportsTaught,
                List.of(),
                BigDecimal.valueOf(250000),
                0.0,
                0,
                "{}");
    }
}
