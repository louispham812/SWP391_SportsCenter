package com.sporthub.backend.entity;

import com.sporthub.backend.enums.PackageType;
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

    @Builder.Default
    @Column(name = "access_type", length = 20)
    private String accessType = "ALL_DAY"; // ALL_DAY, PEAK, OFF_PEAK

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Builder.Default
    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE, INACTIVE

    // Package type and quota fields (added by migration 002)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "package_type", length = 20)
    private PackageType packageType = PackageType.VIP;

    @Builder.Default
    @Column(name = "quota_sessions")
    private Integer quotaSessions = 0;

    @Builder.Default
    @Column(name = "quota_courts")
    private Integer quotaCourts = 0;
}