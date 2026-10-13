package com.sporthub.backend.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record MemberProfileResponse(
        Long userId,
        String fullName,
        LocalDate dateOfBirth,
        String email,
        String phone,
        String avatar,
        String gender,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        String role,
        String status,
        LocalDateTime createdAt) {
}
