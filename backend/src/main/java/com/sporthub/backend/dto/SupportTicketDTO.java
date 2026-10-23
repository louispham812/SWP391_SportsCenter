package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record SupportTicketDTO(
        Long ticketId,
        Long memberId,
        String memberName,
        String category,
        String title,
        String description,
        String severity,
        String status,
        String adminResponse,
        LocalDateTime createdAt) {
}
