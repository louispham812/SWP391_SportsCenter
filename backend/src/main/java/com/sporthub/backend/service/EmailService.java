package com.sporthub.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.from-name:SportHub Support}")
    private String fromName;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Gửi OTP cho Member Registration
     */
    public void sendRegistrationOtpEmail(String toEmail, String fullName, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromName + " <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject("Xác thực tài khoản SportHub - Chào mừng bạn!");
            message.setText(String.format(
                "Xin chào %s,\n\n" +
                "Cảm ơn bạn đã đăng ký tài khoản SportHub!\n\n" +
                "Để hoàn tất đăng ký, vui lòng nhập mã OTP sau:\n\n" +
                "Mã OTP: %s\n\n" +
                "Mã này có hiệu lực trong 10 phút.\n\n" +
                "Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.\n\n" +
                "Trân trọng,\n" +
                "SportHub Team",
                fullName, otp
            ));

            mailSender.send(message);
            
            logger.info("==========================================================================");
            logger.info("[EMAIL-SERVICE] Registration OTP email sent successfully to: {}", toEmail);
            logger.info("[EMAIL-SERVICE] OTP Code (FOR DEBUG ONLY): {}", otp);
            logger.info("==========================================================================");
            
        } catch (Exception e) {
            logger.error("[EMAIL-SERVICE] Failed to send registration OTP email to: {}", toEmail, e);
            // Fallback: Log to console for development
            logger.info("==========================================================================");
            logger.info("[EMAIL-SERVICE-FALLBACK] Registration OTP Email (Failed to Send)");
            logger.info("[EMAIL-SERVICE-FALLBACK] To: {}", toEmail);
            logger.info("[EMAIL-SERVICE-FALLBACK] Full Name: {}", fullName);
            logger.info("[EMAIL-SERVICE-FALLBACK] OTP Code: {}", otp);
            logger.info("[EMAIL-SERVICE-FALLBACK] Error: {}", e.getMessage());
            logger.info("==========================================================================");
        }
    }

    /**
     * Gửi OTP cho Forgot Password hoặc Email Verification
     */
    public void sendOtpEmail(String toEmail, String fullName, String otp, String purpose) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromName + " <" + fromEmail + ">");
            message.setTo(toEmail);
            
            if ("FORGOT_PASSWORD".equals(purpose)) {
                message.setSubject("Mã xác thực đặt lại mật khẩu - SportHub");
                message.setText(String.format(
                    "Xin chào %s,\n\n" +
                    "Bạn đã yêu cầu đặt lại mật khẩu tài khoản SportHub.\n\n" +
                    "Mã OTP của bạn là: %s\n\n" +
                    "Mã này có hiệu lực trong 10 phút.\n\n" +
                    "Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.\n\n" +
                    "Trân trọng,\n" +
                    "SportHub Team",
                    fullName, otp
                ));
            } else {
                message.setSubject("Mã xác thực tài khoản SportHub");
                message.setText(String.format(
                    "Xin chào %s,\n\n" +
                    "Mã OTP của bạn là: %s\n\n" +
                    "Mã này có hiệu lực trong 10 phút.\n\n" +
                    "Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.\n\n" +
                    "Trân trọng,\n" +
                    "SportHub Team",
                    fullName, otp
                ));
            }

            mailSender.send(message);
            
            logger.info("==========================================================================");
            logger.info("[EMAIL-SERVICE] Email OTP sent successfully to: {}", toEmail);
            logger.info("[EMAIL-SERVICE] OTP Code (FOR DEBUG ONLY): {}", otp);
            logger.info("[EMAIL-SERVICE] Purpose: {}", purpose);
            logger.info("==========================================================================");
            
        } catch (Exception e) {
            logger.error("[EMAIL-SERVICE] Failed to send OTP email to: {}", toEmail, e);
            // Fallback: Log to console for development
            logger.info("==========================================================================");
            logger.info("[EMAIL-SERVICE-FALLBACK] OTP Email (Failed to Send)");
            logger.info("[EMAIL-SERVICE-FALLBACK] To: {}", toEmail);
            logger.info("[EMAIL-SERVICE-FALLBACK] Full Name: {}", fullName);
            logger.info("[EMAIL-SERVICE-FALLBACK] OTP Code: {}", otp);
            logger.info("[EMAIL-SERVICE-FALLBACK] Purpose: {}", purpose);
            logger.info("[EMAIL-SERVICE-FALLBACK] Error: {}", e.getMessage());
            logger.info("==========================================================================");
        }
    }

    /**
     * Gửi mật khẩu tạm thời cho Staff mới được tạo
     */
    public void sendTemporaryPasswordEmail(String toEmail, String fullName, String temporaryPassword, String role) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromName + " <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject("Tài khoản SportHub của bạn");
            message.setText(String.format(
                "Xin chào %s,\n\n" +
                "Tài khoản của bạn đã được tạo thành công!\n\n" +
                "Thông tin đăng nhập:\n" +
                "- Email: %s\n" +
                "- Mật khẩu tạm: %s\n" +
                "- Vai trò: %s\n\n" +
                "LƯU Ý QUAN TRỌNG:\n" +
                "Vui lòng đăng nhập và đổi mật khẩu ngay lần đăng nhập đầu tiên.\n\n" +
                "Link đăng nhập: http://localhost:5173/change-password\n\n" +
                "Trân trọng,\n" +
                "SportHub Team",
                fullName, toEmail, temporaryPassword, role
            ));

            mailSender.send(message);
            
            logger.info("==========================================================================");
            logger.info("[EMAIL-SERVICE] Temporary password email sent successfully to: {}", toEmail);
            logger.info("[EMAIL-SERVICE] Temporary Password (FOR DEBUG ONLY): {}", temporaryPassword);
            logger.info("[EMAIL-SERVICE] Role: {}", role);
            logger.info("==========================================================================");
            
        } catch (Exception e) {
            logger.error("[EMAIL-SERVICE] Failed to send temporary password email to: {}", toEmail, e);
            // Fallback: Log to console for development
            logger.info("==========================================================================");
            logger.info("[EMAIL-SERVICE-FALLBACK] Temporary Password Email (Failed to Send)");
            logger.info("[EMAIL-SERVICE-FALLBACK] To: {}", toEmail);
            logger.info("[EMAIL-SERVICE-FALLBACK] Full Name: {}", fullName);
            logger.info("[EMAIL-SERVICE-FALLBACK] Temporary Password: {}", temporaryPassword);
            logger.info("[EMAIL-SERVICE-FALLBACK] Role: {}", role);
            logger.info("[EMAIL-SERVICE-FALLBACK] Error: {}", e.getMessage());
            logger.info("==========================================================================");
        }
    }

    /**
     * Gửi email thông báo đặt lại mật khẩu thành công
     */
    public void sendPasswordResetSuccessEmail(String toEmail, String fullName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromName + " <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject("Mật khẩu đã được đặt lại thành công - SportHub");
            message.setText(String.format(
                "Xin chào %s,\n\n" +
                "Mật khẩu tài khoản SportHub của bạn đã được đặt lại thành công.\n\n" +
                "Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay với chúng tôi.\n\n" +
                "Trân trọng,\n" +
                "SportHub Team",
                fullName
            ));

            mailSender.send(message);
            logger.info("[EMAIL-SERVICE] Password reset success email sent to: {}", toEmail);
            
        } catch (Exception e) {
            logger.error("[EMAIL-SERVICE] Failed to send password reset success email to: {}", toEmail, e);
        }
    }
}
