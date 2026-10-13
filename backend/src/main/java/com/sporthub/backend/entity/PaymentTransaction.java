package com.sporthub.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transactions")
@Getter
@Setter
@NoArgsConstructor
public class PaymentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "booking_type", nullable = false, length = 20)
    private String bookingType;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 40)
    private String paymentMethod;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus;

    @Column(name = "reference_code", nullable = false, unique = true, length = 64)
    private String referenceCode;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
