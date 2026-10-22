package com.sporthub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {
    private String email;
    private String oldPassword; // Mật khẩu tạm từ email hoặc mật khẩu cũ
    private String newPassword;
    private String confirmPassword;
}
