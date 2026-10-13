package com.sporthub.backend.repository;

import com.sporthub.backend.entity.CourtBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CourtBookingRepository extends JpaRepository<CourtBooking, Long> {
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

    List<CourtBooking> findByCourtIdAndStatusAndStartTimeBetween(
            Long courtId, String status, LocalDateTime from, LocalDateTime to);
}
