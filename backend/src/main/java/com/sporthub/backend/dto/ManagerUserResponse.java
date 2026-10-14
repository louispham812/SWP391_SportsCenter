package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record ManagerUserResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String role,
        String status,
        LocalDateTime createdAt) {
}
