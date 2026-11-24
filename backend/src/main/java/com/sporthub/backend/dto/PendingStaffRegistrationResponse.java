package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record PendingStaffRegistrationResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String role,
        LocalDateTime createdAt,
        String specialty) {
    public PendingStaffRegistrationResponse(
            Long userId,
            String fullName,
            String email,
            String phone,
            String role,
            LocalDateTime createdAt) {
        this(userId, fullName, email, phone, role, createdAt, null);
    }
}
