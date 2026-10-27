package com.sporthub.backend.repository;

import com.sporthub.backend.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByEmailAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
            String email, 
            String tokenType, 
            LocalDateTime now);

    Optional<VerificationToken> findByTokenHashAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
            String tokenHash,
            String tokenType,
            LocalDateTime now);

    @Modifying
    @Query("UPDATE VerificationToken vt SET vt.usedAt = :now WHERE vt.email = :email AND vt.tokenType = :tokenType AND vt.usedAt IS NULL")
    void markAllUsed(@Param("email") String email, @Param("tokenType") String tokenType, @Param("now") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.email = :email AND vt.tokenType = :tokenType")
    void deleteByEmailAndTokenType(@Param("email") String email, @Param("tokenType") String tokenType);

    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);
    
    boolean existsByEmailAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
            String email,
            String tokenType,
            LocalDateTime now);
}
