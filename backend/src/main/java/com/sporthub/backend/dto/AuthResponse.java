package com.sporthub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
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
    private Boolean requirePasswordChange;
    private String message; // Message for registration/verification flows
}