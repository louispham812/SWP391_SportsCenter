package com.sporthub.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sporthub.backend.entity.RefundRequest;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {
    List<RefundRequest> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<RefundRequest> findAllByOrderByCreatedAtDesc();
    List<RefundRequest> findByBookingIdAndBookingType(Long bookingId, String bookingType);
}
