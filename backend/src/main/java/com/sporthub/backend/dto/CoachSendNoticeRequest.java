package com.sporthub.backend.dto;

public record CoachSendNoticeRequest(
        Long memberId,
        Long sessionId,
        String title,
        String message
) {}
