package com.sporthub.backend.repository;

import com.sporthub.backend.entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from PaymentTransaction p where p.paymentId = :id")
    java.util.Optional<PaymentTransaction> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    java.util.Optional<PaymentTransaction> findByReferenceCodeIgnoreCase(String code);
    java.util.Optional<PaymentTransaction> findFirstByMembershipIdOrderByCreatedAtDesc(Long membershipId);
    List<PaymentTransaction> findByPaymentMethodAndPaymentStatusOrderByCreatedAtDesc(String method, String status);
    List<PaymentTransaction> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            LocalDateTime start, LocalDateTime end);
    List<PaymentTransaction> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    
    List<PaymentTransaction> findByBookingTypeAndPaymentStatusIgnoreCaseAndCreatedAtBefore(
            String bookingType, String paymentStatus, LocalDateTime createdBefore);
}
