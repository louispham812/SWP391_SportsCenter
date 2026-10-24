package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByMemberId(Long memberId);
    List<Booking> findBySessionId(Long sessionId);
    List<Booking> findBySessionIdInAndStatusIn(List<Long> sessionIds, List<String> statuses);
    List<Booking> findBySessionIdAndStatusInOrderByBookingTimeAsc(Long sessionId, List<String> statuses);
    List<Booking> findByMemberIdAndStatusIn(Long memberId, List<String> statuses);
    boolean existsByMemberIdAndSessionIdAndStatusIn(Long memberId, Long sessionId, List<String> statuses);
    long countBySessionIdAndStatusIn(Long sessionId, List<String> statuses);

    @Query("""
            SELECT COUNT(b) > 0
            FROM Booking b
            JOIN ClassSession s ON b.sessionId = s.sessionId
            WHERE b.memberId = :memberId
              AND b.status IN :statuses
              AND s.status <> 'CANCELLED'
              AND s.startTime < :endTime
              AND s.endTime > :startTime
            """)
    boolean existsOverlappingBookingForMember(
            @Param("memberId") Long memberId,
            @Param("statuses") List<String> statuses,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}