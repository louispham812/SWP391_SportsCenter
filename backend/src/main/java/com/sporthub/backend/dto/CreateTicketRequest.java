package com.sporthub.backend.dto;

public record CreateTicketRequest(
        String category,
        String title,
        String description,
        String severity) {
}
