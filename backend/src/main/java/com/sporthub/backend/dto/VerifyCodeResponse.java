package com.sporthub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyCodeResponse {
    private String resetToken;
    private String message;
    private int expiresInSeconds;
}
