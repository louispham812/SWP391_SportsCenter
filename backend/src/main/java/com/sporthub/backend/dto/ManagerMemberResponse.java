package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record ManagerMemberResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String status,
        LocalDateTime createdAt) {
}
