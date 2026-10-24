package com.sporthub.backend.repository;

import com.sporthub.backend.entity.CourtBooking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CourtBookingRepository extends JpaRepository<CourtBooking, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select booking from CourtBooking booking where booking.courtBookingId = :bookingId")
    Optional<CourtBooking> findByIdForUpdate(@Param("bookingId") Long bookingId);

    @Query("""
            select count(booking) > 0
            from CourtBooking booking
            where booking.courtId = :courtId
              and booking.status = 'CONFIRMED'
              and booking.startTime < :endTime
              and booking.endTime > :startTime
            """)
    boolean existsConfirmedOverlap(
            @Param("courtId") Long courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    List<CourtBooking> findByMemberIdAndStatusOrderByStartTimeAsc(Long memberId, String status);
    List<CourtBooking> findByMemberIdOrderByStartTimeAsc(Long memberId);

    List<CourtBooking> findByCourtIdAndStatusAndStartTimeBetween(
            Long courtId, String status, LocalDateTime from, LocalDateTime to);

    @Query("""
            select count(booking) > 0
            from CourtBooking booking
            where booking.memberId = :memberId
              and booking.status = 'CONFIRMED'
              and booking.startTime < :endTime
              and booking.endTime > :startTime
            """)
    boolean existsConfirmedOverlapForMember(
            @Param("memberId") Long memberId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
