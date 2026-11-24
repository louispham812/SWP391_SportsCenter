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

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<VerificationToken> findByEmailAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
            String email, 
            String tokenType, 
            LocalDateTime now);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    Optional<VerificationToken> findByTokenHashAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
            String tokenHash,
            String tokenType,
            LocalDateTime now);

    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.email = :email AND vt.tokenType = :tokenType")
    void deleteByEmailAndTokenType(@Param("email") String email, @Param("tokenType") String tokenType);

}
