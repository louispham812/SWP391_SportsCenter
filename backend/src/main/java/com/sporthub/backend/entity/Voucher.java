package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "voucher_id")
    private Long voucherId;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Builder.Default
    @Column(name = "discount_type", nullable = false, length = 20)
    private String discountType = "PERCENT"; // PERCENT, FIXED, EXTEND_DURATION

    @Column(name = "discount_value", precision = 12, scale = 2)
    private BigDecimal discountValue;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount;

    @Builder.Default
    @Column(name = "min_purchase", nullable = false, precision = 12, scale = 2)
    private BigDecimal minPurchase = BigDecimal.ZERO;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Builder.Default
    @Column(name = "usage_limit", nullable = false)
    private Integer usageLimit = 100;

    @Builder.Default
    @Column(name = "used_count", nullable = false)
    private Integer usedCount = 0;

    @Builder.Default
    @Column(name = "applies_to", nullable = false, length = 50)
    private String appliesTo = "ALL"; // ALL, MEMBERSHIP_ONLY, BOOKING_ONLY

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, EXPIRED
}
