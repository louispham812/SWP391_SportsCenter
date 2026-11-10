package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "gateway_receipts")
@Getter @Setter @NoArgsConstructor
public class GatewayReceipt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "receipt_id") private Long receiptId;
    @Column(name = "payment_id", nullable = false) private Long paymentId;
    @Column(name = "attempt_id", nullable = false) private Long attemptId;
    @Column(name = "gateway_transaction_no", nullable = false, unique = true, length = 100) private String gatewayTransactionNo;
    @Column(name = "gateway_reference", nullable = false, length = 100) private String gatewayReference;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal amount;
    @Column(name = "transaction_date", length = 14) private String transactionDate;
    @Column(nullable = false, length = 24) private String status; // APPLIED, EXCESS, REFUNDED, REVIEW_REQUIRED
    @Column(name = "reconciliation_note", length = 500) private String reconciliationNote;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "resolved_at") private LocalDateTime resolvedAt;
}
