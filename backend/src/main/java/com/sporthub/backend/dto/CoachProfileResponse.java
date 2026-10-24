package com.sporthub.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CoachProfileResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String avatar,
        String emergencyContactName,
        String emergencyContactPhone,
        String role,
        String status,
        LocalDateTime createdAt,
        String specialty,
        Integer experienceYears,
        List<String> sportsTaught,
        int activeClassesCount,
        int totalStudentsCount,
        Double averageRating,
        int totalReviewsCount,
        List<CoachFeedbackDTO> reviews) {
}
