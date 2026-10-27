package com.sporthub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private String fullName;
    private String email;
    private String phone;
    private Long userId;
    private String status;
    private String avatar;

    public AuthResponse(String token, String role, String fullName, String email, String phone, Long userId, String status) {
        this(token, role, fullName, email, phone, userId, status, null);
    }
}