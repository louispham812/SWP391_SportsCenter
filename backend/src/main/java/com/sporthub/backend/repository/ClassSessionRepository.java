package com.sporthub.backend.repository;

import com.sporthub.backend.entity.ClassSession;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select session from ClassSession session where session.sessionId = :sessionId")
    Optional<ClassSession> findByIdForUpdate(@Param("sessionId") Long sessionId);

    List<ClassSession> findBySportIdAndStatusOrderByStartTimeAsc(Long sportId, String status);

    List<ClassSession> findByCoachIdAndStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(
            Long coachId, LocalDateTime weekStart, LocalDateTime weekEnd);

    List<ClassSession> findByStartTimeGreaterThanEqualAndStartTimeLessThanOrderByStartTimeAsc(
            LocalDateTime weekStart, LocalDateTime weekEnd);
}
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {}
