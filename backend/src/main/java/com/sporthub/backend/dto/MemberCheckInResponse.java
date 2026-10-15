package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record MemberCheckInResponse(
        Long checkInId,
        LocalDateTime checkedInAt,
        String result,
        String location) {
}
