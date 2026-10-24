package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record CoachFeedbackDTO(
        Long feedbackId,
        Long memberId,
        String memberName,
        Integer rating,
        String comment,
        LocalDateTime createdAt) {
}
