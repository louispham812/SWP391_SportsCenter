package com.sporthub.backend.dto;

import java.time.LocalDate;

public record MemberMembershipResponse(
        Long membershipId,
        String packageName,
        LocalDate startDate,
        LocalDate endDate,
        String status) {
}
