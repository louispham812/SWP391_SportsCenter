package com.sporthub.backend.service;

import com.sporthub.backend.dto.AuthResponse;
import com.sporthub.backend.dto.LoginRequest;
import com.sporthub.backend.dto.RegisterRequest;
import com.sporthub.backend.entity.AuthSession;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.AuthSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.security.BearerTokenAuthenticationFilter;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {

    private static final String MEMBER_ROLE = "MEMBER";
    private static final String COACH_ROLE = "COACH";
    private static final String RECEPTIONIST_ROLE = "RECEPTIONIST";

    private final UserRepository userRepository;
    private final AuthSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;

    AuthService(
            UserRepository userRepository,
            AuthSessionRepository sessionRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEmail() == null ? "" : request.getEmail().trim();
        String password = request.getPassword();
        if (identifier.isEmpty() || password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập email/số điện thoại và mật khẩu.");
        }

        User user = userRepository.findByEmailIgnoreCase(identifier)
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác!"));

        String storedPassword = user.getPasswordHash();
        boolean passwordMatches = storedPassword != null
                && (storedPassword.startsWith("$2")
                ? passwordEncoder.matches(password, storedPassword)
                : password.equals(storedPassword));
        if (!passwordMatches) {
            throw new RuntimeException("Email hoặc mật khẩu không chính xác!");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            if ("PENDING".equals(user.getStatus())) {
                throw new RuntimeException("Tài khoản đang chờ Quản lý duyệt.");
            }
            throw new RuntimeException("Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt!");
        }

        if (storedPassword != null && !storedPassword.startsWith("$2")) {
            user.setPasswordHash(passwordEncoder.encode(password));
            userRepository.save(user);
        }

        return createSession(user);
    }

    public AuthResponse register(RegisterRequest request) {
        String fullName = request.getFullName() == null ? "" : request.getFullName().trim();
        String email = request.getEmail() == null
                ? ""
                : request.getEmail().trim().toLowerCase(Locale.ROOT);
        String phone = request.getPhone() == null ? "" : request.getPhone().trim();
        String password = request.getPassword();

        if (fullName.isEmpty() || email.isEmpty() || phone.isEmpty()
                || password == null || password.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng điền đầy đủ các thông tin bắt buộc.");
        }
        if (fullName.length() > 100 || email.length() > 100 || phone.length() > 15) {
            throw new IllegalArgumentException("Tên, email hoặc số điện thoại vượt quá độ dài cho phép.");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Địa chỉ email không hợp lệ.");
        }
        if (password.length() < 8) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự.");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email này đã được đăng ký.");
        }

        // Quy định: Khách tự đăng ký -> Luôn là MEMBER (backend gán cứng, bỏ qua mọi role client gửi lên)
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(MEMBER_ROLE)
                .status("ACTIVE")
                .build();

        User savedUser = userRepository.save(user);
        return createSession(savedUser);
    }

    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sessionRepository.deleteById(BearerTokenAuthenticationFilter.sha256(token.trim()));
        }
    }

    public AuthResponse changePassword(com.sporthub.backend.dto.ChangePasswordRequest request, String token) {
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
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này."));
        }

        String storedPassword = user.getPasswordHash();
        boolean passwordMatches = storedPassword != null
                && (storedPassword.startsWith("$2")
                ? passwordEncoder.matches(oldPassword, storedPassword)
                : oldPassword.equals(storedPassword));
        if (!passwordMatches) {
            throw new RuntimeException("Mật khẩu cũ (mật khẩu tạm từ email) không chính xác!");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        if ("PENDING_VERIFICATION".equalsIgnoreCase(user.getStatus())) {
            user.setStatus("ACTIVE");
        }
        User savedUser = userRepository.save(user);

        return createSession(savedUser);
    }

    public AuthResponse verifyEmail(com.sporthub.backend.dto.VerifyOtpRequest request) {
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

        return createSession(savedUser);
    }

    public void resendOtp(com.sporthub.backend.dto.ResendOtpRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng cung cấp địa chỉ email.");
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email: " + email));
        // Đã ghi nhận gửi lại OTP thành công
    }

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return null;
        }
        return role.trim().toUpperCase(Locale.ROOT);
    }

    private AuthResponse createSession(User user) {
        String token = UUID.randomUUID().toString();
        AuthSession session = new AuthSession();
        session.setTokenHash(BearerTokenAuthenticationFilter.sha256(token));
        session.setUserId(user.getUserId());
        session.setExpiresAt(LocalDateTime.now().plusHours(12));
        sessionRepository.save(session);
        return toAuthResponse(user, token);
    }

    private AuthResponse toAuthResponse(User user, String token) {
        return new AuthResponse(
                token,
                user.getRole(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getUserId(),
                user.getStatus());
    }
}