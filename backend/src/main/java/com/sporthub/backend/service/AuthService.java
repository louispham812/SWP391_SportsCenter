package com.sporthub.backend.service;

import com.sporthub.backend.dto.*;
import com.sporthub.backend.entity.AuthSession;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.entity.VerificationToken;
import com.sporthub.backend.repository.AuthSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.repository.VerificationTokenRepository;
import com.sporthub.backend.security.BearerTokenAuthenticationFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final String MEMBER_ROLE = "MEMBER";
    private static final String TOKEN_TYPE_PASSWORD_RESET = "PASSWORD_RESET";
    private static final String TOKEN_TYPE_RESET_TOKEN = "RESET_TOKEN";
    private static final int OTP_TTL_MINUTES = 10; // Rule: 10 phút
    private static final int OTP_COOLDOWN_SECONDS = 60; // Rule: 60 giây
    private static final int MAX_FAILED_ATTEMPTS = 5; // Rule: 5 lần

    private final UserRepository userRepository;
    private final AuthSessionRepository sessionRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public AuthService(
            UserRepository userRepository,
            AuthSessionRepository sessionRepository,
            VerificationTokenRepository verificationTokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    /**
     * LOGIN - với check requirePasswordChange
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEmail() == null ? "" : request.getEmail().trim();
        String password = request.getPassword();
        
        if (identifier.isEmpty() || password == null || password.isEmpty()) {
            auditLogService.logFailure("LOGIN", identifier, null, "Login attempt", "Empty credentials");
            throw new IllegalArgumentException("Vui lòng nhập email/số điện thoại và mật khẩu.");
        }

        User user = userRepository.findByEmailIgnoreCase(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> {
                    auditLogService.logFailure("LOGIN", identifier, null, "Login attempt", "User not found");
                    return new RuntimeException("Email hoặc mật khẩu không chính xác!");
                });

        String storedPassword = user.getPasswordHash();
        boolean passwordMatches = storedPassword != null
                && (storedPassword.startsWith("$2")
                ? passwordEncoder.matches(password, storedPassword)
                : password.equals(storedPassword));
                
        if (!passwordMatches) {
            auditLogService.logFailure("LOGIN", user.getEmail(), user.getUserId(), 
                    "Login attempt", "Wrong password");
            throw new RuntimeException("Email hoặc mật khẩu không chính xác!");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            auditLogService.logFailure("LOGIN", user.getEmail(), user.getUserId(), 
                    "Login attempt", "Account status: " + user.getStatus());
            if ("PENDING".equals(user.getStatus())) {
                throw new RuntimeException("Tài khoản đang chờ Quản lý duyệt.");
            }
            throw new RuntimeException("Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt!");
        }

        // Upgrade plain text password to BCrypt
        if (storedPassword != null && !storedPassword.startsWith("$2")) {
            user.setPasswordHash(passwordEncoder.encode(password));
            userRepository.save(user);
            logger.info("[AUTH-SERVICE] Upgraded plain text password to BCrypt for user: {}", user.getEmail());
        }

        auditLogService.logSuccess("LOGIN", user.getEmail(), user.getUserId(), 
                "Login successful | Role: " + user.getRole() + " | RequirePasswordChange: " + user.getRequirePasswordChange());

        return createSession(user);
    }

    /**
     * REGISTER - Member tự đăng ký
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String fullName = request.getFullName() == null ? "" : request.getFullName().trim();
        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase(Locale.ROOT);
        String phone = request.getPhone() == null ? "" : request.getPhone().trim();
        String password = request.getPassword();

        if (fullName.isEmpty() || email.isEmpty() || phone.isEmpty()
                || password == null || password.isEmpty()) {
            auditLogService.logFailure("REGISTER", email, null, "Registration attempt", "Missing required fields");
            throw new IllegalArgumentException("Vui lòng điền đầy đủ các thông tin bắt buộc.");
        }
        
        if (fullName.length() > 100 || email.length() > 100 || phone.length() > 15) {
            auditLogService.logFailure("REGISTER", email, null, "Registration attempt", "Field length exceeded");
            throw new IllegalArgumentException("Tên, email hoặc số điện thoại vượt quá độ dài cho phép.");
        }
        
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            auditLogService.logFailure("REGISTER", email, null, "Registration attempt", "Invalid email format");
            throw new IllegalArgumentException("Địa chỉ email không hợp lệ.");
        }
        
        if (password.length() < 8) {
            auditLogService.logFailure("REGISTER", email, null, "Registration attempt", "Password too short");
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự.");
        }
        
        if (userRepository.existsByEmailIgnoreCase(email)) {
            auditLogService.logFailure("REGISTER", email, null, "Registration attempt", "Email already exists");
            throw new IllegalArgumentException("Email này đã được đăng ký.");
        }

        // Rule: Member tự đăng ký luôn ACTIVE, không cần OTP verify
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(MEMBER_ROLE)
                .status("ACTIVE")
                .requirePasswordChange(false) // Member không cần đổi password
                .build();

        User savedUser = userRepository.save(user);
        
        auditLogService.logSuccess("REGISTER", email, savedUser.getUserId(), 
                "User registered successfully | Role: MEMBER");

        return createSession(savedUser);
    }

    /**
     * LOGOUT
     */
    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            String tokenHash = BearerTokenAuthenticationFilter.sha256(token.trim());
            sessionRepository.findById(tokenHash).ifPresent(session -> {
                User user = userRepository.findById(session.getUserId()).orElse(null);
                if (user != null) {
                    auditLogService.logSuccess("LOGOUT", user.getEmail(), user.getUserId(), "User logged out");
                }
            });
            sessionRepository.deleteById(tokenHash);
        }
    }

    /**
     * CHANGE PASSWORD - Staff đổi password lần đầu hoặc user đổi password định kỳ
     * Rule: CẦN old password + Bearer token
     */
    @Transactional
    public AuthResponse changePassword(ChangePasswordRequest request, String token) {
        String oldPassword = request.getOldPassword() == null ? "" : request.getOldPassword().trim();
        String newPassword = request.getNewPassword() == null ? "" : request.getNewPassword().trim();
        String confirmPassword = request.getConfirmPassword() == null ? "" : request.getConfirmPassword().trim();
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);

        if (oldPassword.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập Mật khẩu cũ (mật khẩu tạm từ email).");
        }
        if (newPassword.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập Mật khẩu mới.");
        }
        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Mật khẩu mới phải có ít nhất 8 ký tự.");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Xác nhận mật khẩu mới không khớp.");
        }
        if (newPassword.equals(oldPassword)) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu cũ/tạm thời.");
        }

        // Validate password strength
        validatePasswordStrength(newPassword);

        User user = null;
        if (token != null && !token.isBlank()) {
            String tokenHash = BearerTokenAuthenticationFilter.sha256(token.trim());
            var sessionOpt = sessionRepository.findByTokenHashAndExpiresAtAfter(tokenHash, LocalDateTime.now());
            if (sessionOpt.isPresent()) {
                user = userRepository.findById(sessionOpt.get().getUserId()).orElse(null);
            }
        }

        if (user == null) {
            if (email.isEmpty()) {
                throw new IllegalArgumentException("Vui lòng cung cấp địa chỉ email tài khoản cần đổi mật khẩu.");
            }
            user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> {
                        auditLogService.logFailure("CHANGE_PASSWORD", email, null, "Change password attempt", "User not found");
                        return new RuntimeException("Không tìm thấy tài khoản với email này.");
                    });
        }

        String storedPassword = user.getPasswordHash();
        boolean passwordMatches = storedPassword != null
                && (storedPassword.startsWith("$2")
                ? passwordEncoder.matches(oldPassword, storedPassword)
                : oldPassword.equals(storedPassword));
                
        if (!passwordMatches) {
            auditLogService.logFailure("CHANGE_PASSWORD", user.getEmail(), user.getUserId(), 
                    "Change password attempt", "Old password incorrect");
            throw new RuntimeException("Mật khẩu cũ (mật khẩu tạm từ email) không chính xác!");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setRequirePasswordChange(false); // Rule: Sau khi đổi xong thì không cần đổi nữa
        
        if ("PENDING_VERIFICATION".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
        }
        
        User savedUser = userRepository.save(user);

        auditLogService.logSuccess("CHANGE_PASSWORD", savedUser.getEmail(), savedUser.getUserId(), 
                "Password changed successfully | RequirePasswordChange set to false");

        return createSession(savedUser);
    }

    /**
     * STEP 1: FORGOT PASSWORD - Gửi OTP
     * Rule: Tạo OTP 6 số, TTL 10 phút, cooldown 60s, hash SHA-256, lưu vào DB
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập địa chỉ email đã đăng ký.");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Địa chỉ email không đúng định dạng.");
        }

        // Rule: Check cooldown 60s
        var existingTokenOpt = verificationTokenRepository
                .findByEmailAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
                        email, TOKEN_TYPE_PASSWORD_RESET, LocalDateTime.now());
                        
        if (existingTokenOpt.isPresent()) {
            VerificationToken existing = existingTokenOpt.get();
            long secondsPassed = Duration.between(existing.getCreatedAt(), LocalDateTime.now()).getSeconds();
            if (secondsPassed < OTP_COOLDOWN_SECONDS) {
                long waitTime = OTP_COOLDOWN_SECONDS - secondsPassed;
                throw new IllegalArgumentException("Vui lòng đợi " + waitTime + " giây trước khi yêu cầu gửi lại mã mới.");
            }
        }

        // Check email exists
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            // Rule: Không lộ thông tin email có tồn tại hay không
            auditLogService.logFailure("FORGOT_PASSWORD", email, null, 
                    "OTP request", "Email not found (hidden from user)");
            logger.info("[AUTH-SERVICE] Forgot password request for non-existent email: {}", email);
            return "Nếu email tồn tại trong hệ thống SportHub, mã xác nhận OTP đã được gửi. Vui lòng kiểm tra hộp thư.";
        }

        // Xóa OTP cũ
        verificationTokenRepository.deleteByEmailAndTokenType(email, TOKEN_TYPE_PASSWORD_RESET);

        // Tạo OTP 6 chữ số
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(otpNumber);

        // Rule: Hash OTP với SHA-256
        String otpHash = hashSHA256(otpCode);

        // Lưu vào DB
        VerificationToken token = VerificationToken.builder()
                .email(email)
                .tokenHash(otpHash)
                .tokenType(TOKEN_TYPE_PASSWORD_RESET)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES)) // Rule: 10 phút
                .failedAttempts(0)
                .locked(false)
                .build();
                
        verificationTokenRepository.save(token);

        // Gửi email
        emailService.sendOtpEmail(email, user.getFullName(), otpCode, "FORGOT_PASSWORD");

        auditLogService.logSuccess("FORGOT_PASSWORD", email, user.getUserId(), 
                "OTP generated and sent | Expires in " + OTP_TTL_MINUTES + " minutes");

        return "Mã xác thực OTP gồm 6 chữ số đã được gửi qua email. Mã có hiệu lực trong " + OTP_TTL_MINUTES + " phút.";
    }

    /**
     * STEP 2: VERIFY CODE - Xác thực OTP, trả về resetToken
     * Rule: Sai tối đa 5 lần thì khóa, trả về resetToken TTL 10 phút
     */
    @Transactional
    public VerifyCodeResponse verifyCode(VerifyCodeRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        String otp = request.getOtp() == null ? "" : request.getOtp().trim();

        if (email.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng cung cấp địa chỉ email xác thực.");
        }
        if (otp.isEmpty() || !otp.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("Mã OTP phải bao gồm đúng 6 chữ số.");
        }

        VerificationToken token = verificationTokenRepository
                .findByEmailAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
                        email, TOKEN_TYPE_PASSWORD_RESET, LocalDateTime.now())
                .orElseThrow(() -> {
                    auditLogService.logFailure("VERIFY_CODE", email, null, "OTP verification", "Token not found or expired");
                    return new IllegalArgumentException("Không tìm thấy mã xác thực hoặc mã đã hết hạn. Vui lòng nhấn 'Gửi lại mã'.");
                });

        // Rule: Check locked
        if (token.getLocked()) {
            auditLogService.logFailure("VERIFY_CODE", email, null, "OTP verification", "Token locked after 5 failed attempts");
            throw new IllegalArgumentException("Mã xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng bấm 'Gửi lại mã' để nhận mã mới.");
        }

        // Rule: Check expired
        if (LocalDateTime.now().isAfter(token.getExpiresAt())) {
            verificationTokenRepository.delete(token);
            auditLogService.logFailure("VERIFY_CODE", email, null, "OTP verification", "Token expired");
            throw new IllegalArgumentException("Mã OTP đã hết thời hạn " + OTP_TTL_MINUTES + " phút. Vui lòng bấm 'Gửi lại mã' để nhận mã mới.");
        }

        // Rule: So khớp OTP hash
        String otpHash = hashSHA256(otp);
        if (!token.getTokenHash().equals(otpHash)) {
            int currentFail = token.getFailedAttempts() + 1;
            token.setFailedAttempts(currentFail);

            if (currentFail >= MAX_FAILED_ATTEMPTS) {
                token.setLocked(true);
                verificationTokenRepository.save(token);
                auditLogService.logFailure("VERIFY_CODE", email, null, 
                        "OTP verification", "Max failed attempts reached: " + MAX_FAILED_ATTEMPTS);
                throw new IllegalArgumentException("Mã OTP không chính xác. Bạn đã nhập sai 5 lần và mã đã bị khóa! Vui lòng nhấn 'Gửi lại mã' mới.");
            } else {
                verificationTokenRepository.save(token);
                int remaining = MAX_FAILED_ATTEMPTS - currentFail;
                auditLogService.logFailure("VERIFY_CODE", email, null, 
                        "OTP verification", "Wrong OTP | Remaining attempts: " + remaining);
                throw new IllegalArgumentException("Mã OTP không chính xác! Bạn còn " + remaining + " lần thử.");
            }
        }

        // OTP ĐÚNG: Mark token as used
        token.setUsedAt(LocalDateTime.now());
        verificationTokenRepository.save(token);

        // Tạo resetToken mới
        String resetToken = UUID.randomUUID().toString();
        String resetTokenHash = hashSHA256(resetToken);

        VerificationToken resetTokenEntry = VerificationToken.builder()
                .email(email)
                .tokenHash(resetTokenHash)
                .tokenType(TOKEN_TYPE_RESET_TOKEN)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES)) // Rule: 10 phút
                .build();
                
        verificationTokenRepository.save(resetTokenEntry);

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        auditLogService.logSuccess("VERIFY_CODE", email, user != null ? user.getUserId() : null, 
                "OTP verified successfully | ResetToken generated");

        return VerifyCodeResponse.builder()
                .resetToken(resetToken)
                .message("Xác thực mã OTP thành công. Vui lòng tạo mật khẩu mới.")
                .expiresInSeconds(OTP_TTL_MINUTES * 60)
                .build();
    }

    /**
     * STEP 3: RESET PASSWORD - Đặt mật khẩu mới với resetToken
     * Rule: KHÔNG CẦN old password, chỉ cần resetToken hợp lệ
     */
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        String resetToken = request.getResetToken() == null ? "" : request.getResetToken().trim();
        String newPassword = request.getNewPassword() == null ? "" : request.getNewPassword().trim();
        String confirmPassword = request.getConfirmPassword() == null ? "" : request.getConfirmPassword().trim();

        if (resetToken.isEmpty()) {
            throw new IllegalArgumentException("Thiếu token xác thực phiên đặt lại mật khẩu. Vui lòng thực hiện lại.");
        }

        String resetTokenHash = hashSHA256(resetToken);
        VerificationToken tokenEntry = verificationTokenRepository
                .findByTokenHashAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
                        resetTokenHash, TOKEN_TYPE_RESET_TOKEN, LocalDateTime.now())
                .orElseThrow(() -> {
                    auditLogService.logFailure("RESET_PASSWORD", null, null, "Reset password", "Invalid or expired reset token");
                    return new IllegalArgumentException("Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (" + OTP_TTL_MINUTES + " phút). Vui lòng yêu cầu lại từ đầu.");
                });

        if (newPassword.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập mật khẩu mới.");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Xác nhận mật khẩu mới không khớp với mật khẩu mới.");
        }

        // Rule: Validate password strength
        validatePasswordStrength(newPassword);

        User user = userRepository.findByEmailIgnoreCase(tokenEntry.getEmail())
                .orElseThrow(() -> {
                    auditLogService.logFailure("RESET_PASSWORD", tokenEntry.getEmail(), null, 
                            "Reset password", "User not found");
                    return new RuntimeException("Không tìm thấy tài khoản người dùng tương ứng với email: " + tokenEntry.getEmail());
                });

        // Update password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        tokenEntry.setUsedAt(LocalDateTime.now());
        verificationTokenRepository.save(tokenEntry);

        // Clean up: Xóa tất cả tokens của email này
        verificationTokenRepository.deleteByEmailAndTokenType(tokenEntry.getEmail(), TOKEN_TYPE_PASSWORD_RESET);
        verificationTokenRepository.deleteByEmailAndTokenType(tokenEntry.getEmail(), TOKEN_TYPE_RESET_TOKEN);

        // Gửi email thông báo thành công
        emailService.sendPasswordResetSuccessEmail(user.getEmail(), user.getFullName());

        auditLogService.logSuccess("RESET_PASSWORD", user.getEmail(), user.getUserId(), 
                "Password reset successfully");

        return "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.";
    }

    /**
     * Helper: Validate password strength theo rule
     */
    private void validatePasswordStrength(String password) {
        if (password.length() < 8) {
            throw new IllegalArgumentException("Mật khẩu mới phải có tối thiểu 8 ký tự.");
        }
        
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
        }
        
        if (!hasUpper || !hasLower || !hasDigit) {
            throw new IllegalArgumentException("Mật khẩu mới phải bao gồm ít nhất 1 chữ in hoa, 1 chữ thường và 1 chữ số.");
        }
    }

    /**
     * Helper: Hash SHA-256
     */
    private String hashSHA256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash SHA-256", e);
        }
    }

    /**
     * Helper: Create session and return AuthResponse
     */
    private AuthResponse createSession(User user) {
        String token = UUID.randomUUID().toString();
        AuthSession session = new AuthSession();
        session.setTokenHash(BearerTokenAuthenticationFilter.sha256(token));
        session.setUserId(user.getUserId());
        session.setExpiresAt(LocalDateTime.now().plusHours(12));
        sessionRepository.save(session);
        return toAuthResponse(user, token);
    }

    /**
     * Helper: Convert User to AuthResponse
     */
    private AuthResponse toAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .role(user.getRole())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .userId(user.getUserId())
                .status(user.getStatus())
                .requirePasswordChange(user.getRequirePasswordChange()) // Rule: Trả về flag này
                .build();
    }

    /**
     * VERIFY EMAIL - Placeholder (nếu cần)
     */
    @Transactional
    public AuthResponse verifyEmail(VerifyOtpRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        String otp = request.getOtp() == null ? "" : request.getOtp().trim();

        if (email.isEmpty() || otp.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập đầy đủ email và mã OTP xác thực.");
        }
        if (otp.length() != 6 || !otp.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("Mã OTP phải gồm đúng 6 chữ số.");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản tương ứng với email: " + email));

        user.setStatus("ACTIVE");
        User savedUser = userRepository.save(user);

        auditLogService.logSuccess("VERIFY_EMAIL", email, savedUser.getUserId(), "Email verified successfully");

        return createSession(savedUser);
    }

    /**
     * RESEND OTP - Placeholder (nếu cần)
     */
    public void resendOtp(ResendOtpRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng cung cấp địa chỉ email.");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email: " + email));
        
        auditLogService.logSuccess("RESEND_OTP", email, user.getUserId(), "OTP resend requested");
    }
}
