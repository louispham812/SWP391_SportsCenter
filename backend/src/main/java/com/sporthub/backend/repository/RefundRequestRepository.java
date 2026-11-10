package com.sporthub.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sporthub.backend.entity.RefundRequest;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequest, Long> {
    boolean existsByTransactionIdAndStatusIn(Long transactionId, List<String> statuses);
    List<RefundRequest> findByTransactionId(Long transactionId);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from RefundRequest r where r.refundId = :id")
    java.util.Optional<RefundRequest> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    List<RefundRequest> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    List<RefundRequest> findAllByOrderByCreatedAtDesc();
    List<RefundRequest> findByBookingIdAndBookingType(Long bookingId, String bookingType);
}
