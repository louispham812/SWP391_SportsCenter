
package com.sporthub.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmailServiceTest {

    private JavaMailSender mailSender;
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        emailService = new EmailService(mailSender);

        ReflectionTestUtils.setField(
                emailService, "fromEmail", "noreply@sporthub.test"
        );
        ReflectionTestUtils.setField(
                emailService, "fromName", "SportHub Support"
        );
    }

    @Test
    void sendRegistrationOtpEmailSendsCorrectRecipientAndOtp() {
        emailService.sendRegistrationOtpEmail(
                "member@example.com",
                "Test Member",
                "123456"
        );

        var captor = org.mockito.ArgumentCaptor
                .forClass(SimpleMailMessage.class);

        verify(mailSender).send(captor.capture());

        SimpleMailMessage message = captor.getValue();

        assertArrayEquals(
                new String[]{"member@example.com"},
                message.getTo()
        );
        assertTrue(message.getText().contains("123456"));
        assertTrue(message.getText().contains("Test Member"));
        assertTrue(message.getSubject().contains("SportHub"));
    }

    @Test
    void sendOtpEmailUsesForgotPasswordSubject() {
        emailService.sendOtpEmail(
                "member@example.com",
                "Test Member",
                "654321",
                "FORGOT_PASSWORD"
        );

        var captor = org.mockito.ArgumentCaptor
                .forClass(SimpleMailMessage.class);

        verify(mailSender).send(captor.capture());

        assertTrue(captor.getValue().getSubject()
                .contains("đặt lại mật khẩu"));
        assertTrue(captor.getValue().getText().contains("654321"));
    }

    @Test
    void sendOtpEmailUsesVerificationSubjectForOtherPurpose() {
        emailService.sendOtpEmail(
                "member@example.com",
                "Test Member",
                "123456",
                "EMAIL_VERIFICATION"
        );

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendPasswordResetSuccessEmailSendsNotification() {
        emailService.sendPasswordResetSuccessEmail(
                "member@example.com",
                "Test Member"
        );

        var captor = org.mockito.ArgumentCaptor
                .forClass(SimpleMailMessage.class);

        verify(mailSender).send(captor.capture());

        assertArrayEquals(
                new String[]{"member@example.com"},
                captor.getValue().getTo()
        );
        assertTrue(captor.getValue().getText().contains("Test Member"));
    }

    @Test
    void emailSendingFailureDoesNotPropagateException() {
        doThrow(new RuntimeException("SMTP unavailable"))
                .when(mailSender)
                .send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() ->
                emailService.sendRegistrationOtpEmail(
                        "member@example.com",
                        "Test Member",
                        "123456"
                )
        );
    }
}
