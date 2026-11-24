
package com.sporthub.backend.service;

import com.sporthub.backend.dto.AuthResponse;
import com.sporthub.backend.dto.LoginRequest;
import com.sporthub.backend.dto.RegisterRequest;
import com.sporthub.backend.dto.VerifyOtpRequest;
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

    @Test
    void registerCoachEntersPendingWithoutSportsAndSkipsOtpEmail() {
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(42L);
            return u;
        });

        AuthResponse response = authService.register(new RegisterRequest(
                "HLV An",
                "coach.an@example.com",
                "0912345678",
                "Coach@123",
                "coach"
        ));

        assertEquals("COACH", response.getRole());
        assertEquals("PENDING", response.getStatus());
        verify(userRepository).save(argThat(u -> "COACH".equals(u.getRole()) && "PENDING".equals(u.getStatus()) && u.getSpecialty() == null));
        verifyNoInteractions(verificationTokenRepository);
        verify(emailService, never()).sendRegistrationOtpEmail(anyString(), anyString(), anyString());

        User pendingCoach = User.builder()
                .userId(42L)
                .fullName("HLV An")
                .email("coach.an@example.com")
                .passwordHash("$2a$encoded")
                .role("COACH")
                .status("PENDING")
                .build();
        when(userRepository.findByEmailIgnoreCase("coach.an@example.com")).thenReturn(Optional.of(pendingCoach));
        when(passwordEncoder.matches("Coach@123", "$2a$encoded")).thenReturn(true);

        IllegalArgumentException verifyEx = assertThrows(IllegalArgumentException.class, () ->
                authService.verifyEmail(new VerifyOtpRequest("coach.an@example.com", "123456")));
        assertTrue(verifyEx.getMessage().contains("Quản lý phê duyệt"));

        IllegalArgumentException loginEx = assertThrows(IllegalArgumentException.class, () ->
                authService.login(createLoginRequest("coach.an@example.com", "Coach@123")));
        assertTrue(loginEx.getMessage().contains("Quản lý phê duyệt"));
    }

    @Test
    void registerReceptionistEntersPendingWithoutOtpAndRejectsPrivilegedRoles() {
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(43L);
            return u;
        });

        AuthResponse receptionist = authService.register(new RegisterRequest(
                "Lễ Tân Mai",
                "recep.mai@example.com",
                "0912345670",
                "Recep@123",
                "RECEPTIONIST"
        ));

        assertEquals("RECEPTIONIST", receptionist.getRole());
        assertEquals("PENDING", receptionist.getStatus());
        verifyNoInteractions(verificationTokenRepository);
        verify(emailService, never()).sendRegistrationOtpEmail(anyString(), anyString(), anyString());

        assertThrows(IllegalArgumentException.class, () ->
                authService.register(new RegisterRequest(
                        "Fake Admin",
                        "fake.admin@example.com",
                        "0912345671",
                        "Admin@123",
                        "ADMIN"
                ))
        );
        assertThrows(IllegalArgumentException.class, () ->
                authService.register(new RegisterRequest(
                        "Fake Manager",
                        "fake.mgr@example.com",
                        "0912345672",
                        "Mgr@1234",
                        "MANAGER"
                ))
        );
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
