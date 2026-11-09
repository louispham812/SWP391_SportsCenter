package com.sporthub.backend.repository;
import com.sporthub.backend.entity.PaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {
    Optional<PaymentAttempt> findByGatewayReference(String reference);
    Optional<PaymentAttempt> findFirstByPaymentIdAndStatusOrderByCreatedAtDesc(Long paymentId, String status);
}
