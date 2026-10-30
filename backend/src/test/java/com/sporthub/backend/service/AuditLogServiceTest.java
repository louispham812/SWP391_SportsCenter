
package com.sporthub.backend.service;

import com.sporthub.backend.entity.AuditLog;
import com.sporthub.backend.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuditLogServiceTest {

    private AuditLogRepository repository;
    private AuditLogService service;

    @BeforeEach
    void setUp() {
        repository = mock(AuditLogRepository.class);
        service = new AuditLogService(repository);
    }

    @Test
    void logSuccessSavesSuccessAuditLog() {
        service.logSuccess(
                "LOGIN",
                "member@example.com",
                10L,
                "Member logged in"
        );

        var captor = org.mockito.ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());

        AuditLog log = captor.getValue();
        assertEquals("LOGIN", log.getLogType());
        assertEquals("member@example.com", log.getUserEmail());
        assertEquals(10L, log.getUserId());
        assertEquals("Member logged in", log.getActionDetail());
        assertEquals("SUCCESS", log.getStatus());
    }

    @Test
    void logFailureSavesFailedAuditLogWithErrorMessage() {
        service.logFailure(
                "LOGIN",
                "member@example.com",
                10L,
                "Login attempt",
                "Invalid password"
        );

        var captor = org.mockito.ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());

        AuditLog log = captor.getValue();
        assertEquals("LOGIN", log.getLogType());
        assertEquals("FAILED", log.getStatus());
        assertEquals("Invalid password", log.getErrorMessage());
        assertEquals("Login attempt", log.getActionDetail());
    }

    @Test
    void logWithRequestSavesIpAddressAndUserAgent() {
        service.logWithRequest(
                "UPDATE_PROFILE",
                "member@example.com",
                10L,
                "Updated profile",
                "SUCCESS",
                null,
                "127.0.0.1",
                "Mozilla/5.0"
        );

        var captor = org.mockito.ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());

        AuditLog log = captor.getValue();
        assertEquals("UPDATE_PROFILE", log.getLogType());
        assertEquals("SUCCESS", log.getStatus());
        assertEquals("127.0.0.1", log.getIpAddress());
        assertEquals("Mozilla/5.0", log.getUserAgent());
    }

    @Test
    void logSuccessDoesNotPropagateRepositoryException() {
        when(repository.save(any(AuditLog.class)))
                .thenThrow(new RuntimeException("Database unavailable"));

        assertDoesNotThrow(() -> service.logSuccess(
                "LOGIN",
                "member@example.com",
                10L,
                "Login attempt"
        ));
    }

    @Test
    void logFailureDoesNotPropagateRepositoryException() {
        when(repository.save(any(AuditLog.class)))
                .thenThrow(new RuntimeException("Database unavailable"));

        assertDoesNotThrow(() -> service.logFailure(
                "LOGIN",
                "member@example.com",
                10L,
                "Login attempt",
                "Invalid password"
        ));
    }
}
