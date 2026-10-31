
package com.sporthub.backend.service;

import com.sporthub.backend.dto.AuthResponse;
import com.sporthub.backend.dto.LoginRequest;
import com.sporthub.backend.entity.AuthSession;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.AuthSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.repository.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private AuthSessionRepository sessionRepository;
    private VerificationTokenRepository verificationTokenRepository;
    private PasswordEncoder passwordEncoder;
    private EmailService emailService;
    private AuditLogService auditLogService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        sessionRepository = mock(AuthSessionRepository.class);
        verificationTokenRepository = mock(VerificationTokenRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        emailService = mock(EmailService.class);
        auditLogService = mock(AuditLogService.class);

        authService = new AuthService(
                userRepository,
                sessionRepository,
                verificationTokenRepository,
                passwordEncoder,
                emailService,
                auditLogService
        );
    }

    @Test
    void loginWithValidEmailAndPasswordCreatesSession() {
        User user = activeUser("$2a$hashedPassword");

        when(userRepository.findByEmailIgnoreCase("member@example.com"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "$2a$hashedPassword"))
                .thenReturn(true);

        AuthResponse response = authService.login(
                createLoginRequest("member@example.com", "Password123")
        );

        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("MEMBER", response.getRole());
        assertEquals("member@example.com", response.getEmail());
        verify(sessionRepository).save(any(AuthSession.class));
        verify(auditLogService).logSuccess(
                eq("LOGIN"),
                eq("member@example.com"),
                eq(1L),
                anyString()
        );
    }

    @Test
    void loginWithValidPhoneAndPasswordCreatesSession() {
        User user = activeUser("$2a$hashedPassword");

        when(userRepository.findByEmailIgnoreCase("0900000000"))
                .thenReturn(Optional.empty());
        when(userRepository.findByPhone("0900000000"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "$2a$hashedPassword"))
                .thenReturn(true);

        AuthResponse response = authService.login(
                createLoginRequest("0900000000", "Password123")
        );

        assertNotNull(response);
        assertNotNull(response.getToken());
        verify(userRepository).findByPhone("0900000000");
        verify(sessionRepository).save(any(AuthSession.class));
    }

    @Test
    void loginWithWrongPasswordThrowsException() {
        User user = activeUser("$2a$hashedPassword");

        when(userRepository.findByEmailIgnoreCase("member@example.com"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "$2a$hashedPassword"))
                .thenReturn(false);

        assertThrows(RuntimeException.class, () ->
                authService.login(
                        createLoginRequest("member@example.com", "WrongPassword")
                )
        );

        verify(sessionRepository, never()).save(any(AuthSession.class));
        verify(auditLogService).logFailure(
                eq("LOGIN"),
                eq("member@example.com"),
                eq(1L),
                anyString(),
                eq("Wrong password")
        );
    }

    @Test
    void loginWithUnknownUserThrowsException() {
        when(userRepository.findByEmailIgnoreCase("unknown@example.com"))
                .thenReturn(Optional.empty());
        when(userRepository.findByPhone("unknown@example.com"))
                .thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
                authService.login(
                        createLoginRequest("unknown@example.com", "Password123")
                )
        );

        verify(sessionRepository, never()).save(any(AuthSession.class));
    }

    @Test
    void loginWithInactiveAccountThrowsException() {
        User user = activeUser("$2a$hashedPassword");
        user.setStatus("INACTIVE");

        when(userRepository.findByEmailIgnoreCase("member@example.com"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "$2a$hashedPassword"))
                .thenReturn(true);

        assertThrows(RuntimeException.class, () ->
                authService.login(
                        createLoginRequest("member@example.com", "Password123")
                )
        );

        verify(sessionRepository, never()).save(any(AuthSession.class));
    }

    @Test
    void loginWithEmptyCredentialsThrowsException() {
        assertThrows(IllegalArgumentException.class, () ->
                authService.login(createLoginRequest("", ""))
        );

        verify(sessionRepository, never()).save(any(AuthSession.class));
    }

    private LoginRequest createLoginRequest(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private User activeUser(String passwordHash) {
        return User.builder()
                .userId(1L)
                .fullName("Test Member")
                .email("member@example.com")
                .phone("0900000000")
                .passwordHash(passwordHash)
                .role("MEMBER")
                .status("ACTIVE")
                .requirePasswordChange(false)
                .build();
    }
}
