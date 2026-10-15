package com.sporthub.backend.dto;

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
        List<String> sportsTaught) {
}
