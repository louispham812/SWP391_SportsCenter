package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "refund_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "refund_id")
    private Long refundId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_name", length = 100)
    private String memberName;

    @Column(length = 20)
    private String phone;

    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "reference_code", length = 50)
    private String referenceCode;

    @Column(name = "booking_description", length = 255)
    private String bookingDescription;

    @Column(name = "refund_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account", length = 50)
    private String bankAccount;

    @Column(name = "account_holder", length = 100)
    private String accountHolder;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "decision_note", length = 500)
    private String decisionNote;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
