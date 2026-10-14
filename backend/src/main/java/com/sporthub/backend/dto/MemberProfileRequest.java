package com.sporthub.backend.dto;

import java.time.LocalDate;

public record MemberProfileRequest(
        String fullName,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String emergencyContactName,
        String emergencyContactPhone) {
}
