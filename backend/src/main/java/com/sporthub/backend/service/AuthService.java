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

import java.util.Locale;
import java.util.UUID;
import java.time.LocalDateTime;

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
        String requestedRole = normalizeRole(request.getRole());
        if (identifier.isEmpty() || password == null || password.isEmpty() || requestedRole == null) {
            throw new IllegalArgumentException("Vui lòng nhập email/số điện thoại, mật khẩu và vai trò.");
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

        if (!requestedRole.equalsIgnoreCase(user.getRole())) {
            throw new RuntimeException("Tài khoản không thuộc vai trò bạn đã chọn.");
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
        String role = normalizeRole(request.getRole());

        if (fullName.isEmpty() || email.isEmpty() || phone.isEmpty()
                || password == null || password.isEmpty() || role == null) {
            throw new IllegalArgumentException("Vui lòng điền đầy đủ các thông tin bắt buộc và chọn vai trò.");
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

        if (!MEMBER_ROLE.equals(role) && !COACH_ROLE.equals(role) && !RECEPTIONIST_ROLE.equals(role)) {
            throw new IllegalArgumentException("Vai trò đăng ký không hợp lệ.");
        }

        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .status(MEMBER_ROLE.equals(role) ? "ACTIVE" : "PENDING")
                .build();

        User savedUser = userRepository.save(user);
        return "ACTIVE".equals(savedUser.getStatus())
                ? createSession(savedUser)
                : toAuthResponse(savedUser, null);
    }

    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sessionRepository.deleteById(BearerTokenAuthenticationFilter.sha256(token.trim()));
        }
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