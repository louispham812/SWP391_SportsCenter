package com.sporthub.backend.controller;

import com.sporthub.backend.dto.AuthResponse;
import com.sporthub.backend.dto.LoginRequest;
import com.sporthub.backend.dto.RegisterRequest;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.exception.PendingVerificationException;
import com.sporthub.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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
        } catch (PendingVerificationException e) {
            // Tài khoản PENDING → Frontend cần redirect đến trang verify OTP
            // Xử lý đặc biệt tại controller vì cần format response khác với GlobalExceptionHandler
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "PENDING_VERIFICATION");
            errorResponse.put("email", e.getEmail());
            errorResponse.put("message", e.getMessage());
            errorResponse.put("redirectTo", "/verify-otp");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        }
        // Các exception khác để GlobalExceptionHandler xử lý → trả về JSON format nhất quán
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
        String token = authorization != null && authorization.startsWith("Bearer ")
                ? authorization.substring(7).trim()
                : null;
        AuthResponse response = authService.changePassword(request, token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody com.sporthub.backend.dto.VerifyOtpRequest request) {
        AuthResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody com.sporthub.backend.dto.ResendOtpRequest request) {
        authService.resendOtp(request);
        return ResponseEntity.ok(Map.of("success", true, "message", "Mã xác thực OTP mới đã được gửi thành công!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody com.sporthub.backend.dto.ForgotPasswordRequest request) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(Map.of("success", true, "message", message));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody com.sporthub.backend.dto.VerifyCodeRequest request) {
        com.sporthub.backend.dto.VerifyCodeResponse response = authService.verifyCode(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody com.sporthub.backend.dto.ResetPasswordRequest request) {
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(Map.of("success", true, "message", message));
    }
    
    /**
     * Check email availability for registration/create user
     * Returns: { exists: boolean, available: boolean, user: {...} }
     * 
     * Logic:
     * - PENDING: Email đã đăng ký nhưng chưa xác thực OTP (suggest resend OTP)
     * - ACTIVE: Email đang được dùng, không thể tạo mới
     * - LOCKED/INACTIVE: Email tồn tại nhưng có thể xem xét
     */
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Object>> checkEmailAvailability(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();
        response.put("email", email.trim().toLowerCase());
        
        Optional<User> existingUser = authService.findUserByEmail(email.trim());
        response.put("exists", existingUser.isPresent());
        
        if (existingUser.isEmpty()) {
            // Email chưa tồn tại → Có thể đăng ký
            response.put("available", true);
            response.put("message", "Email khả dụng để đăng ký");
        } else {
            User user = existingUser.get();
            response.put("available", false);
            
            Map<String, String> userInfo = new HashMap<>();
            userInfo.put("fullName", user.getFullName());
            userInfo.put("role", user.getRole());
            userInfo.put("status", user.getStatus());
            response.put("user", userInfo);
            
            // Logic theo status
            String status = user.getStatus();
            if ("PENDING".equalsIgnoreCase(status)) {
                response.put("message", "Email này đang chờ xác thực OTP. Bạn có thể đăng nhập để nhận lại mã OTP.");
                response.put("suggestion", "LOGIN_TO_RESEND_OTP");
            } else if ("ACTIVE".equalsIgnoreCase(status)) {
                response.put("message", String.format(
                    "Email đã được sử dụng bởi %s (%s) và đang hoạt động.",
                    user.getFullName(), user.getRole()
                ));
                response.put("suggestion", "USE_DIFFERENT_EMAIL");
            } else if ("LOCKED".equalsIgnoreCase(status)) {
                response.put("message", String.format(
                    "Email đã tồn tại với tài khoản bị khóa (%s - %s). Vui lòng liên hệ quản trị viên.",
                    user.getFullName(), user.getRole()
                ));
                response.put("suggestion", "CONTACT_ADMIN");
            } else if ("INACTIVE".equalsIgnoreCase(status)) {
                response.put("message", String.format(
                    "Email đã tồn tại với tài khoản không hoạt động (%s - %s).",
                    user.getFullName(), user.getRole()
                ));
                response.put("suggestion", "CONTACT_ADMIN");
            }
        }
        
        return ResponseEntity.ok(response);
    }
}
