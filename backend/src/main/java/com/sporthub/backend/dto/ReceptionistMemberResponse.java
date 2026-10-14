package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record ReceptionistMemberResponse(
        Long userId,
        String fullName,
        String email,
        String phone,
        String status,
        LocalDateTime createdAt) {
}
