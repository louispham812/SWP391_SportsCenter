package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record ReceptionistCheckInResponse(
        Long checkInId,
        Long memberId,
        String memberName,
        String phone,
        LocalDateTime checkedInAt,
        String result) {
}
