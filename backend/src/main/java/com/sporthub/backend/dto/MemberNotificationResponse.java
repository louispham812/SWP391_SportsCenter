package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record MemberNotificationResponse(
        String id,
        String type,
        String title,
        String message,
        LocalDateTime timestamp,
        boolean isRead,
        String actionUrl) {
}
