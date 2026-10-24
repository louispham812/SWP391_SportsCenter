package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipment_loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentLoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "loan_id")
    private Long loanId;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "member_name", length = 100)
    private String memberName;

    @Column(length = 20)
    private String phone;

    @Column(name = "item_id", nullable = false)
    private Long itemId;

    @Column(name = "item_name", length = 150)
    private String itemName;

    @Builder.Default
    @Column(nullable = false)
    private Integer quantity = 1;

    @Column(name = "rental_price_per_hour", nullable = false, precision = 12, scale = 2)
    private BigDecimal rentalPricePerHour;

    @Builder.Default
    @Column(name = "loaned_at", nullable = false)
    private LocalDateTime loanedAt = LocalDateTime.now();

    @Column(name = "returned_at")
    private LocalDateTime returnedAt;

    @Column(name = "rental_fee", precision = 12, scale = 2)
    private BigDecimal rentalFee;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "BORROWED"; // BORROWED, RETURNED, LOST

    @Column(name = "payment_method", length = 20)
    private String paymentMethod; // CASH, CARD, TRANSFER, POS

    @Column(name = "recorded_by")
    private Long recordedBy;
}
