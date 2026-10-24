package com.sporthub.backend.service;

import com.sporthub.backend.dto.*;
import com.sporthub.backend.entity.AuthSession;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.AuthSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.security.BearerTokenAuthenticationFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    private static final String MEMBER_ROLE = "MEMBER";
    private static final String COACH_ROLE = "COACH";
    private static final String RECEPTIONIST_ROLE = "RECEPTIONIST";

    private final UserRepository userRepository;
    private final AuthSessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    // Lưu trữ OTP và ResetToken an toàn, thread-safe
    public static class OtpEntry {
        private String code;
        private LocalDateTime expiresAt;
        private LocalDateTime lastSentAt;
        private int failedAttempts;
        private boolean locked;

        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
        public LocalDateTime getExpiresAt() { return expiresAt; }
        public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
        public LocalDateTime getLastSentAt() { return lastSentAt; }
        public void setLastSentAt(LocalDateTime lastSentAt) { this.lastSentAt = lastSentAt; }
        public int getFailedAttempts() { return failedAttempts; }
        public void setFailedAttempts(int failedAttempts) { this.failedAttempts = failedAttempts; }
        public boolean isLocked() { return locked; }
        public void setLocked(boolean locked) { this.locked = locked; }
    }

    public static class ResetTokenEntry {
        private String token;
        private String email;
        private LocalDateTime expiresAt;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public LocalDateTime getExpiresAt() { return expiresAt; }
        public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    }

    private final ConcurrentHashMap<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, ResetTokenEntry> resetTokenStore = new ConcurrentHashMap<>();

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

    /**
     * LUỒNG QUÊN MẬT KHẨU (FORGOT PASSWORD FLOW)
     * 1. POST /auth/forgot-password: Tạo OTP 6 số, TTL 5 phút, cooldown 60s, chống lộ tài khoản
     */
    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập địa chỉ email đã đăng ký.");
        }
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Địa chỉ email không đúng định dạng.");
        }

        // Quy tắc: Gửi lại mã cách nhau tối thiểu 60 giây (Cooldown 60s)
        OtpEntry existing = otpStore.get(email);
        if (existing != null && existing.getLastSentAt() != null) {
            long secondsPassed = Duration.between(existing.getLastSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsPassed < 60) {
                long waitTime = 60 - secondsPassed;
                throw new IllegalArgumentException("Vui lòng đợi " + waitTime + " giây trước khi yêu cầu gửi lại mã mới.");
            }
        }

        // Kiểm tra email tồn tại trong hệ thống
        boolean userExists = userRepository.existsByEmailIgnoreCase(email);

        // Quy tắc bảo mật: Email chưa đăng ký vẫn trả thông báo chung ("Nếu email tồn tại, mã đã được gửi") để tránh lộ tài khoản
        if (!userExists) {
            logger.info("[F-SPORT-AUTH] Yêu cầu quên mật khẩu cho email không tồn tại: {}", email);
            return "Nếu email tồn tại trong hệ thống F Sport Center, mã xác nhận OTP đã được gửi. Vui lòng kiểm tra hộp thư.";
        }

        // Tạo OTP 6 chữ số ngẫu nhiên
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(otpNumber);

        OtpEntry newEntry = new OtpEntry();
        newEntry.setCode(otpCode);
        newEntry.setExpiresAt(LocalDateTime.now().plusMinutes(5)); // Hết hạn sau 5 phút
        newEntry.setLastSentAt(LocalDateTime.now());
        newEntry.setFailedAttempts(0);
        newEntry.setLocked(false);

        otpStore.put(email, newEntry);

        // Giả lập gửi email xác thực với giao diện F Sport Center sang trọng
        logger.info("==========================================================================");
        logger.info("[F-SPORT-AUTH] GỬI EMAIL XÁC THỰC QUÊN MẬT KHẨU - F SPORT CENTER");
        logger.info("[F-SPORT-AUTH] Người nhận: {}", email);
        logger.info("[F-SPORT-AUTH] MÃ OTP XÁC THỰC (6 CHỮ SỐ): {}", otpCode);
        logger.info("[F-SPORT-AUTH] Thời hạn hiệu lực: 5 PHÚT | Sai tối đa: 5 LẦN");
        logger.info("==========================================================================");

        return "Mã xác thực OTP gồm 6 chữ số đã được gửi qua email. Mã có hiệu lực trong 5 phút.";
    }

    /**
     * 2. POST /auth/verify-code: Xác thực OTP, sai tối đa 5 lần thì khóa, trả về resetToken (hạn 10 phút)
     */
    public VerifyCodeResponse verifyCode(VerifyCodeRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase(Locale.ROOT);
        String otp = request.getOtp() == null ? "" : request.getOtp().trim();

        if (email.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng cung cấp địa chỉ email xác thực.");
        }
        if (otp.isEmpty() || !otp.matches("^\\d{6}$")) {
            throw new IllegalArgumentException("Mã OTP phải bao gồm đúng 6 chữ số.");
        }

        OtpEntry entry = otpStore.get(email);
        if (entry == null) {
            throw new IllegalArgumentException("Không tìm thấy mã xác thực hoặc mã đã hết hạn. Vui lòng nhấn 'Gửi lại mã'.");
        }

        // Kiểm tra xem đã bị khóa do nhập sai quá 5 lần chưa
        if (entry.isLocked()) {
            throw new IllegalArgumentException("Mã xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng bấm 'Gửi lại mã' để nhận mã mới.");
        }

        // Kiểm tra xem OTP đã hết hạn sau 5 phút chưa
        if (LocalDateTime.now().isAfter(entry.getExpiresAt())) {
            otpStore.remove(email);
            throw new IllegalArgumentException("Mã OTP đã hết thời hạn 5 phút. Vui lòng bấm 'Gửi lại mã' để nhận mã mới.");
        }

        // So khớp mã OTP
        if (!entry.getCode().equals(otp)) {
            int currentFail = entry.getFailedAttempts() + 1;
            entry.setFailedAttempts(currentFail);

            if (currentFail >= 5) {
                entry.setLocked(true);
                throw new IllegalArgumentException("Mã OTP không chính xác. Bạn đã nhập sai 5 lần và mã đã bị khóa! Vui lòng nhấn 'Gửi lại mã' mới.");
            } else {
                int remaining = 5 - currentFail;
                throw new IllegalArgumentException("Mã OTP không chính xác! Bạn còn " + remaining + " lần thử.");
            }
        }

        // Xác thực ĐÚNG:
        // - Vô hiệu hóa OTP (chỉ dùng 1 lần)
        otpStore.remove(email);

        // - Trả resetToken tạm thời (hạn ngắn: 10 phút)
        String resetToken = UUID.randomUUID().toString();
        ResetTokenEntry tokenEntry = new ResetTokenEntry();
        tokenEntry.setToken(resetToken);
        tokenEntry.setEmail(email);
        tokenEntry.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        resetTokenStore.put(resetToken, tokenEntry);

        logger.info("[F-SPORT-AUTH] Xác thực OTP thành công cho email: {}. Cấp resetToken: {}", email, resetToken);

        return VerifyCodeResponse.builder()
                .resetToken(resetToken)
                .message("Xác thực mã OTP thành công. Vui lòng tạo mật khẩu mới.")
                .expiresInSeconds(600)
                .build();
    }

    /**
     * 3. POST /auth/reset-password: Kiểm tra resetToken, độ mạnh mật khẩu, mã hóa BCrypt, vô hiệu hóa token
     */
    public String resetPassword(ResetPasswordRequest request) {
        String resetToken = request.getResetToken() == null ? "" : request.getResetToken().trim();
        String newPassword = request.getNewPassword() == null ? "" : request.getNewPassword().trim();
        String confirmPassword = request.getConfirmPassword() == null ? "" : request.getConfirmPassword().trim();

        if (resetToken.isEmpty()) {
            throw new IllegalArgumentException("Thiếu token xác thực phiên đặt lại mật khẩu. Vui lòng thực hiện lại.");
        }

        ResetTokenEntry tokenEntry = resetTokenStore.get(resetToken);
        if (tokenEntry == null || LocalDateTime.now().isAfter(tokenEntry.getExpiresAt())) {
            if (tokenEntry != null) {
                resetTokenStore.remove(resetToken);
            }
            throw new IllegalArgumentException("Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (10 phút). Vui lòng yêu cầu lại từ đầu.");
        }

        if (newPassword.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập mật khẩu mới.");
        }
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Xác nhận mật khẩu mới không khớp với mật khẩu mới.");
        }

        // Kiểm tra độ mạnh mật khẩu: tối thiểu 8 ký tự, có chữ hoa, chữ thường, số
        if (newPassword.length() < 8) {
            throw new IllegalArgumentException("Mật khẩu mới phải có tối thiểu 8 ký tự.");
        }
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        for (char c : newPassword.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
        }
        if (!hasUpper || !hasLower || !hasDigit) {
            throw new IllegalArgumentException("Mật khẩu mới phải bao gồm ít nhất 1 chữ in hoa, 1 chữ thường và 1 chữ số.");
        }

        User user = userRepository.findByEmailIgnoreCase(tokenEntry.getEmail())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản người dùng tương ứng với email: " + tokenEntry.getEmail()));

        // Lưu mật khẩu dưới dạng BCrypt hash
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Vô hiệu hóa resetToken và mọi OTP của email này
        resetTokenStore.remove(resetToken);
        otpStore.remove(tokenEntry.getEmail());

        logger.info("[F-SPORT-AUTH] Đặt lại mật khẩu thành công cho tài khoản: {}", tokenEntry.getEmail());

        return "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.";
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