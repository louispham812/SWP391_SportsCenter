package com.sporthub.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ManagerUserResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String role,
        String status,
        LocalDateTime createdAt,
        String specialty,
        List<Long> sportIds) {

    public ManagerUserResponse(
            Long userId,
            String fullName,
            String email,
            String phone,
            String role,
            String status,
            LocalDateTime createdAt) {
        this(userId, fullName, email, phone, role, status, createdAt, null, List.of());
    }
}
