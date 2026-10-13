package com.sporthub.backend.repository;

import com.sporthub.backend.entity.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    Optional<AuthSession> findByTokenHashAndExpiresAtAfter(String tokenHash, LocalDateTime now);
}
