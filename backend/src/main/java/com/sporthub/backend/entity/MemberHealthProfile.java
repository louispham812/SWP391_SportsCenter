package com.sporthub.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "member_health_profiles")
@Getter
@Setter
@NoArgsConstructor
public class MemberHealthProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long profileId;

    @Column(name = "member_id", nullable = false, unique = true)
    private Long memberId;

    @Column(name = "fitness_level", length = 30)
    private String fitnessLevel;

    @Column(name = "fitness_goals", columnDefinition = "NVARCHAR(MAX)")
    private String fitnessGoals;

    @Column(name = "injury_history", columnDefinition = "NVARCHAR(MAX)")
    private String injuryHistory;

    @Column(name = "weight_kg", precision = 5, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "height_cm", precision = 5, scale = 2)
    private BigDecimal heightCm;

    @Column(name = "smm_kg", precision = 5, scale = 2)
    private BigDecimal smmKg;

    @Column(name = "pbf_percent", precision = 5, scale = 2)
    private BigDecimal pbfPercent;

    @Column(name = "bmi", precision = 5, scale = 2)
    private BigDecimal bmi;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
