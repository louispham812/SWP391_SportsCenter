package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record PendingStaffRegistrationResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String role,
        LocalDateTime createdAt) {
}
