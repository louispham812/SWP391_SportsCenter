package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "membership_packages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MembershipPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    private Long packageId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "sport_id")
    private Long sportId;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "access_type", length = 20)
    private String accessType = "ALL_DAY"; // ALL_DAY, PEAK, OFF_PEAK

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE
}