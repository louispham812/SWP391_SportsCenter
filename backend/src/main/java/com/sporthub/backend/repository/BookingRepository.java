package com.sporthub.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sporthub.backend.entity.Booking;

import jakarta.persistence.LockModeType;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByMemberId(Long memberId);
    List<Booking> findBySessionId(Long sessionId);
    List<Booking> findBySessionIdInAndStatusIn(List<Long> sessionIds, List<String> statuses);
    List<Booking> findBySessionIdAndStatusInOrderByBookingTimeAsc(Long sessionId, List<String> statuses);
    List<Booking> findByMemberIdAndStatusIn(Long memberId, List<String> statuses);
    List<Booking> findByStatus(String status);
    boolean existsByMemberIdAndSessionIdAndStatusIn(Long memberId, Long sessionId, List<String> statuses);
    long countBySessionIdAndStatusIn(Long sessionId, List<String> statuses);
    
    /**
     * Count bookings with PESSIMISTIC_WRITE lock to prevent race condition
     * Used in checkout flow to ensure slot availability atomically
     * 
     * @param sessionId ClassSession ID
     * @param statuses List of booking statuses (typically BOOKED, CONFIRMED)
     * @return Number of active bookings for this session
     */
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.sessionId = :sessionId AND b.status IN :statuses")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    long countActiveBookingsWithLock(@Param("sessionId") Long sessionId, @Param("statuses") List<String> statuses);
    
    List<Booking> findByStatusIgnoreCaseAndBookingTimeBefore(String status, LocalDateTime before);
    
    // Find booking by payment_id (for webhook lookup)
    Booking findByPaymentId(Long paymentId);

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
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    boolean existsOverlappingBookingForMember(
            @Param("memberId") Long memberId,
            @Param("statuses") List<String> statuses,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}