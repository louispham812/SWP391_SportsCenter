package com.sporthub.backend.repository;

import com.sporthub.backend.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    List<PaymentTransaction> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            LocalDateTime start, LocalDateTime end);
    List<PaymentTransaction> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    
    List<PaymentTransaction> findByBookingTypeAndPaymentStatusIgnoreCaseAndCreatedAtBefore(
            String bookingType, String paymentStatus, LocalDateTime createdBefore);
}
