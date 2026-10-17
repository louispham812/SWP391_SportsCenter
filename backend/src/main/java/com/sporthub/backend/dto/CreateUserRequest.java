package com.sporthub.backend.dto;

public record CreateUserRequest(
        String fullName,
        String email,
        String phone,
        String password,
        String role
) {
}
