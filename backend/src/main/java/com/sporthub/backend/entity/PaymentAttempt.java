package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "payment_attempts")
@Getter @Setter @NoArgsConstructor
public class PaymentAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "attempt_id") private Long attemptId;
    @Column(name = "payment_id", nullable = false) private Long paymentId;
    @Column(name = "gateway_reference", nullable = false, unique = true, length = 100) private String gatewayReference;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amount;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "payment_url", columnDefinition = "NVARCHAR(MAX)") private String paymentUrl;
    @Column(name = "merchant_date", length = 14) private String merchantDate;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "expires_at", nullable = false) private LocalDateTime expiresAt;
}
