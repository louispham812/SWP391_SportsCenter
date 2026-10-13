package com.sporthub.backend.repository;

import com.sporthub.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByMemberId(Long memberId);
    List<Booking> findBySessionId(Long sessionId);
    List<Booking> findBySessionIdInAndStatusIn(List<Long> sessionIds, List<String> statuses);
    List<Booking> findBySessionIdAndStatusInOrderByBookingTimeAsc(Long sessionId, List<String> statuses);
    List<Booking> findByMemberIdAndStatusIn(Long memberId, List<String> statuses);
    boolean existsByMemberIdAndSessionIdAndStatusIn(Long memberId, Long sessionId, List<String> statuses);
    long countBySessionIdAndStatusIn(Long sessionId, List<String> statuses);
}