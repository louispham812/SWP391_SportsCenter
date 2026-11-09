package com.sporthub.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(name = "membership_id")
    private Long membershipId;

    @Column(name = "voucher_id")
    private Long voucherId;

    @Column(name = "gateway_reference", length = 100)
    private String gatewayReference;

    @Column(name = "booking_type", nullable = false, length = 20)
    private String bookingType;

    @Column(name = "item_type", length = 20)
    private String itemType; // Frontend-friendly type: MEMBERSHIP, COURT, CLASS, PT, QUOTA

    @Column(name = "item_description", length = 500, columnDefinition = "NVARCHAR(500)")
    private String itemDescription; // Chi tiết: "Gói VIP 6 Tháng", "Sân Cầu Lông 01", "Lớp Yoga Cơ Bản"

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_method", nullable = false, length = 40)
    private String paymentMethod;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus;

    @Column(name = "reference_code", nullable = false, unique = true, length = 64)
    private String referenceCode;

    @Column(name = "transaction_date", length = 14)
    private String transactionDate; // Original merchant vnp_CreateDate, required by VNPay refund (not vnp_PayDate). Legacy values need reconciliation.

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "payment_completed_at")
    private LocalDateTime paymentCompletedAt; // Timestamp when payment was COMPLETED (for 2-hour refund window)
}
