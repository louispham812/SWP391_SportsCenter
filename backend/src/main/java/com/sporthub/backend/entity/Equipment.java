package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "equipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long itemId;

    @Column(name = "item_name", nullable = false, length = 150)
    private String itemName;

    @Column(nullable = false, length = 50)
    private String category; // Vợt, Giày, Khăn, Bóng, Phụ kiện

    @Column(name = "rental_price_per_hour", nullable = false, precision = 12, scale = 2)
    private BigDecimal rentalPricePerHour;

    @Column(name = "total_quantity", nullable = false)
    private Integer totalQuantity;

    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE, MAINTENANCE
}
