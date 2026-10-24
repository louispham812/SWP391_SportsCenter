package com.sporthub.backend.dto;

import java.time.LocalDate;

public record CoachProfileUpdateRequest(
        String fullName,
        String phone,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        String specialty,
        Integer experienceYears,
        String certifications,
        String bio) {
}
