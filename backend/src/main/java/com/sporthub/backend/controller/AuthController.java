package com.sporthub.backend.controller;

import com.sporthub.backend.dto.AuthResponse;
import com.sporthub.backend.dto.LoginRequest;
import com.sporthub.backend.dto.RegisterRequest;
import com.sporthub.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@SuppressWarnings("unused")
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*") // Cho phép ReactJS gọi API không bị lỗi CORS
public class AuthController {

    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/session")
    public ResponseEntity<Void> logout(@RequestHeader(name = "Authorization", required = false) String authorization) {
        String token = authorization != null && authorization.startsWith("Bearer ")
                ? authorization.substring(7).trim()
                : null;
        authService.logout(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody com.sporthub.backend.dto.ChangePasswordRequest request,
            @RequestHeader(name = "Authorization", required = false) String authorization) {
        try {
            String token = authorization != null && authorization.startsWith("Bearer ")
                    ? authorization.substring(7).trim()
                    : null;
            AuthResponse response = authService.changePassword(request, token);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody com.sporthub.backend.dto.VerifyOtpRequest request) {
        try {
            AuthResponse response = authService.verifyEmail(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody com.sporthub.backend.dto.ResendOtpRequest request) {
        try {
            authService.resendOtp(request);
            return ResponseEntity.ok("Mã xác thực OTP mới đã được gửi thành công!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody com.sporthub.backend.dto.ForgotPasswordRequest request) {
        try {
            String message = authService.forgotPassword(request);
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", message));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody com.sporthub.backend.dto.VerifyCodeRequest request) {
        try {
            com.sporthub.backend.dto.VerifyCodeResponse response = authService.verifyCode(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody com.sporthub.backend.dto.ResetPasswordRequest request) {
        try {
            String message = authService.resetPassword(request);
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", message));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        }
    }
}