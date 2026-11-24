package com.sporthub.backend.controller;

import com.sporthub.backend.config.GlobalExceptionHandler;
import com.sporthub.backend.service.AuditLogService;
import com.sporthub.backend.service.AuthService;
import com.sporthub.backend.service.EmailService;
import com.sporthub.backend.repository.AuthSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.repository.VerificationTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    @Test
    void registerCoachJsonRoundTripReturnsCoachPendingWithoutOtp() throws Exception {
        UserRepository users = mock(UserRepository.class);
        VerificationTokenRepository tokens = mock(VerificationTokenRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        EmailService emailService = mock(EmailService.class);
        when(encoder.encode(anyString())).thenReturn("$2a$encoded");
        when(users.save(any())).thenAnswer(inv -> {
            com.sporthub.backend.entity.User u = inv.getArgument(0);
            u.setUserId(88L);
            return u;
        });

        AuthService authService = new AuthService(
                users,
                mock(AuthSessionRepository.class),
                tokens,
                encoder,
                emailService,
                mock(AuditLogService.class));
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Coach Test",
                                  "phone": "0912345678",
                                  "email": "coach.roundtrip@example.com",
                                  "password": "Password1",
                                  "role": "COACH"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("COACH"))
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(emailService, never()).sendRegistrationOtpEmail(anyString(), anyString(), anyString());
    }
}
