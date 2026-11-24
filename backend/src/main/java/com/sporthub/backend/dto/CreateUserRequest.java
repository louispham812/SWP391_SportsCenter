package com.sporthub.backend.dto;

import java.time.LocalDate;
import java.util.List;

public record CreateUserRequest(
        String fullName,
        String email,
        String phone,
        String password,
        String role,
        List<Long> sportIds,
        String specialty,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String rfidCode,
        String emergencyContactName,
        String emergencyContactPhone
) {
    public CreateUserRequest(
            String fullName,
            String email,
            String phone,
            String password,
            String role) {
        this(fullName, email, phone, password, role, null, null, null, null, null, null, null, null);
    }

    public CreateUserRequest(
            String fullName,
            String email,
            String phone,
            String password,
            String role,
            List<Long> sportIds,
            String specialty) {
        this(fullName, email, phone, password, role, sportIds, specialty, null, null, null, null, null, null);
    }
}
