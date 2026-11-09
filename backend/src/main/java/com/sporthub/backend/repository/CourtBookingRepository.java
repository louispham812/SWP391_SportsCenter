package com.sporthub.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sporthub.backend.entity.CourtBooking;

import jakarta.persistence.LockModeType;

public interface CourtBookingRepository extends JpaRepository<CourtBooking, Long> {
    @Query("""
            select b from CourtBooking b where b.memberId = :memberId and b.status = 'CONFIRMED'
              and b.startTime >= :dayStart and b.startTime < :dayEnd and b.startTime <= :now and b.endTime > :now
            order by b.startTime, b.courtBookingId
            """)
    List<CourtBooking> findCheckInEligibleBookings(@Param("memberId") Long memberId,
            @Param("dayStart") LocalDateTime dayStart, @Param("dayEnd") LocalDateTime dayEnd,
            @Param("now") LocalDateTime now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select booking from CourtBooking booking where booking.courtBookingId = :bookingId")
    Optional<CourtBooking> findByIdForUpdate(@Param("bookingId") Long bookingId);

    @Query("""
            select count(booking) > 0
            from CourtBooking booking
            where booking.courtId = :courtId
              and booking.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
              and booking.startTime < :endTime
              and booking.endTime > :startTime
            """)
    boolean existsConfirmedOverlap(
            @Param("courtId") Long courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    List<CourtBooking> findByMemberIdAndStatusOrderByStartTimeAsc(Long memberId, String status);
    List<CourtBooking> findByMemberIdOrderByStartTimeAsc(Long memberId);
    List<CourtBooking> findByStatus(String status);

    @Query("""
            select b from CourtBooking b where b.courtId = :courtId
              and (b.status = :status or (:status = 'CONFIRMED' and b.status = 'CHECKED_IN'))
              and b.startTime between :from and :to
            """)
    List<CourtBooking> findByCourtIdAndStatusAndStartTimeBetween(
            @Param("courtId") Long courtId, @Param("status") String status,
            @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
    List<CourtBooking> findByStatusIgnoreCaseAndCreatedAtBefore(String status, LocalDateTime before);
    
    // Find court booking by payment_id (for webhook lookup)
    CourtBooking findByPaymentId(Long paymentId);

    @Query("""
            select count(booking) > 0
            from CourtBooking booking
            where booking.memberId = :memberId
              and booking.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
              and booking.startTime < :endTime
              and booking.endTime > :startTime
            """)
    boolean existsConfirmedOverlapForMember(
            @Param("memberId") Long memberId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
    
    /**
     * Count distinct courts booked by member in time range (BR-COURT-02)
     * Enforces max 3 concurrent court bookings per member
     * 
     * @param memberId Member ID
     * @param startTime Start of time range
     * @param endTime End of time range
     * @return Number of distinct courts this member has booked in this time range
     */
    @Query("""
            SELECT COUNT(DISTINCT booking.courtId)
            FROM CourtBooking booking
            WHERE booking.memberId = :memberId
              AND booking.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
              AND booking.startTime < :endTime
              AND booking.endTime > :startTime
            """)
    long countMemberConcurrentCourts(
            @Param("memberId") Long memberId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("""
            SELECT cb FROM CourtBooking cb
            WHERE cb.courtId = :courtId
              AND cb.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
              AND cb.startTime < :endTime
              AND cb.endTime > :startTime
            """)
    List<CourtBooking> findActiveOverlappingBookings(
            @Param("courtId") Long courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    @Query("""
            SELECT COUNT(cb) > 0
            FROM CourtBooking cb
            WHERE cb.courtId = :courtId
              AND cb.courtBookingId <> :excludeBookingId
              AND cb.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
              AND cb.startTime < :endTime
              AND cb.endTime > :startTime
            """)
    boolean existsConfirmedOverlapExcluding(
            @Param("courtId") Long courtId,
            @Param("excludeBookingId") Long excludeBookingId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
